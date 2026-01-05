import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'

interface NombaWebhookEvent {
  event_type: string
  requestId: string
  data: {
    transaction: {
      transactionId: string
      type: string
      transactionAmount: number
      fee: number
      time: string
    }
    order: {
      orderReference: string
      customerEmail: string
      amount: number
      currency: string
      customerId: string
      callbackUrl: string
    }
    merchant?: {
      userId: string
      walletId: string
      walletBalance: number
    }
  }
}

// POST /api/payment/nomba/webhook - Handle Nomba webhook events
export async function POST(request: NextRequest) {
  try {
    const event: NombaWebhookEvent = await request.json()

    console.log('Nomba webhook event:', event.event_type)

    // Validate webhook secret (optional but recommended)
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET
    const signature = request.headers.get('x-nomba-signature')

    if (webhookSecret && signature) {
      // Verify signature if you have webhook secret configured
      // You'll need to implement HMAC verification similar to Paystack
      // For now, we'll skip this but it's recommended for production
    }

    // Handle successful payment
    if (event.event_type === 'payment_success') {
      const { data } = event
      const orderReference = data.order.orderReference
      const transactionId = data.transaction.transactionId

      console.log(`Payment successful for order reference: ${orderReference}`)

      const supabase = createClient()

      // Find order by payment reference
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('payment_reference', orderReference)
        .single()

      if (orderError || !order) {
        console.error('Order not found for reference:', orderReference)
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_reference: transactionId,
          paid_at: new Date().toISOString(),
          status: 'confirmed',
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error updating order from webhook:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      console.log(`Order ${order.id} payment confirmed via Nomba webhook`)

      const admin = createAdminClient()

      // 1. Check if customer profile exists, create and sync if not
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, zoho_contact_id, embedly_customer_id')
        .eq('email', order.customer_email)
        .single()

      let profileId = existingProfile?.id

      // If customer doesn't exist or hasn't been synced to integrations
      if (!existingProfile) {
        console.log(`Creating profile for new customer: ${order.customer_email}`)

        // Create guest profile for order tracking
        const { data: newProfile } = await admin
          .from('profiles')
          .insert({
            email: order.customer_email,
            full_name: order.customer_name,
            phone: order.customer_phone,
            role: 'customer',
          })
          .select()
          .single()

        profileId = newProfile?.id

        // Auto-sync new customer to integrations
        if (profileId) {
          console.log(`Auto-syncing new customer to integrations...`)
          const syncResult = await syncNewCustomer({
            id: profileId,
            email: order.customer_email,
            full_name: order.customer_name,
            phone: order.customer_phone,
            address: order.delivery_address_text,
          })

          if (syncResult.zoho?.contact_id) {
            console.log(`✅ Synced to Zoho CRM: ${syncResult.zoho.contact_id}`)
          }
          if (syncResult.embedly?.customer_id) {
            console.log(`✅ Synced to Embedly: ${syncResult.embedly.customer_id}`)
          }
        }
      } else if (!existingProfile.zoho_contact_id && !existingProfile.embedly_customer_id) {
        // Customer exists but never synced - sync them now
        console.log(`Auto-syncing existing customer to integrations...`)
        const syncResult = await syncNewCustomer({
          id: existingProfile.id,
          email: order.customer_email,
          full_name: order.customer_name,
          phone: order.customer_phone,
          address: order.delivery_address_text,
        })

        if (syncResult.zoho?.contact_id) {
          console.log(`✅ Synced to Zoho CRM: ${syncResult.zoho.contact_id}`)
        }
        if (syncResult.embedly?.customer_id) {
          console.log(`✅ Synced to Embedly: ${syncResult.embedly.customer_id}`)
        }
      }

      // 2. Sync order to Zoho CRM and credit Embedly loyalty points
      const syncResult = await syncOrderCompletion({
        id: order.id,
        order_number: order.order_number,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        total: order.total,
        status: 'confirmed',
      })

      if (syncResult.points_earned) {
        console.log(`✅ Credited ${syncResult.points_earned} loyalty points`)
      }
      if (syncResult.zoho_deal_id) {
        console.log(`✅ Created Zoho deal: ${syncResult.zoho_deal_id}`)
      }

      // 3. Increment promo code usage if a promo code was used
      if (order.promo_code_id) {
        try {
          const { data: promoCode } = await admin
            .from('promo_codes')
            .select('used_count')
            .eq('id', order.promo_code_id)
            .single()

          if (promoCode) {
            const { error: promoError } = await admin
              .from('promo_codes')
              .update({ used_count: (promoCode.used_count || 0) + 1 })
              .eq('id', order.promo_code_id)

            if (!promoError) {
              console.log(`✅ Incremented promo code usage for: ${order.promo_code_id}`)
            } else {
              console.error('Error incrementing promo code usage:', promoError)
            }
          }
        } catch (promoError) {
          console.error('Error incrementing promo code usage:', promoError)
        }
      }

      // 4. Award purchase points (₦100 = 1 point)
      const purchasePoints = Math.floor(Number(order.total) / 100)

      if (purchasePoints > 0 && profileId) {
        const { error: pointsError } = await admin.rpc('award_points', {
          p_user_id: profileId,
          p_reward_type: 'purchase',
          p_points: purchasePoints,
          p_amount_spent: Number(order.total),
          p_description: `Points earned from order #${order.order_number}`,
          p_metadata: { order_id: order.id, order_number: order.order_number }
        })

        if (!pointsError) {
          console.log(`✅ Awarded ${purchasePoints} points for ₦${order.total} spent`)
        } else {
          console.error('Error awarding points:', pointsError)
        }
      }

      // 5. Check and award first order bonus
      if (profileId) {
        const { data: existingClaim } = await admin
          .from('reward_claims')
          .select('id')
          .eq('user_id', profileId)
          .eq('reward_type', 'first_order')
          .maybeSingle()

        if (!existingClaim) {
          // Award first order bonus (15 points)
          const { error: firstOrderError } = await admin.rpc('claim_reward', {
            p_user_id: profileId,
            p_reward_type: 'first_order',
            p_points: 15,
            p_description: 'First order bonus',
            p_metadata: { order_id: order.id, order_number: order.order_number }
          })

          if (!firstOrderError) {
            console.log(`✅ Awarded 15 points for first order`)
          } else {
            console.error('Error awarding first order bonus:', firstOrderError)
          }
        }
      }

      // TODO: Send email confirmation to customer
      // TODO: Send SMS notification
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Nomba webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
