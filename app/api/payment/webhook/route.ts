import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'
import crypto from 'crypto'

// POST /api/payment/webhook - Handle Paystack webhook events
export async function POST(request: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Get the signature from headers
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('No signature in webhook request')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Get raw body
    const body = await request.text()

    // Validate signature
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the webhook event
    const event = JSON.parse(body)

    console.log('Paystack webhook event:', event.event)

    // Handle different event types
    if (event.event === 'charge.success') {
      const { data } = event

      // Extract order ID from metadata
      const orderId = data.metadata?.order_id

      if (orderId) {
        const supabase = await createClient()

        // Update order payment status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_reference: data.reference,
            paid_at: new Date().toISOString(),
            status: 'confirmed', // Automatically confirm order when paid
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Error updating order from webhook:', updateError)
        } else {
          console.log(`Order ${orderId} payment confirmed via webhook`)

          // Fetch order details
          const admin = createAdminClient()
          const { data: order } = await admin
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single()

          if (order) {
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

            // 3. Award purchase points (₦100 = 1 point)
            const purchasePoints = Math.floor(Number(order.total) / 100);

            if (purchasePoints > 0 && profileId) {
              const { error: pointsError } = await admin.rpc('award_points', {
                p_user_id: profileId,
                p_reward_type: 'purchase',
                p_points: purchasePoints,
                p_amount_spent: Number(order.total),
                p_description: `Points earned from order #${order.order_number}`,
                p_metadata: { order_id: order.id, order_number: order.order_number }
              });

              if (!pointsError) {
                console.log(`✅ Awarded ${purchasePoints} points for ₦${order.total} spent`)
              } else {
                console.error('Error awarding points:', pointsError)
              }
            }

            // 4. Check and award first order bonus
            if (profileId) {
              const { data: existingClaim } = await admin
                .from('reward_claims')
                .select('id')
                .eq('user_id', profileId)
                .eq('reward_type', 'first_order')
                .maybeSingle();

              if (!existingClaim) {
                // Award first order bonus (15 points)
                const { error: firstOrderError } = await admin.rpc('claim_reward', {
                  p_user_id: profileId,
                  p_reward_type: 'first_order',
                  p_points: 15,
                  p_description: 'First order bonus',
                  p_metadata: { order_id: order.id, order_number: order.order_number }
                });

                if (!firstOrderError) {
                  console.log(`✅ Awarded 15 points for first order`)
                } else {
                  console.error('Error awarding first order bonus:', firstOrderError)
                }
              }
            }
          }
        }

        // TODO: Send email confirmation to customer
        // TODO: Send SMS notification
      }
    } else if (event.event === 'charge.failed') {
      console.log('Payment failed:', event.data.reference)

      // Optionally update order status to failed
      const orderId = event.data.metadata?.order_id
      if (orderId) {
        const supabase = await createClient()
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
