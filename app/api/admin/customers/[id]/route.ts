import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const admin = createAdminClient()

    const { id } = await params

    const { data: customer, error: customerError } = await admin
      .from('profiles')
      .select('id,email,full_name,phone,role,created_at,updated_at')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [
      { data: addresses, error: addressesError },
      { data: recentOrders, error: recentOrdersError },
      { data: allOrdersForStats, error: allOrdersError },
    ] = await Promise.all([
      admin
        .from('addresses')
        .select('id,label,street_address,city,state,postal_code,is_default,created_at,updated_at')
        .eq('user_id', id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
      admin
        .from('orders')
        .select('id,order_number,status,total,created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('orders')
        .select('total,created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (addressesError) {
      console.error('Error fetching addresses:', addressesError)
    }

    if (recentOrdersError) {
      console.error('Error fetching recent orders:', recentOrdersError)
    }

    if (allOrdersError) {
      console.error('Error fetching orders for stats:', allOrdersError)
    }

    const ordersForStats = allOrdersForStats || []

    const total_orders = ordersForStats.length
    const total_spent = ordersForStats.reduce((sum, o: any) => sum + Number(o.total || 0), 0)
    const last_order_date = ordersForStats[0]?.created_at || null

    const defaultAddr = (addresses || []).find((a: any) => a.is_default) || (addresses || [])[0]
    const default_address = defaultAddr
      ? [defaultAddr.street_address, defaultAddr.city, defaultAddr.state, defaultAddr.postal_code]
          .filter(Boolean)
          .join(', ')
      : null

    return NextResponse.json({
      customer: {
        ...customer,
        total_orders,
        total_spent,
        last_order_date,
        default_address,
        addresses: addresses || [],
        recent_orders: recentOrders || [],
      },
    })
  } catch (e) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
