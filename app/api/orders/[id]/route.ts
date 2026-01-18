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
    console.log(`[Orders API] Looking up order: ${id}`)

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

    console.log(`[Orders API] Server client result:`, { found: !!order, error: error?.message })

    // If server client fails (e.g., no auth session), use admin client
    // This allows payment callbacks to work without authentication
    if (error && !order) {
      console.log('[Orders API] Server client failed, trying admin client...')
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

      console.log(`[Orders API] Admin client result:`, {
        found: !!order,
        error: error?.message,
        orderId: order?.id,
        orderNumber: order?.order_number
      })
    }

    if (error) {
      console.error('[Orders API] Final error:', error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log(`[Orders API] ✅ Successfully fetched order: ${order?.order_number}`)
    return NextResponse.json({ order })
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
