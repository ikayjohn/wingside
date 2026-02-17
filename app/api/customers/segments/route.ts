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

    // Advanced filter parameters
    const search = searchParams.get('search') || ''
    const segments = searchParams.get('segments')?.split(',').filter(Boolean) || []
    const healthScoreMin = parseInt(searchParams.get('healthScoreMin') || '0')
    const healthScoreMax = parseInt(searchParams.get('healthScoreMax') || '100')
    const churnRiskMin = parseInt(searchParams.get('churnRiskMin') || '0')
    const churnRiskMax = parseInt(searchParams.get('churnRiskMax') || '100')
    const orderCountMin = parseInt(searchParams.get('orderCountMin') || '0')
    const orderCountMax = parseInt(searchParams.get('orderCountMax') || '1000')
    const totalSpentMin = parseInt(searchParams.get('totalSpentMin') || '0')
    const totalSpentMax = parseInt(searchParams.get('totalSpentMax') || '1000000')
    const lastOrderStart = searchParams.get('lastOrderStart')
    const lastOrderEnd = searchParams.get('lastOrderEnd')
    const dateRangeStart = searchParams.get('dateRangeStart')
    const dateRangeEnd = searchParams.get('dateRangeEnd')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'last_order_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // First, get all paid orders to identify actual customers
    let ordersQuery = supabase
      .from('orders')
      .select('customer_email, customer_phone, customer_name, user_id, created_at, total')
      .eq('payment_status', 'paid')

    // Apply date range filter if provided
    if (dateRangeStart) {
      ordersQuery = ordersQuery.gte('created_at', dateRangeStart)
    }
    if (dateRangeEnd) {
      // Add one day to include the end date fully
      const endDate = new Date(dateRangeEnd)
      endDate.setDate(endDate.getDate() + 1)
      ordersQuery = ordersQuery.lt('created_at', endDate.toISOString().split('T')[0])
    }

    ordersQuery = ordersQuery.order('created_at', { ascending: false })

    const { data: allOrders, error: ordersError } = await ordersQuery

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

    // Apply advanced filters
    let filteredCustomers = enrichedCustomers

    // Text search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCustomers = filteredCustomers.filter((c: any) =>
        c.full_name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search)
      )
    }

    // Segment filter (legacy single segment OR new multi-segment)
    if (segmentFilter) {
      filteredCustomers = filteredCustomers.filter((c: any) =>
        c.segments.includes(segmentFilter)
      )
    } else if (segments.length > 0) {
      filteredCustomers = filteredCustomers.filter((c: any) =>
        segments.some(seg => c.segments.includes(seg))
      )
    }

    // Health score filter
    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.health_score >= healthScoreMin && c.health_score <= healthScoreMax
    )

    // Churn risk filter
    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.churn_risk >= churnRiskMin && c.churn_risk <= churnRiskMax
    )

    // Order count filter
    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.total_orders >= orderCountMin && c.total_orders <= orderCountMax
    )

    // Total spent filter
    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.total_spent >= totalSpentMin && c.total_spent <= totalSpentMax
    )

    // Last order date filter
    if (lastOrderStart && lastOrderEnd) {
      const startDate = new Date(lastOrderStart)
      const endDate = new Date(lastOrderEnd)
      filteredCustomers = filteredCustomers.filter((c: any) => {
        if (!c.last_order_date) return false
        const orderDate = new Date(c.last_order_date)
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    // Tags filter
    if (tags.length > 0) {
      const { data: tagAssignments } = await supabase
        .from('customer_tag_assignments')
        .select('customer_email, tag_id')
        .in('tag_id', tags)

      const emailsWithTags = new Set(tagAssignments?.map(t => t.customer_email) || [])
      filteredCustomers = filteredCustomers.filter((c: any) => emailsWithTags.has(c.email))
    }

    // Sort customers
    filteredCustomers.sort((a: any, b: any) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'last_order_date':
          aVal = a.last_order_date ? new Date(a.last_order_date).getTime() : 0
          bVal = b.last_order_date ? new Date(b.last_order_date).getTime() : 0
          break
        case 'total_spent':
          aVal = a.total_spent
          bVal = b.total_spent
          break
        case 'total_orders':
          aVal = a.total_orders
          bVal = b.total_orders
          break
        case 'health_score':
          aVal = a.health_score
          bVal = b.health_score
          break
        case 'churn_risk':
          aVal = a.churn_risk
          bVal = b.churn_risk
          break
        case 'full_name':
          aVal = a.full_name?.toLowerCase() || ''
          bVal = b.full_name?.toLowerCase() || ''
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

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
