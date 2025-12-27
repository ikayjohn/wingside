import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/dashboard/stats - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    // Fetch orders count
    const { count: ordersCount } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Fetch pending orders count
    const { count: pendingCount } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Fetch products count
    const { count: productsCount } = await admin
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Fetch customers count (all non-admin profiles)
    const { count: customersCount } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin')

    // Fetch recent orders (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: recentCount } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Fetch total revenue (only completed orders)
    const { data: orders } = await admin
      .from('orders')
      .select('total')
      .eq('status', 'completed')

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // Fetch recent activity (last 5 orders)
    const { data: recentOrdersData } = await admin
      .from('orders')
      .select('id, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalOrders: ordersCount || 0,
      pendingOrders: pendingCount || 0,
      totalProducts: productsCount || 0,
      totalCustomers: customersCount || 0,
      recentOrders: recentCount || 0,
      totalRevenue,
      recentOrdersData: recentOrdersData || [],
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
