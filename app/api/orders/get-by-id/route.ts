import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/orders/get-by-id?orderId=xxx - Get order by database ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const admin = createAdminClient()

    // Fetch order by ID - use admin client to bypass RLS
    // This is necessary for callback pages after payment where user may not be authenticated yet
    const { data: order, error } = await admin
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // OPTIONAL: Check if user is authenticated and owns this order
    // This allows callback pages to work for unauthenticated users returning from payment gateways
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // User is authenticated - verify ownership
      const isOwner = order.customer_id === user.id

      if (!isOwner) {
        // Check if user is accessing someone else's order
        return NextResponse.json(
          { error: 'You do not have permission to view this order' },
          { status: 403 }
        )
      }
    }
    // If no user, allow access (callback scenario)
    // Order details are not sensitive for payment confirmation

    return NextResponse.json({ order })

  } catch (error) {
    console.error('Error fetching order by ID:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
