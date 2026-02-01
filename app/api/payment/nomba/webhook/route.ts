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
    console.log('Webhook payload:', JSON.stringify(event, null, 2))

    // Validate webhook signature (if configured)
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET
    // Nomba sends signature in 'nomba-signature' header (not 'x-nomba-signature')
    const signature = request.headers.get('nomba-signature') || request.headers.get('nomba-sig-value')
    const timestamp = request.headers.get('nomba-timestamp')

    if (webhookSecret) {
      if (!signature) {
        console.error('Missing Nomba webhook signature')
        console.error('Headers received:', Object.fromEntries(request.headers.entries()))
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Verify HMAC signature using Nomba's format
      // Nomba signature verification: HMAC-SHA256 of the raw request body
      // Reference: https://docs.nomba.com/webhooks/security

      // Try multiple signature formats for compatibility
      const signatures = {
        // Method 1: HMAC of raw body (most common)
        rawBody: crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('base64'),

        // Method 2: HMAC of raw body (hex encoding)
        rawBodyHex: crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex'),

        // Method 3: Concatenated fields (legacy format)
        concatenated: crypto
          .createHmac('sha256', webhookSecret)
          .update([
            event.event_type || '',
            event.requestId || '',
            event.data?.transaction?.transactionId || '',
            timestamp || ''
          ].join(':'))
          .digest('base64'),
      }

      // Check if any signature format matches using timing-safe comparison
      const isValidSignature = Object.values(signatures).some(sig => {
        try {
          // Use timing-safe comparison to prevent timing attacks
          return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(sig)
          )
        } catch {
          // If timingSafeEqual throws (different buffer lengths), signatures don't match
          // Don't fall back to insecure string comparison
          return false
        }
      })

      if (!isValidSignature) {
        console.error('❌ Invalid Nomba webhook signature')
        console.error('Received signature:', signature)
        console.error('Tried formats:', Object.keys(signatures))
        console.error('Expected (rawBody base64):', signatures.rawBody)
        console.error('Expected (rawBody hex):', signatures.rawBodyHex)
        console.error('Event type:', event.event_type)
        console.error('Request ID:', event.requestId)

        // REJECT invalid signatures - security enforcement
        return NextResponse.json(
          {
            error: 'Invalid webhook signature',
            message: 'Webhook signature verification failed'
          },
          { status: 401 }
        )
      }

      console.log('✅ Nomba webhook signature verified successfully')
    } else {
      console.error('❌ NOMBA_WEBHOOK_SECRET not configured')
      console.error('❌ Webhook signature verification is REQUIRED in all environments')
      console.error('❌ Set NOMBA_WEBHOOK_SECRET immediately to enable webhook processing')

      // Require webhook secret in ALL environments (dev/staging/production)
      // This prevents forged webhooks in non-production environments
      return NextResponse.json(
        {
          error: 'Webhook signature verification required',
          message: 'NOMBA_WEBHOOK_SECRET must be configured to process webhooks'
        },
        { status: 401 }
      )
    }

    // Handle payment failure or cancellation
    if (event.event_type === 'payment_failed' || event.event_type === 'payment_cancelled') {
      const { data } = event
      const orderReference = data.order?.orderReference

      console.log(`Payment ${event.event_type} for order reference: ${orderReference}`)

      // Use admin client to bypass RLS when querying/updating orders
      const admin = createAdminClient()

      // Find order by payment reference
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('id, order_number, payment_status, status')
        .eq('payment_reference', orderReference)
        .single()

      if (orderError || !order) {
        console.error('Order not found for reference:', orderReference)
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Only update if not already paid
      if (order.payment_status !== 'paid') {
        const { error: updateError } = await admin
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)

        if (updateError) {
          console.error('Error updating order status:', updateError)
        } else {
          console.log(`✅ Order ${order.order_number} marked as cancelled/failed`)
        }
      }

      return NextResponse.json({ received: true })
    }

    // Handle successful payment
    if (event.event_type === 'payment_success') {
      const { data } = event

      // Handle different payload structures
      const orderReference = data.order?.orderReference || (data as any).orderReference || null
      const transactionId = data.transaction?.transactionId || (data as any).transactionId || null

      console.log(`Payment successful for order reference: ${orderReference}`)
      console.log(`Transaction ID: ${transactionId}`)

      if (!orderReference) {
        console.error('Order reference not found in webhook payload!')
        console.error('Data structure:', JSON.stringify(data, null, 2))
        return NextResponse.json(
          { error: 'Order reference missing in webhook payload' },
          { status: 400 }
        )
      }

      // Use admin client to bypass RLS when querying/updating orders
      const admin = createAdminClient()

      // Find order by payment reference
      const { data: order, error: orderError } = await admin
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
      const { error: updateError } = await admin
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

      // PHASE 1: CRITICAL DATABASE OPERATIONS (with transaction/rollback)
      // Note: admin client already created above for order update

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

      // 2. Process all rewards atomically (points, bonuses, referrals) with rollback on failure
      // NOTE: Promo code increment moved to AFTER successful payment processing
      if (profileId) {
        const { data: paymentResult, error: paymentError } = await admin.rpc('process_payment_atomically', {
          p_order_id: order.id,
          p_user_id: profileId,
          p_order_total: Number(order.total)
        })

        if (paymentError || !paymentResult || paymentResult.length === 0) {
          console.error('❌ Rewards processing failed:', paymentError)

          // Create admin notification for manual processing
          await admin.from('notifications').insert({
            user_id: null,
            type: 'reward_processing_failed',
            title: 'Reward Processing Failed',
            message: `Order ${order.order_number} was paid successfully but rewards failed. Manual processing required.`,
            metadata: {
              user_id: profileId,
              order_id: order.id,
              order_number: order.order_number,
              customer_email: order.customer_email,
              order_total: order.total,
              error: paymentError?.message || 'Unknown error'
            }
          })

          // CRITICAL: Don't rollback payment! Customer already paid.
          // Order stays confirmed, but rewards are pending manual processing.
          console.log(`⚠️ Order ${order.order_number} paid but rewards pending manual processing`)

          // Continue with the rest of the webhook (emails, syncs, etc.)
        }

        if (paymentResult && paymentResult.length > 0) {
          const result = paymentResult[0]

          if (!result.success) {
            console.error('❌ Rewards processing failed:', result.error_message)

            // Create notification but don't rollback payment
            await admin.from('notifications').insert({
              user_id: null,
              type: 'reward_processing_failed',
              title: 'Reward Processing Failed',
              message: `Order ${order.order_number} paid but rewards failed: ${result.error_message}`,
              metadata: {
                user_id: profileId,
                order_id: order.id,
                order_number: order.order_number,
                error: result.error_message
              }
            })

            console.log(`⚠️ Order ${order.order_number} paid but rewards failed, needs manual processing`)
          } else {
            console.log(`✅ Payment processed atomically:`, {
              points: result.points_awarded,
              firstOrderBonus: result.first_order_bonus_claimed,
              referralProcessed: result.referral_processed
            })

            // Increment promo code usage ONLY after successful payment processing
            // This prevents promo codes from being depleted by failed orders
            if (order.promo_code_id) {
              try {
                const { error: promoError } = await admin.rpc('increment_promo_usage', {
                  promo_id: order.promo_code_id
                })

                if (!promoError) {
                  console.log(`✅ Incremented promo code usage for: ${order.promo_code_id}`)
                } else {
                  console.error('⚠️ Error incrementing promo code usage:', promoError)
                  // Non-critical: Log for manual review but don't fail the webhook
                }
              } catch (promoError) {
                console.error('⚠️ Error incrementing promo code usage:', promoError)
                // Non-critical: Log for manual review but don't fail the webhook
              }
            }
          }
        }
      }

      // 5. Update customer streak (7-day system with ₦15,000 minimum)
      if (profileId) {
        try {
          const streakResult = await updateOrderStreak(
            profileId,
            Number(order.total), // Pass order total for qualification check
            true // Use admin client for webhooks
          )

          if (streakResult.streakCompleted) {
            console.log(`[Streak] 7-day streak completed! Awarded ${streakResult.awardedPoints} points`)
          } else if (streakResult.qualifiesForStreak) {
            console.log(`[Streak] Streak updated: ${streakResult.streak} days`)
          } else {
            console.log(`[Streak] Order doesn't qualify for streak: ${streakResult.message}`)
          }
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
          console.error('❌ Failed to send payment confirmation email:', emailResult.error);

          // CRITICAL: Track email failure for manual follow-up
          await admin.from('failed_notifications').insert({
            notification_type: 'payment_confirmation_email',
            order_id: order.id,
            order_number: order.order_number,
            recipient_email: order.customer_email,
            recipient_phone: order.customer_phone,
            error_message: emailResult.error || 'Unknown email error',
            metadata: {
              customer_name: order.customer_name,
              order_total: order.total,
              payment_method: 'nomba',
              transaction_reference: transactionId,
              attempt_count: 1
            },
            status: 'pending_retry',
            created_at: new Date().toISOString()
          });

          // Create admin notification for immediate attention
          await admin.from('notifications').insert({
            user_id: null, // Admin notification
            type: 'email_delivery_failed',
            title: 'Payment Confirmation Email Failed',
            message: `Failed to send payment confirmation to ${order.customer_email} for order ${order.order_number}`,
            metadata: {
              order_id: order.id,
              order_number: order.order_number,
              customer_email: order.customer_email,
              customer_name: order.customer_name,
              order_total: order.total,
              error: emailResult.error,
              action_required: 'Send manual confirmation or retry email delivery'
            },
            is_read: false,
            created_at: new Date().toISOString()
          });

          console.log(`⚠️ Email failure tracked for manual follow-up: Order ${order.order_number}`);
        } else {
          console.log('✅ Payment confirmation email sent to', order.customer_email);
        }
      } catch (emailError) {
        console.error('❌ Error sending payment confirmation email:', emailError);

        // Track critical email system failure
        await admin.from('failed_notifications').insert({
          notification_type: 'payment_confirmation_email',
          order_id: order.id,
          order_number: order.order_number,
          recipient_email: order.customer_email,
          recipient_phone: order.customer_phone,
          error_message: emailError instanceof Error ? emailError.message : 'Email system exception',
          metadata: {
            customer_name: order.customer_name,
            order_total: order.total,
            error_type: 'exception',
            stack_trace: emailError instanceof Error ? emailError.stack : undefined
          },
          status: 'pending_retry',
          created_at: new Date().toISOString()
        });

        // Alert admin of email system failure
        await admin.from('notifications').insert({
          user_id: null,
          type: 'email_system_error',
          title: 'Email System Error',
          message: `Email system error for order ${order.order_number}. Customer did not receive confirmation.`,
          metadata: {
            order_id: order.id,
            customer_email: order.customer_email,
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            urgency: 'high'
          },
          is_read: false
        });
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
            console.error('❌ Failed to send payment confirmation SMS:', smsResult.error);

            // Track SMS failure (lower priority than email, but still important)
            await admin.from('failed_notifications').insert({
              notification_type: 'payment_confirmation_sms',
              order_id: order.id,
              order_number: order.order_number,
              recipient_email: order.customer_email,
              recipient_phone: order.customer_phone,
              error_message: smsResult.error || 'Unknown SMS error',
              metadata: {
                customer_name: order.customer_name,
                order_total: order.total,
                attempt_count: 1
              },
              status: 'pending_retry',
              created_at: new Date().toISOString()
            });

            console.log(`⚠️ SMS failure tracked for retry: ${order.customer_phone}`);
          }
        } catch (smsError) {
          console.error('❌ Error sending payment confirmation SMS:', smsError);

          // Track SMS system error
          await admin.from('failed_notifications').insert({
            notification_type: 'payment_confirmation_sms',
            order_id: order.id,
            order_number: order.order_number,
            recipient_email: order.customer_email,
            recipient_phone: order.customer_phone,
            error_message: smsError instanceof Error ? smsError.message : 'SMS system exception',
            metadata: {
              customer_name: order.customer_name,
              error_type: 'exception'
            },
            status: 'pending_retry'
          });
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
