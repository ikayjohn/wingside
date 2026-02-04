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

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch order by ID - use admin client to bypass RLS
    // This is necessary for callback pages after payment
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

    // Check if user owns this order or is admin
    const isOwner = order.customer_id === user.id

    if (!isOwner) {
      // Double check by customer_email
      const { data: userEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      const customerEmailMatches = userEmail?.id === order.customer_id

      if (!customerEmailMatches) {
        return NextResponse.json(
          { error: 'You do not have permission to view this order' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ order })

  } catch (error) {
    console.error('Error fetching order by ID:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
