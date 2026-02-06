import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DEBUG ENDPOINT - Test webhook processing without signature verification
 *
 * ⚠️  SECURITY WARNING: This endpoint bypasses signature verification
 * Only use for testing. Remove or restrict access in production.
 *
 * Usage:
 * POST /api/payment/nomba/webhook-test
 * Body: { "orderReference": "WS-ORDER123-1234567890" }
 */

export async function POST(request: NextRequest) {
  console.log('\n🧪 [WEBHOOK TEST] Starting manual webhook test...\n')

  try {
    const { orderReference } = await request.json()

    if (!orderReference) {
      return NextResponse.json(
        { error: 'orderReference is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 [WEBHOOK TEST] Testing webhook for order: ${orderReference}`)

    // Find order by payment reference
    const admin = createAdminClient()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_reference', orderReference)
      .single()

    if (orderError || !order) {
      console.error('❌ [WEBHOOK TEST] Order not found:', orderReference)
      return NextResponse.json(
        {
          error: 'Order not found',
          orderReference,
          suggestion: 'Check if payment_reference was saved during initialization'
        },
        { status: 404 }
      )
    }

    console.log(`✅ [WEBHOOK TEST] Order found:`, {
      order_number: order.order_number,
      payment_status: order.payment_status,
      status: order.status,
      total: order.total
    })

    // Check if already paid
    if (order.payment_status === 'paid') {
      console.log(`⚠️  [WEBHOOK TEST] Order already paid`)
      return NextResponse.json({
        success: true,
        message: 'Order already marked as paid',
        order: {
          order_number: order.order_number,
          payment_status: order.payment_status,
          status: order.status
        }
      })
    }

    // Simulate successful webhook processing
    console.log(`🔄 [WEBHOOK TEST] Updating order to paid status...`)

    const { error: updateError } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        status: 'confirmed',
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ [WEBHOOK TEST] Failed to update order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError },
        { status: 500 }
      )
    }

    console.log(`✅ [WEBHOOK TEST] Order updated to paid`)

    // Process rewards (if user exists)
    let rewardsResult = null
    if (order.customer_email) {
      console.log(`🎁 [WEBHOOK TEST] Processing rewards...`)

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', order.customer_email)
        .single()

      if (profile?.id) {
        const { data: paymentResult } = await admin.rpc('process_payment_atomically', {
          p_order_id: order.id,
          p_user_id: profile.id,
          p_order_total: Number(order.total)
        })

        rewardsResult = paymentResult?.[0]
        console.log(`✅ [WEBHOOK TEST] Rewards processed:`, rewardsResult)
      } else {
        console.log(`ℹ️  [WEBHOOK TEST] No profile found for customer (guest checkout?)`)
      }
    }

    console.log(`\n✅ [WEBHOOK TEST] Test completed successfully!\n`)

    return NextResponse.json({
      success: true,
      message: 'Webhook test completed - order marked as paid',
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: 'paid',
        status: 'confirmed',
        total: order.total,
        customer_email: order.customer_email
      },
      rewards: rewardsResult,
      note: 'This was a manual test. Real webhooks will process automatically.'
    })

  } catch (error) {
    console.error('❌ [WEBHOOK TEST] Error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check webhook status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('orderNumber')
  const orderReference = searchParams.get('orderReference')

  if (!orderNumber && !orderReference) {
    return NextResponse.json(
      { error: 'orderNumber or orderReference required' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select('order_number, payment_reference, payment_status, status, paid_at, created_at')

  if (orderNumber) {
    query = query.eq('order_number', orderNumber)
  } else {
    query = query.eq('payment_reference', orderReference)
  }

  const { data: order, error } = await query.single()

  if (error || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  // Determine webhook status
  const webhookReceived = order.payment_status === 'paid' && order.paid_at
  const timeSinceCreation = order.created_at
    ? Math.round((Date.now() - new Date(order.created_at).getTime()) / 1000)
    : null

  return NextResponse.json({
    order,
    webhook_status: {
      received: webhookReceived,
      time_since_creation_seconds: timeSinceCreation,
      diagnosis: webhookReceived
        ? 'Webhook received and processed'
        : timeSinceCreation && timeSinceCreation > 300
        ? 'Webhook not received - check Nomba dashboard and webhook configuration'
        : 'Waiting for webhook (normal if payment just completed)'
    }
  })
}
