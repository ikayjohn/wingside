import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

/**
 * GET /api/payment/embedly/check-wallet?walletId=xxx
 *
 * Check if payment has been received for a checkout wallet
 * Used for polling payment status on frontend
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')
    const orderId = searchParams.get('orderId')

    if (!walletId && !orderId) {
      return NextResponse.json(
        { error: 'walletId or orderId is required' },
        { status: 400 }
      )
    }

    // If orderId is provided, get the walletId from the order
    let actualWalletId = walletId

    if (orderId && !walletId) {
      const supabase = await createClient()
      const { data: order } = await supabase
        .from('orders')
        .select('payment_reference, payment_status, status')
        .eq('id', orderId)
        .single()

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      actualWalletId = order.payment_reference

      // If order is already paid, return immediately
      if (order.payment_status === 'paid' || order.status === 'confirmed') {
        return NextResponse.json({
          success: true,
          hasPayment: true,
          paymentStatus: 'paid',
          orderStatus: order.status,
          message: 'Payment already confirmed',
        })
      }
    }

    if (!actualWalletId) {
      return NextResponse.json(
        { error: 'Could not determine wallet ID' },
        { status: 400 }
      )
    }

    // Check wallet status with Embedly
    const walletStatus = await embedlyClient.checkCheckoutWalletStatus(actualWalletId)

    console.log('[Embedly Check Wallet] Status:', {
      walletId: actualWalletId,
      hasPayment: walletStatus.hasPayment,
      status: walletStatus.status,
    })

    return NextResponse.json({
      success: true,
      ...walletStatus,
    })
  } catch (error) {
    console.error('[Embedly Check Wallet] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check wallet status',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payment/embedly/check-wallet
 *
 * Manual trigger to check and process pending payments
 * Useful for catching up on missed webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, orderId } = body

    if (!walletId && !orderId) {
      return NextResponse.json(
        { error: 'walletId or orderId is required' },
        { status: 400 }
      )
    }

    // Get wallet status
    const walletStatus = await embedlyClient.checkCheckoutWalletStatus(
      walletId || orderId
    )

    // If payment found, trigger webhook processing
    if (walletStatus.hasPayment && walletStatus.transaction) {
      console.log('[Embedly Check Wallet] Payment found, triggering processing')

      // Simulate webhook event to trigger order fulfillment
      const webhookUrl = new URL('/api/payment/embedly/webhook', request.url)

      await fetch(webhookUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-auth': process.env.WEBHOOK_AUTH_TOKEN || '',
        },
        body: JSON.stringify({
          event: 'checkout.wallet.payment_received',
          data: {
            walletId: walletId,
            amount: walletStatus.amount,
            transactionId: walletStatus.transaction.id,
            senderAccountNumber: walletStatus.transaction.senderAccountNumber,
            senderName: walletStatus.transaction.senderName,
            timestamp: walletStatus.transaction.createdAt,
          },
        }),
      })

      return NextResponse.json({
        success: true,
        hasPayment: true,
        processed: true,
        message: 'Payment found and processed',
      })
    }

    return NextResponse.json({
      success: true,
      ...walletStatus,
      message: walletStatus.hasPayment ? 'Payment found' : 'No payment yet',
    })
  } catch (error) {
    console.error('[Embedly Check Wallet] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check wallet',
      },
      { status: 500 }
    )
  }
}
