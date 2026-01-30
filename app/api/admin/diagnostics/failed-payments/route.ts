import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/diagnostics/failed-payments - Get recent failed payment attempts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get orders with failed/pending payment status from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: failedPayments, error } = await supabase
      .from('orders')
      .select('*')
      .in('payment_status', ['pending', 'failed'])
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching failed payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch failed payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payments: failedPayments || [],
      count: failedPayments?.length || 0
    })
  } catch (error) {
    console.error('Error in failed payments diagnostic:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
