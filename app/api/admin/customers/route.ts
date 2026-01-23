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

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const admin = createAdminClient()

    const { searchParams } = new URL(request.url)

    const role = searchParams.get('role')
    const search = (searchParams.get('search') || '').trim()

    const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get('pageSize') || '25') || 25))

    const sort = searchParams.get('sort') || 'created_at_desc'

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let profilesQuery = admin
      .from('profiles')
      .select('id,email,full_name,phone,role,created_at,updated_at,zoho_contact_id,embedly_customer_id,embedly_wallet_id,wallet_balance', { count: 'exact' })
      .neq('role', 'admin')

    if (role && role !== 'all') {
      profilesQuery = profilesQuery.eq('role', role)
    }

    if (search) {
      const escaped = search.replace(/,/g, '')
      profilesQuery = profilesQuery.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`
      )
    }

    if (sort === 'created_at_asc') {
      profilesQuery = profilesQuery.order('created_at', { ascending: true })
    } else {
      profilesQuery = profilesQuery.order('created_at', { ascending: false })
    }

    const { data: profiles, error: profilesError, count } = await profilesQuery.range(from, to)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    const userIds = (profiles || []).map((p) => p.id)

    const byUser: Record<
      string,
      {
        total_orders: number
        total_spent: number
        last_order_date: string | null
        last_visit_date: string | null
        default_address?: string
      }
    > = {}

    userIds.forEach((id) => {
      byUser[id] = { total_orders: 0, total_spent: 0, last_order_date: null, last_visit_date: null, default_address: undefined }
    })

    if (userIds.length > 0) {
      const { data: orders, error: ordersError } = await admin
        .from('orders')
        .select('user_id,total,created_at,status')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
      } else {
        for (const order of orders || []) {
          if (!order.user_id) continue
          const agg = byUser[order.user_id]
          if (!agg) continue
          agg.total_orders += 1

          // Only add to total_spent if not cancelled
          if (order.status !== 'cancelled') {
            agg.total_spent += Number(order.total || 0)
          }

          // Track last visit date (most recent order of any status)
          if (!agg.last_visit_date) {
            agg.last_visit_date = order.created_at
          }

          // Track last order date (most recent non-cancelled order)
          if (order.status !== 'cancelled' && !agg.last_order_date) {
            agg.last_order_date = order.created_at
          }
        }
      }

      const { data: addresses, error: addressesError } = await admin
        .from('addresses')
        .select('user_id,street_address,city,state,postal_code,is_default,created_at')
        .in('user_id', userIds)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (addressesError) {
        console.error('Error fetching addresses:', addressesError)
      } else {
        const defaultAddressByUser: Record<string, string> = {}
        for (const addr of addresses || []) {
          if (!addr.user_id) continue
          if (defaultAddressByUser[addr.user_id]) continue
          const parts = [addr.street_address, addr.city, addr.state, addr.postal_code].filter(Boolean)
          defaultAddressByUser[addr.user_id] = parts.join(', ')
        }

        for (const id of Object.keys(defaultAddressByUser)) {
          byUser[id].default_address = defaultAddressByUser[id]
        }
      }
    }

    const customers = (profiles || []).map((p) => {
      const agg = byUser[p.id] || { total_orders: 0, total_spent: 0, last_order_date: null, last_visit_date: null, default_address: null }
      return {
        ...p,
        total_orders: agg.total_orders,
        total_spent: agg.total_spent,
        last_order_date: agg.last_order_date,
        last_visit_date: agg.last_visit_date,
        default_address: agg.default_address || null,
      }
    })

    return NextResponse.json({
      customers,
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
