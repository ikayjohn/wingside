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

    // Helper function to try both UUID and order_number lookup
    async function fetchOrder(client: any) {
      // First, try to look up by order_number (text field)
      const { data: orderByNumber, error: numberError } = await client
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', id)
        .single()

      if (orderByNumber && !numberError) {
        return { data: orderByNumber, error: null }
      }

      // If not found by order_number, try by ID (UUID field)
      const { data: orderById, error: idError } = await client
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .single()

      return { data: orderById, error: idError }
    }

    // Try server client first (respects RLS)
    const supabase = await createClient()
    let { data: order, error } = await fetchOrder(supabase)

    console.log(`[Orders API] Server client result:`, { found: !!order, error: error?.message })

    // If server client fails (e.g., no auth session), use admin client
    // This allows payment callbacks to work without authentication
    if (error && !order) {
      console.log('[Orders API] Server client failed, trying admin client...')
      const admin = createAdminClient()

      const result = await fetchOrder(admin)
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
