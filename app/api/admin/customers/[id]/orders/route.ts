import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return {}
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const admin = createAdminClient()
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get('pageSize') || '10') || 10))
    const status = searchParams.get('status')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Verify customer exists
    const { data: customer, error: customerError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Build query for orders
    let ordersQuery = admin
      .from('orders')
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        payment_method,
        subtotal,
        delivery_fee,
        tax,
        total,
        delivery_address_text,
        notes,
        created_at,
        updated_at,
        items:order_items(
          id,
          product_name,
          product_size,
          flavors,
          quantity,
          unit_price,
          total_price
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      ordersQuery = ordersQuery.eq('status', status)
    }

    const { data: orders, error: ordersError, count } = await ordersQuery.range(from, to)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (e) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
