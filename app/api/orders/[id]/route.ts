import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/orders/[id] - Get single order by ID or order_number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try server client first (respects RLS)
    const supabase = await createClient()
    let { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single()

    // If server client fails (e.g., no auth session), use admin client
    // This allows payment callbacks to work without authentication
    if (error && !order) {
      console.log('Server client failed to fetch order, trying admin client...')
      const admin = createAdminClient()

      const result = await admin
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single()

      order = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
