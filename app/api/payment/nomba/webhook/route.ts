import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'
import { sendPaymentConfirmation, sendOrderNotification } from '@/lib/emails/service'
import { sendPaymentConfirmationSMS, isSMSEnabled } from '@/lib/notifications/sms'
import { updateOrderStreak } from '@/lib/streak/helper'
import crypto from 'crypto'

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
    // Get raw body first for signature verification
    const rawBody = await request.text()
    const event: NombaWebhookEvent = JSON.parse(rawBody)

    console.log('Nomba webhook event:', event.event_type)

    // Validate webhook signature (if configured)
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET
    const signature = request.headers.get('x-nomba-signature')

    if (webhookSecret) {
      if (!signature) {
        console.error('Missing Nomba webhook signature')
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Verify HMAC signature
      // Nomba uses HMAC-SHA512 with the webhook secret
      const expectedSignature = crypto
        .createHmac('sha512', webhookSecret)
        .update(rawBody)
        .digest('hex')

      // Compare signatures securely
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        console.error('Invalid Nomba webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      console.log('✅ Nomba webhook signature verified')
    } else {
      console.warn('⚠️  NOMBA_WEBHOOK_SECRET not set - skipping signature verification (recommended for production)')
    }

    // Handle successful payment
    if (event.event_type === 'payment_success') {
      const { data } = event
      const orderReference = data.order.orderReference
      const transactionId = data.transaction.transactionId

      console.log(`Payment successful for order reference: ${orderReference}`)

      const supabase = await createClient()

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

      // Idempotency: Skip if already paid
      if (order.payment_status === 'paid') {
        console.log(`✓ Order ${order.order_number} already processed`)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
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

      // PHASE 1: CRITICAL DATABASE OPERATIONS (with transaction/rollback)

      // 1. Get or create customer profile
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, zoho_contact_id, embedly_customer_id')
        .eq('email', order.customer_email)
        .single()

      let profileId = existingProfile?.id
      let needsSync = false

      if (!existingProfile) {
        console.log(`Creating profile for new customer: ${order.customer_email}`)

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
        needsSync = true
      } else if (!existingProfile.zoho_contact_id && !existingProfile.embedly_customer_id) {
        needsSync = true
      }

      // 2. Increment promo code usage atomically
      if (order.promo_code_id) {
        try {
          const { error: promoError } = await admin.rpc('increment_promo_usage', {
            promo_id: order.promo_code_id
          })

          if (!promoError) {
            console.log(`✅ Incremented promo code usage for: ${order.promo_code_id}`)
          } else {
            console.error('Error incrementing promo code usage:', promoError)
          }
        } catch (promoError) {
          console.error('Error incrementing promo code usage:', promoError)
        }
      }

      // 4. Process all rewards atomically (points, bonuses, referrals) with rollback on failure
      if (profileId) {
        const { data: paymentResult, error: paymentError } = await admin.rpc('process_payment_atomically', {
          p_order_id: order.id,
          p_user_id: profileId,
          p_order_total: Number(order.total)
        })

        if (paymentError || !paymentResult || paymentResult.length === 0) {
          console.error('❌ Payment processing failed:', paymentError)

          // Create admin notification
          await admin.from('notifications').insert({
            user_id: null,
            type: 'payment_processing_failed',
            title: 'Payment Processing Failed',
            message: `Failed to process rewards for order ${order.order_number}`,
            metadata: {
              user_id: profileId,
              order_id: order.id,
              order_number: order.order_number,
              error: paymentError?.message || 'Unknown error'
            }
          })

          // Rollback order status since rewards failed
          await admin.from('orders').update({
            payment_status: 'pending',
            status: 'pending'
          }).eq('id', order.id)

          return NextResponse.json(
            { error: 'Payment processing failed, order rolled back' },
            { status: 500 }
          )
        }

        const result = paymentResult[0]

        if (!result.success) {
          console.error('❌ Rewards processing failed:', result.error_message)

          // Rollback order
          await admin.from('orders').update({
            payment_status: 'pending',
            status: 'pending'
          }).eq('id', order.id)

          return NextResponse.json(
            { error: result.error_message },
            { status: 500 }
          )
        }

        console.log(`✅ Payment processed atomically:`, {
          points: result.points_awarded,
          firstOrderBonus: result.first_order_bonus_claimed,
          referralProcessed: result.referral_processed
        })
      }

      // 5. Update customer streak
      if (profileId) {
        try {
          await updateOrderStreak(profileId)
        } catch (streakError) {
          console.error('Error in streak update:', streakError)
        }
      }

      // PHASE 2: EXTERNAL SERVICE SYNCS (best effort, failures logged but don't block)

      // 6. Sync customer to external services (Zoho CRM, Embedly)
      if (profileId && needsSync) {
        try {
          console.log(`Syncing customer to external integrations...`)
          const customerSyncResult = await syncNewCustomer({
            id: profileId,
            email: order.customer_email,
            full_name: order.customer_name,
            phone: order.customer_phone,
            address: order.delivery_address_text,
          })

          if (customerSyncResult.zoho?.contact_id) {
            console.log(`✅ Synced to Zoho CRM: ${customerSyncResult.zoho.contact_id}`)
          }
          if (customerSyncResult.embedly?.customer_id) {
            console.log(`✅ Synced to Embedly: ${customerSyncResult.embedly.customer_id}`)
          }
        } catch (syncError) {
          console.error('⚠️ Customer sync failed (non-critical):', syncError)
          // Log for manual retry but don't fail the webhook
        }
      }

      // 7. Sync order to external services
      try {
        const orderSyncResult = await syncOrderCompletion({
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          total: order.total,
          status: 'confirmed',
        })

        if (orderSyncResult.points_earned) {
          console.log(`✅ Credited ${orderSyncResult.points_earned} Embedly loyalty points`)
        }
        if (orderSyncResult.zoho_deal_id) {
          console.log(`✅ Created Zoho deal: ${orderSyncResult.zoho_deal_id}`)
        }
      } catch (syncError) {
        console.error('⚠️ Order sync failed (non-critical):', syncError)
        // Log for manual retry but don't fail the webhook
      }

      // PHASE 3: NOTIFICATIONS (best effort)

      // 8. Send payment confirmation email to customer
      try {
        const emailResult = await sendPaymentConfirmation({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          amount: data.transaction.transactionAmount,
          paymentMethod: 'nomba',
          transactionReference: transactionId,
        });

        if (!emailResult.success) {
          console.error('Failed to send payment confirmation email:', emailResult.error);
        } else {
          console.log('✅ Payment confirmation email sent to', order.customer_email);
        }
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError);
      }

      // Send order notification email to admin
      try {
        const notificationResult = await sendOrderNotification({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          items: order.order_items || [],
          total: order.total,
          deliveryAddress: order.delivery_address_text,
          paymentMethod: 'nomba',
        });

        if (!notificationResult.success) {
          console.error('Failed to send order notification email:', notificationResult.error);
        } else {
          console.log('✅ Order notification email sent to admin');
        }
      } catch (emailError) {
        console.error('Error sending order notification email:', emailError);
      }

      // Send SMS notification to customer
      if (isSMSEnabled() && order.customer_phone) {
        try {
          const smsResult = await sendPaymentConfirmationSMS(order.customer_phone, {
            orderNumber: order.order_number,
            amount: data.transaction.transactionAmount.toLocaleString(),
          });

          if (smsResult.success) {
            console.log('✅ Payment confirmation SMS sent to', order.customer_phone);
          } else {
            console.error('Failed to send payment confirmation SMS:', smsResult.error);
          }
        } catch (smsError) {
          console.error('Error sending payment confirmation SMS:', smsError);
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Nomba webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
