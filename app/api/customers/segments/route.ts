import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calculateCustomerSegments, calculateCustomerHealth, calculateChurnRisk, predictNextOrder, getCustomerSegments } from '@/lib/customer-segmentation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/customers/segments - Get all customers with segments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentFilter = searchParams.get('segment')
    const limit = parseInt(searchParams.get('limit') || '50')

    // First, get all paid orders to identify actual customers
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_email, customer_phone, customer_name, user_id, created_at, total')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Build unique customer identifiers (same logic as analytics)
    const customerMap = new Map<string, { email: string; phone: string; name: string; user_id: string | null }>()

    allOrders?.forEach(order => {
      const customerId = order.customer_email || `guest-${order.customer_phone || 'anonymous'}-${order.customer_name || 'guest'}`
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          email: order.customer_email || '',
          phone: order.customer_phone || '',
          name: order.customer_name || '',
          user_id: order.user_id
        })
      }
    })

    console.log(`📊 Found ${customerMap.size} unique customers from orders`)

    // Debug: Show first few customer IDs
    const customerIds = Array.from(customerMap.keys()).slice(0, 5)
    console.log(`📝 Sample customer IDs: ${customerIds.join(', ')}`)

    // Now fetch profile data for these customers
    const customerEmails = Array.from(customerMap.values())
      .map(c => c.email)
      .filter(Boolean)

    console.log(`📧 Found ${customerEmails.length} customers with emails`)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at, wallet_balance, total_points')
      .in('email', customerEmails.length > 0 ? customerEmails : ['none'])

    console.log(`👤 Fetched ${profiles?.length || 0} matching profiles`)

    // Get count of all customer profiles (for never ordered calculation)
    const { count: totalProfilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')

    console.log(`📊 Total customer profiles in DB: ${totalProfilesCount}`)
    console.log(`📊 Unique customers from orders: ${customerMap.size}`)
    console.log(`📊 Never ordered calculation: ${totalProfilesCount} - ${customerMap.size} = ${(totalProfilesCount || 0) - customerMap.size}`)

    // Enrich each unique customer with their order data
    const allEnrichedCustomers = await Promise.all(
      Array.from(customerMap.entries()).map(async ([customerId, customerInfo]) => {
        // Get profile data if available
        const profile = profiles?.find(p => p.email === customerInfo.email) || {
          id: customerId,
          full_name: customerInfo.name || 'Guest Customer',
          email: customerInfo.email || 'No email',
          phone: customerInfo.phone,
          role: 'customer',
          created_at: new Date().toISOString(),
          wallet_balance: 0,
          total_points: 0
        }

        // Get all orders for this customer
        const customerOrders = allOrders?.filter(order => {
          const orderCustomerId = order.customer_email || `guest-${order.customer_phone || 'anonymous'}-${order.customer_name || 'guest'}`
          return orderCustomerId === customerId
        }) || []

        // Calculate basic order statistics
        const totalOrders = customerOrders.length
        const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
        const lastOrderDate = customerOrders[0]?.created_at || null
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

        // Calculate order analytics
        const weekendOrders = customerOrders.filter(o => {
          const date = new Date(o.created_at)
          return date.getDay() === 0 || date.getDay() === 6
        }).length

        const weekendOrderRatio = totalOrders > 0 ? weekendOrders / totalOrders : 0

        // Calculate days between orders
        let avgDaysBetweenOrders = 0
        if (customerOrders.length > 1) {
          const daysBetween: number[] = []
          for (let i = 0; i < customerOrders.length - 1; i++) {
            const days = Math.floor(
              (new Date(customerOrders[i].created_at).getTime() - new Date(customerOrders[i + 1].created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
            daysBetween.push(days)
          }
          avgDaysBetweenOrders = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length
        }

        // Get referral count (only if profile exists)
        let referralCount = 0
        let socialVerifications = 0

        if (profile.id && profile.id !== customerId) {
          const { data: referrals } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', profile.id)

          const { data: verifications } = await supabase
            .from('social_verifications')
            .select('id')
            .eq('user_id', profile.id)
            .eq('status', 'approved')

          referralCount = (referrals || []).length
          socialVerifications = (verifications || []).length
        }

        // Enhanced customer data with calculated metrics
        const enhancedCustomer = {
          ...profile,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          avg_order_value: avgOrderValue,
          weekend_order_ratio: weekendOrderRatio,
          avg_days_between_orders: avgDaysBetweenOrders,
          referral_count: referralCount,
          social_verifications: socialVerifications
        }

        // Calculate segments and metrics
        const segments = calculateCustomerSegments(enhancedCustomer)
        const healthScore = calculateCustomerHealth(enhancedCustomer)
        const churnRisk = calculateChurnRisk(enhancedCustomer)
        const nextOrderDate = predictNextOrder(enhancedCustomer)

        return {
          ...enhancedCustomer,
          segments,
          segment_objects: getCustomerSegments(enhancedCustomer),
          health_score: healthScore,
          churn_risk: churnRisk,
          predicted_next_order: nextOrderDate,
          total_orders: totalOrders // Include for filtering
        }
      })
    )

    // All enriched customers have orders by definition (we built the list from orders)
    const enrichedCustomers = allEnrichedCustomers

    console.log(`✅ Analyzed ${enrichedCustomers.length} customers with order history`)

    // Calculate customers who never ordered
    const customersWithOrders = enrichedCustomers.length
    const customersWithoutOrders = (totalProfilesCount || 0) - customersWithOrders

    console.log(`📊 Stats: ${customersWithOrders} with orders, ${customersWithoutOrders} never ordered, ${totalProfilesCount} total profiles`)

    // Filter by segment if specified
    let filteredCustomers = enrichedCustomers
    if (segmentFilter) {
      filteredCustomers = enrichedCustomers.filter((c: any) =>
        c.segments.includes(segmentFilter)
      )
    }

    // Get segment statistics
    const segmentStats = CUSTOMER_SEGMENTS.reduce((acc, segment) => {
      acc[segment.id] = enrichedCustomers.filter((c: any) => c.segments.includes(segment.id)).length
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      customers: filteredCustomers.slice(0, limit),
      total: filteredCustomers.length,
      segment_stats: segmentStats,
      average_health_score: enrichedCustomers.length > 0
        ? enrichedCustomers.reduce((sum: number, c: { health_score: number }) => sum + c.health_score, 0) / enrichedCustomers.length
        : 0,
      customers_without_orders: customersWithoutOrders,
      total_profiles: totalProfilesCount || 0,
      customers_with_orders: customersWithOrders,
      // Debug info
      _debug: {
        total_profiles_count: totalProfilesCount,
        unique_customers_from_orders: customerMap.size,
        never_ordered_calc: `${totalProfilesCount} - ${customerMap.size} = ${customersWithoutOrders}`
      }
    })
  } catch (error) {
    console.error('Error fetching customer segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer segments' },
      { status: 500 }
    )
  }
}

const CUSTOMER_SEGMENTS = [
  { id: 'vip', name: 'VIP Customer', color: 'purple', icon: '👑' },
  { id: 'regular', name: 'Regular Customer', color: 'blue', icon: '⭐' },
  { id: 'new', name: 'New Customer', color: 'green', icon: '🆕' },
  { id: 'at-risk', name: 'At Risk', color: 'orange', icon: '⚠️' },
  { id: 'churned', name: 'Churned', color: 'red', icon: '❌' },
  { id: 'corporate', name: 'Corporate', color: 'indigo', icon: '🏢' },
  { id: 'weekend-warrior', name: 'Weekend Warrior', color: 'yellow', icon: '🎉' },
  { id: 'big-spender', name: 'Big Spender', color: 'emerald', icon: '💰' },
  { id: 'one-time', name: 'One-Time Customer', color: 'gray', icon: '🔸' }
]
