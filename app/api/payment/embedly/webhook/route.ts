import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncNewCustomer, syncOrderCompletion } from '@/lib/integrations'
import { sendPaymentConfirmation, sendOrderNotification } from '@/lib/emails/service'
import { sendPaymentConfirmationSMS, isSMSEnabled } from '@/lib/notifications/sms'
import { updateOrderStreak } from '@/lib/streak/helper'

/**
 * POST /api/payment/embedly/webhook
 *
 * Handle Embedly checkout payment notifications
 * Webhook is called when customer transfers money to checkout wallet
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const event = JSON.parse(rawBody)

    console.log('[Embedly Webhook] Received event:', event.event)
    console.log('[Embedly Webhook] Payload:', JSON.stringify(event, null, 2))

    // Verify webhook signature (if configured)
    // Embedly sends X-Auth-Signature header with sha256(secret)
    const webhookSecret = process.env.EMBEDLY_WEBHOOK_SECRET

    if (webhookSecret) {
      const signature = request.headers.get('x-auth-signature')

      if (!signature) {
        console.error('[Embedly Webhook] Missing X-Auth-Signature header')
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Embedly signature is sha256(secret) per their docs
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHash('sha256')
        .update(webhookSecret)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('[Embedly Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      console.log('[Embedly Webhook] Signature verified')
    } else {
      console.warn('[Embedly Webhook] No webhook secret configured - skipping verification')
    }

    // Handle checkout payment success event
    // Embedly sends event name "checkout.payment.success" per their docs
    if (event.event === 'checkout.payment.success') {
      const { data } = event

      if (!data) {
        console.error('[Embedly Webhook] Missing event data')
        return NextResponse.json(
          { error: 'Missing event data' },
          { status: 400 }
        )
      }

      // Field names from Embedly's checkout.payment.success webhook payload:
      // walletId, checkoutRef, amount (in Naira), transactionId,
      // senderAccountNumber, senderName, reference, status
      const walletId = data.walletId
      const checkoutRef = data.checkoutRef
      const amount = data.amount // Naira (not kobo)
      const transactionId = data.transactionId || data.reference
      const senderAccountNumber = data.senderAccountNumber
      const senderName = data.senderName

      console.log('[Embedly Webhook] Payment received:', {
        walletId,
        checkoutRef,
        amount,
        transactionId,
        senderAccountNumber,
        senderName,
      })

      // Use admin client to bypass RLS
      const admin = createAdminClient()

      // Find order by checkout reference or wallet ID
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*, order_items(*)')
        .or(`payment_reference.eq.${walletId},checkout_ref.eq.${checkoutRef}`)
        .single()

      if (orderError || !order) {
        console.error('[Embedly Webhook] Order not found for:', { walletId, checkoutRef })
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      console.log('[Embedly Webhook] Found order:', order.order_number)

      // Idempotency: Skip if already paid
      if (order.payment_status === 'paid') {
        console.log('[Embedly Webhook] Order already processed')
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Validate payment amount (Embedly sends amount in Naira)
      const expectedAmount = Number(order.total)
      const receivedAmount = Number(amount)

      if (Math.abs(receivedAmount - expectedAmount) > 1) { // Allow 1 Naira variance
        console.warn('[Embedly Webhook] Amount mismatch:', {
          expected: expectedAmount,
          received: receivedAmount,
          variance: Math.abs(receivedAmount - expectedAmount),
        })

        // Don't reject - allow for manual review
        // Log to notifications for admin review
        await admin.from('notifications').insert({
          user_id: null,
          type: 'amount_mismatch',
          title: 'Payment Amount Mismatch',
          message: `Order ${order.order_number} received ₦${receivedAmount.toLocaleString()} but expected ₦${expectedAmount.toLocaleString()}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            expected_amount: expectedAmount,
            received_amount: receivedAmount,
            transaction_id: transactionId,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      // Update order payment status
      const { error: updateError } = await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('[Embedly Webhook] ❌ Error updating order:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      console.log('[Embedly Webhook] ✅ Order payment confirmed:', order.order_number)

      // Process rewards and sync (similar to Nomba webhook)
      await processOrderFulfillment(admin, order, transactionId)

      return NextResponse.json({ success: true, received: true })
    }

    // Handle other events
    console.log('[Embedly Webhook] Unhandled event type:', event.event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Embedly Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process order fulfillment (rewards, sync, notifications)
 * Shared logic between payment gateways
 */
async function processOrderFulfillment(admin: any, order: any, transactionId: string) {
  // 1. Get or create customer profile
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, zoho_contact_id, embedly_customer_id')
    .eq('email', order.customer_email)
    .single()

  let profileId = existingProfile?.id
  let needsSync = false

  if (!existingProfile) {
    console.log(`[Embedly Webhook] Creating profile for: ${order.customer_email}`)

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

  // 2. Process rewards atomically
  if (!profileId) {
    console.error(`[Embedly Webhook] ❌ No profileId for order ${order.order_number} (${order.customer_email}) — rewards skipped`)
    await admin.from('notifications').insert({
      user_id: null,
      type: 'reward_processing_failed',
      title: 'Rewards Skipped - No Profile',
      message: `Order ${order.order_number} paid but no customer profile found/created for ${order.customer_email}. Rewards not awarded.`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        order_total: order.total,
        reason: 'profile_not_found_or_created',
        gateway: 'embedly'
      }
    })
  }

  if (profileId) {
    const { data: paymentResult } = await admin.rpc('process_payment_atomically', {
      p_order_id: order.id,
      p_user_id: profileId,
      p_order_total: Number(order.total),
    })

    if (paymentResult && paymentResult.length > 0) {
      const result = paymentResult[0]

      if (result.success) {
        console.log('[Embedly Webhook] ✅ Rewards processed:', {
          points: result.points_awarded,
          firstOrderBonus: result.first_order_bonus_claimed,
          referralProcessed: result.referral_processed,
        })

        // Increment promo code usage
        if (order.promo_code_id) {
          await admin.rpc('increment_promo_usage', {
            promo_id: order.promo_code_id,
          })
        }
      } else {
        console.error('[Embedly Webhook] ❌ Rewards failed:', result.error_message)
      }
    }
  }

  // 3. Update streak
  if (profileId) {
    try {
      const streakResult = await updateOrderStreak(profileId, Number(order.total), true)

      if (streakResult.streakCompleted) {
        console.log(`[Embedly Webhook] 7-day streak completed! +${streakResult.awardedPoints} points`)
      }
    } catch (streakError) {
      console.error('[Embedly Webhook] Streak error:', streakError)
    }
  }

  // 4. Sync customer to external services
  if (profileId && needsSync) {
    try {
      const customerSyncResult = await syncNewCustomer({
        id: profileId,
        email: order.customer_email,
        full_name: order.customer_name,
        phone: order.customer_phone,
        address: order.delivery_address_text,
      })

      console.log('[Embedly Webhook] ✅ Customer synced:', customerSyncResult)
    } catch (syncError) {
      console.error('[Embedly Webhook] ⚠️  Customer sync failed (non-critical):', syncError)
    }
  }

  // 5. Sync order completion
  try {
    const orderSyncResult = await syncOrderCompletion({
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total: order.total,
      status: 'confirmed',
    })

    console.log('[Embedly Webhook] ✅ Order synced:', {
      points: orderSyncResult.points_earned,
      zohoDeal: orderSyncResult.zoho_deal_id,
    })
  } catch (syncError) {
    console.error('[Embedly Webhook] ⚠️  Order sync failed (non-critical):', syncError)
  }

  // 6. Send payment confirmation email
  try {
    const emailResult = await sendPaymentConfirmation({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      amount: Number(order.total),
      paymentMethod: 'bank transfer',
      transactionReference: transactionId,
      trackingToken: order.tracking_token,
    })

    if (emailResult.success) {
      console.log('[Embedly Webhook] ✅ Payment confirmation email sent')
    } else {
      console.error('[Embedly Webhook] ❌ Email failed:', emailResult.error)
    }
  } catch (emailError) {
    console.error('[Embedly Webhook] ❌ Email error:', emailError)
  }

  // 7. Send order notification to admin
  try {
    await sendOrderNotification({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      items: order.order_items || [],
      total: order.total,
      deliveryAddress: order.delivery_address_text,
      paymentMethod: 'bank transfer',
    })

    console.log('[Embedly Webhook] ✅ Admin notification sent')
  } catch (emailError) {
    console.error('[Embedly Webhook] ⚠️  Admin notification failed')
  }

  // 8. Send SMS confirmation
  if (isSMSEnabled() && order.customer_phone) {
    try {
      const smsResult = await sendPaymentConfirmationSMS(order.customer_phone, {
        orderNumber: order.order_number,
        amount: Number(order.total).toLocaleString(),
      })

      if (smsResult.success) {
        console.log('[Embedly Webhook] ✅ SMS confirmation sent')
      }
    } catch (smsError) {
      console.error('[Embedly Webhook] ⚠️  SMS failed')
    }
  }
}
