import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'
import { sendPaymentConfirmation, sendOrderNotification } from '@/lib/emails/service'
import { sendPaymentConfirmationSMS, isSMSEnabled } from '@/lib/notifications/sms'
import { updateOrderStreak } from '@/lib/streak/helper'
import { loggers } from '@/lib/logger'
import crypto from 'crypto'

// POST /api/payment/webhook - Handle Paystack webhook events
export async function POST(request: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    // Get the signature from headers
    const signature = request.headers.get('x-paystack-signature')

    // Get raw body
    const body = await request.text()

    // Verify webhook signature if secret is configured
    if (paystackSecretKey) {
      if (!signature) {
        loggers.webhook.error('No signature in webhook request')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      // Validate signature
      const hash = crypto
        .createHmac('sha512', paystackSecretKey)
        .update(body)
        .digest('hex')

      if (hash !== signature) {
        loggers.webhook.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      loggers.webhook.info('Paystack webhook signature verified')
    } else {
      // In production, require secret key
      if (process.env.NODE_ENV === 'production') {
        loggers.webhook.error('PAYSTACK_SECRET_KEY not configured in PRODUCTION')
        return NextResponse.json(
          { error: 'Payment gateway not configured' },
          { status: 500 }
        )
      }

      // In dev/staging, allow webhooks without secret for testing
      loggers.webhook.warn('PAYSTACK_SECRET_KEY not configured - allowing webhook for testing')
      loggers.webhook.warn('This is only allowed in development/staging environments')
      loggers.webhook.warn('Production deployments MUST have PAYSTACK_SECRET_KEY set')
    }

    // Parse the webhook event
    const event = JSON.parse(body)

    loggers.webhook.info('Paystack webhook event received', { event: event.event })

    // Validate event structure
    if (!event || typeof event !== 'object') {
      loggers.webhook.error('Invalid webhook event structure')
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      )
    }

    // Handle different event types
    if (event.event === 'charge.success') {
      const { data } = event

      // Validate payment data exists
      if (!data || typeof data !== 'object') {
        loggers.webhook.error('Missing payment data in webhook event')
        return NextResponse.json(
          { error: 'Invalid payment data' },
          { status: 400 }
        )
      }

      // Validate payment reference
      if (!data.reference) {
        loggers.webhook.error('Missing payment reference in webhook')
        return NextResponse.json(
          { error: 'Missing payment reference' },
          { status: 400 }
        )
      }

      // Extract order ID from metadata
      const orderId = data.metadata?.order_id

      if (!orderId) {
        loggers.webhook.error('Missing order_id in payment metadata', { reference: data.reference })
        return NextResponse.json(
          { error: 'Missing order ID in metadata' },
          { status: 400 }
        )
      }

      if (orderId) {
        const admin = createAdminClient()

        // Idempotency: Check if this payment reference has already been processed
        const { data: existingOrder, error: orderCheckError } = await admin
          .from('orders')
          .select('id, payment_status, payment_reference')
          .eq('id', orderId)
          .single()

        if (orderCheckError) {
          loggers.webhook.error('Error checking existing order', orderCheckError, { orderId })
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        if (existingOrder?.payment_status === 'paid' &&
            existingOrder?.payment_reference === data.reference) {
          loggers.webhook.info('Order already processed', { orderId, reference: data.reference })
          return NextResponse.json({ success: true, message: 'Already processed' })
        }

        // Update order payment status with optimistic locking
        const supabase = await createClient()
        const { data: updateResult, error: updateError, count } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_reference: data.reference,
            paid_at: new Date().toISOString(),
            status: 'confirmed', // Automatically confirm order when paid
          })
          .eq('id', orderId)
          .eq('payment_status', 'pending') // Only update if still pending - prevents race conditions
          .select()

        if (updateError) {
          loggers.webhook.error('Error updating order from webhook', updateError, { orderId })
          return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
          )
        }

        // CRITICAL: Check if update actually modified a row
        // If count is 0, another webhook already processed this payment
        if (!updateResult || updateResult.length === 0) {
          loggers.webhook.info('Order already processed by another webhook - skipping side effects', {
            orderId,
            reference: data.reference
          })
          return NextResponse.json({ success: true, message: 'Already processed' })
        }

        // If we got here, THIS webhook won the race and should process side effects
        console.log(`Order ${orderId} payment confirmed via webhook - processing rewards`)

        // Fetch order details
      const { data: order, error: orderFetchError } = await admin
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single()

        if (orderFetchError || !order) {
          console.error('Error fetching order details:', orderFetchError)
          return NextResponse.json(
            { error: 'Failed to fetch order details' },
            { status: 500 }
          )
        }

        // Validate required order fields
        if (!order.customer_email || !order.customer_name) {
          loggers.webhook.error('Order missing required customer fields', { orderId })
          return NextResponse.json(
            { error: 'Order data incomplete' },
            { status: 500 }
          )
        }

        // 1. Check if customer profile exists, create and sync if not
        const { data: existingProfile, error: profileError } = await admin
          .from('profiles')
          .select('id, zoho_contact_id, embedly_customer_id')
          .eq('email', order.customer_email)
          .single()

          // Profile not found is OK (guest checkout), other errors are not
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking customer profile:', profileError)
          }

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

          // 3. Increment promo code usage atomically if a promo code was used
          if (order.promo_code_id) {
            try {
              // Use atomic RPC function to prevent race conditions
              const { data: promoResult, error: promoError } = await admin.rpc('increment_promo_usage', {
                promo_id: order.promo_code_id
              });

              if (!promoError && promoResult && promoResult.length > 0) {
                const result = promoResult[0];
                if (result.success) {
                  console.log(`✅ Incremented promo code usage for: ${order.promo_code_id}`)
                } else {
                  console.error(`⚠️ Promo code increment failed: ${result.error_message}`)
                }
              } else if (!promoError) {
                console.log(`✅ Incremented promo code usage for: ${order.promo_code_id}`)
              } else {
                console.error('⚠️ Error incrementing promo code usage:', promoError)
              }
            } catch (promoError) {
              console.error('⚠️ Error incrementing promo code usage:', promoError)
            }
          }

          // 4. Award purchase points (₦100 = 1 point)
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

          // 5. Update customer streak (7-day system with ₦15,000 minimum)
          if (profileId) {
            try {
              const streakResult = await updateOrderStreak(
                profileId,
                Number(order.total), // Pass order total for qualification check
                true // Use admin client for webhooks
              );

              if (streakResult.streakCompleted) {
                console.log(`[Streak] 7-day streak completed! Awarded ${streakResult.awardedPoints} points`);
              } else if (streakResult.qualifiesForStreak) {
                console.log(`[Streak] Streak updated: ${streakResult.streak} days`);
              } else {
                console.log(`[Streak] Order doesn't qualify for streak: ${streakResult.message}`);
              }
            } catch (streakError) {
              console.error('Error in streak update:', streakError);
            }
          }

          // Send payment confirmation email to customer
          try {
            const emailResult = await sendPaymentConfirmation({
              orderNumber: order.order_number,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              amount: data.amount / 100, // Convert from kobo to naira
              paymentMethod: 'paystack',
              transactionReference: data.reference,
              trackingToken: order.tracking_token,
            });

            if (!emailResult.success) {
              console.error('❌ Failed to send payment confirmation email:', emailResult.error);

              // Track email failure for manual follow-up
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
                  payment_method: 'paystack',
                  transaction_reference: data.reference,
                  attempt_count: 1
                },
                status: 'pending_retry',
                created_at: new Date().toISOString()
              });

              // Create admin notification
              await admin.from('notifications').insert({
                user_id: null,
                type: 'email_delivery_failed',
                title: 'Payment Confirmation Email Failed',
                message: `Failed to send payment confirmation to ${order.customer_email} for order ${order.order_number}`,
                metadata: {
                  order_id: order.id,
                  order_number: order.order_number,
                  customer_email: order.customer_email,
                  error: emailResult.error,
                  action_required: 'Send manual confirmation or retry email delivery'
                },
                is_read: false
              });
            } else {
              console.log('✅ Payment confirmation email sent to', order.customer_email);
            }
          } catch (emailError) {
            console.error('❌ Error sending payment confirmation email:', emailError);

            // Track email system failure
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
              status: 'pending_retry'
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
              paymentMethod: 'paystack',
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
                amount: (data.amount / 100).toLocaleString(),
              });

              if (smsResult.success) {
                console.log('✅ Payment confirmation SMS sent to', order.customer_phone);
              } else {
                console.error('❌ Failed to send payment confirmation SMS:', smsResult.error);

                // Track SMS failure
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
                  status: 'pending_retry'
                });
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
  } catch (error: unknown) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
