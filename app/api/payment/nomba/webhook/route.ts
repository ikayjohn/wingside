import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'
import { sendPaymentConfirmation, sendOrderNotification } from '@/lib/emails/service'
import { sendPaymentConfirmationSMS, isSMSEnabled } from '@/lib/notifications/sms'
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
            console.error('❌ Error awarding first order bonus:', firstOrderError)
          }
        }
      }

      // 5.5. Process referral rewards (if user was referred and this is first order ≥₦1000)
      if (profileId && order.total >= 1000) {
        try {
          const { data: rewardResult, error: referralError } = await admin.rpc(
            'process_referral_reward_after_first_order',
            {
              user_id: profileId,
              order_amount: order.total
            }
          )

          if (referralError) {
            console.error('❌ Referral reward processing failed:', {
              userId: profileId,
              orderId: order.id,
              orderNumber: order.order_number,
              error: referralError
            })

            // Create admin notification
            await admin.from('notifications').insert({
              user_id: null,
              type: 'referral_reward_failed',
              title: 'Referral Reward Processing Failed',
              message: `Failed to process referral reward for order ${order.order_number}`,
              metadata: {
                user_id: profileId,
                order_id: order.id,
                order_number: order.order_number,
                error: referralError.message
              }
            })
          } else if (rewardResult && rewardResult.length > 0) {
            const result = rewardResult[0];

            if (result.success) {
              console.log('✅ Referral reward processing completed:', {
                userId: profileId,
                referrerCredited: result.referrer_credited,
                referredCredited: result.referred_credited,
                errorMessage: result.error_message
              });

              // Check if any wallet credit failed
              if (!result.referrer_credited || !result.referred_credited) {
                await admin.from('notifications').insert({
                  user_id: null,
                  type: 'referral_reward_partial_failure',
                  title: 'Referral Reward Partially Failed',
                  message: `Order ${order.order_number}: ${result.error_message}`,
                  metadata: {
                    user_id: profileId,
                    order_id: order.id,
                    order_number: order.order_number,
                    referrer_credited: result.referrer_credited,
                    referred_credited: result.referred_credited,
                    error: result.error_message
                  }
                });
                console.warn('⚠️ Referral reward partially failed:', result.error_message);
              }
            } else {
              console.log('ℹ️ No referral reward to process:', result.error_message);
            }
          } else {
            console.log('ℹ️ No referral reward data returned');
          }
        } catch (error) {
          console.error('❌ Error in referral processing:', error)
        }
      }

      // 6. Update customer streak
      if (profileId) {
        try {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const { data: profile } = await admin
            .from('profiles')
            .select('current_streak, longest_streak, last_order_date, streak_start_date')
            .eq('id', profileId)
            .single()

          if (profile) {
            const lastOrderDate = profile.last_order_date
              ? new Date(profile.last_order_date)
              : null

            if (lastOrderDate) {
              lastOrderDate.setHours(0, 0, 0, 0)
            }

            const oneDayMs = 24 * 60 * 60 * 1000
            const daysDiff = lastOrderDate
              ? Math.floor((today.getTime() - lastOrderDate.getTime()) / oneDayMs)
              : null

            let currentStreak = profile.current_streak || 0
            let longestStreak = profile.longest_streak || 0
            let streakStartDate = profile.streak_start_date
              ? new Date(profile.streak_start_date)
              : today

            if (!lastOrderDate) {
              // First order ever
              currentStreak = 1
              streakStartDate = today
            } else if (daysDiff === 0) {
              // Same day - already updated
              console.log('📊 Streak already updated today')
            } else if (daysDiff === 1) {
              // Consecutive day - increment streak
              currentStreak += 1
            } else {
              // Streak broken - start new streak
              currentStreak = 1
              streakStartDate = today
            }

            // Update longest streak if needed
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak
            }

            // Update profile
            const { error: streakError } = await admin
              .from('profiles')
              .update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_order_date: today.toISOString().split('T')[0],
                streak_start_date: streakStartDate.toISOString().split('T')[0],
              })
              .eq('id', profileId)

            if (!streakError) {
              console.log(`🔥 Streak updated: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}`)
            } else {
              console.error('Error updating streak:', streakError)
            }
          }
        } catch (streakError) {
          console.error('Error in streak update:', streakError)
        }
      }

      // Send payment confirmation email to customer
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
