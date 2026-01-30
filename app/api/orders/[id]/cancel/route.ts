import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/orders/[id]/cancel - Cancel an order due to payment failure
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { reason, source } = body

    console.log(`[Order Cancel] Cancelling order ${orderId}`, { reason, source })

    const supabase = await createClient()

    // Get the order first
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error(`[Order Cancel] Order not found: ${orderId}`)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Don't cancel if already paid
    if (order.payment_status === 'paid') {
      console.log(`[Order Cancel] Order ${order.order_number} already paid, cannot cancel`)
      return NextResponse.json(
        { error: 'Cannot cancel paid order' },
        { status: 400 }
      )
    }

    // Don't cancel if already cancelled
    if (order.status === 'cancelled') {
      console.log(`[Order Cancel] Order ${order.order_number} already cancelled`)
      return NextResponse.json({
        success: true,
        message: 'Order already cancelled',
      })
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error(`[Order Cancel] Failed to update order:`, updateError)
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      )
    }

    console.log(`[Order Cancel] ✅ Order ${order.order_number} cancelled successfully`)

    return NextResponse.json({
      success: true,
      message: 'Order cancelled',
      order_number: order.order_number,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Order Cancel] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
