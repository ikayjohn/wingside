import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/orders/by-number/[orderNumber] - Get order by order number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    console.log(`[Orders API] Looking up by orderNumber: ${orderNumber}`)

    const admin = createAdminClient()

    const { data: orders, error } = await admin
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('order_number', orderNumber)

    if (error) {
      console.error('[Orders API] Error fetching order:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log(`[Orders API] ✅ Successfully fetched order: ${orderNumber}`)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
