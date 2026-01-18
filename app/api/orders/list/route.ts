import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/orders/list - Get recent orders (for testing)
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()

    const { data: orders, error } = await admin
      .from('orders')
      .select('id, order_number, payment_status, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
