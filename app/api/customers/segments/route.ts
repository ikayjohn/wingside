import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'
import { calculateCustomerSegments, calculateCustomerHealth, calculateChurnRisk, predictNextOrder, getCustomerSegments } from '@/lib/customer-segmentation'

const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/customers/segments - Get all customers with segments
export async function GET(request: NextRequest) {
  try {
    // Fix 1: Auth + permission check
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: authProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
    if (!hasPermission(authProfile?.role, 'customers', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const segmentFilter = searchParams.get('segment')
    // Fix 7: Increase default limit to 200
    const limit = parseInt(searchParams.get('limit') || '200')

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

    // Fetch all paid orders to identify actual customers
    let ordersQuery = supabase
      .from('orders')
      .select('customer_email, customer_phone, customer_name, user_id, created_at, total')
      .eq('payment_status', 'paid')

    if (dateRangeStart) {
      ordersQuery = ordersQuery.gte('created_at', dateRangeStart)
    }
    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd)
      endDate.setDate(endDate.getDate() + 1)
      ordersQuery = ordersQuery.lt('created_at', endDate.toISOString().split('T')[0])
    }

    ordersQuery = ordersQuery.order('created_at', { ascending: false })

    const { data: allOrders, error: ordersError } = await ordersQuery

    if (ordersError) throw ordersError

    // Build unique customer identifiers
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

    // Fetch profile data for these customers (only customer role, exclude staff)
    const customerEmails = Array.from(customerMap.values())
      .map(c => c.email)
      .filter(Boolean)

    const [{ data: profiles }, { count: totalProfilesCount }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at, wallet_balance, total_points, bank_account')
        .in('email', customerEmails.length > 0 ? customerEmails : ['none'])
        .eq('role', 'customer'),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
    ])

    // Remove staff from customerMap — only keep entries that either have a customer profile or no profile (guests)
    const staffEmails = new Set<string>()
    // We need to check which emails belong to non-customer profiles
    if (customerEmails.length > 0) {
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('email')
        .in('email', customerEmails)
        .neq('role', 'customer')
      staffProfiles?.forEach(p => { if (p.email) staffEmails.add(p.email) })
    }

    // Remove staff entries from the customer map
    for (const [customerId, customerInfo] of customerMap.entries()) {
      if (customerInfo.email && staffEmails.has(customerInfo.email)) {
        customerMap.delete(customerId)
      }
    }

    // Fix 3: Batch fetch referrals and social verifications instead of N+1 queries
    const profileIds = profiles?.map(p => p.id) || []

    const [allReferralsResult, allVerificationsResult] = await Promise.all([
      profileIds.length > 0
        ? supabase.from('referrals').select('referrer_id').in('referrer_id', profileIds)
        : Promise.resolve({ data: [] as { referrer_id: string }[] }),
      profileIds.length > 0
        ? supabase.from('social_verifications').select('user_id').in('user_id', profileIds).eq('status', 'approved')
        : Promise.resolve({ data: [] as { user_id: string }[] })
    ])

    const referralCountMap = new Map<string, number>()
    allReferralsResult.data?.forEach((r: { referrer_id: string }) => {
      referralCountMap.set(r.referrer_id, (referralCountMap.get(r.referrer_id) || 0) + 1)
    })

    const verificationCountMap = new Map<string, number>()
    allVerificationsResult.data?.forEach((v: { user_id: string }) => {
      verificationCountMap.set(v.user_id, (verificationCountMap.get(v.user_id) || 0) + 1)
    })

    // Enrich each unique customer — now synchronous, no per-customer queries
    const allEnrichedCustomers = Array.from(customerMap.entries()).map(([customerId, customerInfo]) => {
      const profile = profiles?.find(p => p.email === customerInfo.email) || {
        id: customerId,
        full_name: customerInfo.name || 'Guest Customer',
        email: customerInfo.email || 'No email',
        phone: customerInfo.phone,
        role: 'customer',
        created_at: new Date().toISOString(),
        wallet_balance: 0,
        total_points: 0,
        bank_account: null
      }

      const customerOrders = allOrders?.filter(order => {
        const orderCustomerId = order.customer_email || `guest-${order.customer_phone || 'anonymous'}-${order.customer_name || 'guest'}`
        return orderCustomerId === customerId
      }) || []

      const totalOrders = customerOrders.length
      const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      const lastOrderDate = customerOrders[0]?.created_at || null
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

      const weekendOrders = customerOrders.filter(o => {
        const date = new Date(o.created_at)
        return date.getDay() === 0 || date.getDay() === 6
      }).length

      const weekendOrderRatio = totalOrders > 0 ? weekendOrders / totalOrders : 0

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

      // Fix 3: Use batch lookup maps instead of per-customer queries
      const isProfiled = profile.id && profile.id !== customerId
      const referralCount = isProfiled ? (referralCountMap.get(profile.id) || 0) : 0
      const socialVerifications = isProfiled ? (verificationCountMap.get(profile.id) || 0) : 0

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

      const customerSegments = calculateCustomerSegments(enhancedCustomer)
      const healthScore = calculateCustomerHealth(enhancedCustomer)
      const churnRisk = calculateChurnRisk(enhancedCustomer)
      const nextOrderDate = predictNextOrder(enhancedCustomer)

      return {
        ...enhancedCustomer,
        segments: customerSegments,
        segment_objects: getCustomerSegments(enhancedCustomer),
        health_score: healthScore,
        churn_risk: churnRisk,
        predicted_next_order: nextOrderDate,
        total_orders: totalOrders
      }
    })

    const enrichedCustomers = allEnrichedCustomers

    // Separate profiled customers from guests for accurate stats
    const profiledCustomers = enrichedCustomers.filter((c: any) =>
      profiles?.some(p => p.email === c.email)
    )
    const profilesWithOrders = profiledCustomers.length
    const customersWithOrders = profilesWithOrders
    const customersWithoutOrders = Math.max(0, (totalProfilesCount || 0) - profilesWithOrders)

    // Apply advanced filters
    let filteredCustomers = enrichedCustomers

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCustomers = filteredCustomers.filter((c: any) =>
        c.full_name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search)
      )
    }

    if (segmentFilter) {
      filteredCustomers = filteredCustomers.filter((c: any) =>
        c.segments.includes(segmentFilter)
      )
    } else if (segments.length > 0) {
      filteredCustomers = filteredCustomers.filter((c: any) =>
        segments.some(seg => c.segments.includes(seg))
      )
    }

    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.health_score >= healthScoreMin && c.health_score <= healthScoreMax
    )

    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.churn_risk >= churnRiskMin && c.churn_risk <= churnRiskMax
    )

    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.total_orders >= orderCountMin && c.total_orders <= orderCountMax
    )

    filteredCustomers = filteredCustomers.filter((c: any) =>
      c.total_spent >= totalSpentMin && c.total_spent <= totalSpentMax
    )

    if (lastOrderStart && lastOrderEnd) {
      const startDate = new Date(lastOrderStart)
      const endDate = new Date(lastOrderEnd)
      filteredCustomers = filteredCustomers.filter((c: any) => {
        if (!c.last_order_date) return false
        const orderDate = new Date(c.last_order_date)
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    if (tags.length > 0) {
      const { data: tagAssignments } = await supabase
        .from('customer_tag_assignments')
        .select('customer_email, tag_id')
        .in('tag_id', tags)

      const emailsWithTags = new Set(tagAssignments?.map(t => t.customer_email) || [])
      filteredCustomers = filteredCustomers.filter((c: any) => emailsWithTags.has(c.email))
    }

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

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })

    // Segment stats based on profiled customers only (excludes guests)
    const segmentStats = CUSTOMER_SEGMENTS.reduce((acc, segment) => {
      acc[segment.id] = profiledCustomers.filter((c: any) => c.segments.includes(segment.id)).length
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      customers: filteredCustomers.slice(0, limit),
      total: filteredCustomers.length,
      segment_stats: segmentStats,
      average_health_score: profiledCustomers.length > 0
        ? profiledCustomers.reduce((sum: number, c: { health_score: number }) => sum + c.health_score, 0) / profiledCustomers.length
        : 0,
      customers_without_orders: customersWithoutOrders,
      total_profiles: totalProfilesCount || 0,
      customers_with_orders: customersWithOrders,
    })
  } catch (error) {
    console.error('Error fetching customer segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer segments' },
      { status: 500 }
    )
  }
}

// Fix 2: Added 'emerging' so it's counted in segment stats
const CUSTOMER_SEGMENTS = [
  { id: 'vip', name: 'VIP Customer', color: 'purple', icon: '👑' },
  { id: 'regular', name: 'Regular Customer', color: 'blue', icon: '⭐' },
  { id: 'new', name: 'New Customer', color: 'green', icon: '🆕' },
  { id: 'at-risk', name: 'At Risk', color: 'orange', icon: '⚠️' },
  { id: 'churned', name: 'Churned', color: 'red', icon: '❌' },
  { id: 'corporate', name: 'Corporate', color: 'indigo', icon: '🏢' },
  { id: 'weekend-warrior', name: 'Weekend Warrior', color: 'yellow', icon: '🎉' },
  { id: 'big-spender', name: 'Big Spender', color: 'emerald', icon: '💰' },
  { id: 'one-time', name: 'One-Time Customer', color: 'gray', icon: '🔸' },
  { id: 'emerging', name: 'Emerging Customer', color: 'teal', icon: '📈' }
]
