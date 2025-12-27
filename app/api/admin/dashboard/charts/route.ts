import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/dashboard/charts - Fetch chart data
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

    // Revenue over last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: revenueData } = await admin
      .from('orders')
      .select('created_at, total')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group revenue by date
    const revenueByDate: { [key: string]: number } = {}
    revenueData?.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      revenueByDate[date] = (revenueByDate[date] || 0) + (order.total || 0)
    })

    const revenueChart = Object.entries(revenueByDate).map(([date, total]) => ({
      date,
      revenue: total,
    }))

    // Orders by status
    const { data: ordersByStatus } = await admin
      .from('orders')
      .select('status')

    const statusCounts: { [key: string]: number } = {}
    ordersByStatus?.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    const statusChart = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      orders: count,
    }))

    // Top products
    const { data: orderItems } = await admin
      .from('order_items')
      .select('product_name, quantity')
      .order('quantity', { ascending: false })
      .limit(100)

    const productCounts: { [key: string]: number } = {}
    orderItems?.forEach((item) => {
      productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity
    })

    const topProducts = Object.entries(productCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Orders per day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: dailyOrders } = await admin
      .from('orders')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const ordersByDay: { [key: string]: number } = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Initialize with 0 for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayName = days[d.getDay()]
      ordersByDay[dayName] = 0
    }

    dailyOrders?.forEach((order) => {
      const dayName = days[new Date(order.created_at).getDay()]
      ordersByDay[dayName] = (ordersByDay[dayName] || 0) + 1
    })

    const dailyChart = Object.entries(ordersByDay).map(([day, count]) => ({
      day,
      orders: count,
    }))

    // Customer growth (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: customers } = await admin
      .from('profiles')
      .select('created_at')
      .neq('role', 'admin')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    const customersByMonth: { [key: string]: number } = {}
    customers?.forEach((customer) => {
      const month = new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      customersByMonth[month] = (customersByMonth[month] || 0) + 1
    })

    const customerGrowth = Object.entries(customersByMonth).map(([month, count]) => ({
      month,
      customers: count,
    }))

    return NextResponse.json({
      revenueChart,
      statusChart,
      topProducts,
      dailyChart,
      customerGrowth,
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
