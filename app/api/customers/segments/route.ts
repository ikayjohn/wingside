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

    // Fetch customers with order statistics
    const { data: customers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        created_at,
        wallet_balance,
        points,
        total_orders,
        total_spent,
        last_order_date,
        avg_order_value
      `)
      .in('role', ['customer', 'admin'])
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    // Enrich customers with segments and analytics
    const enrichedCustomers = await Promise.all(
      (customers || []).map(async (customer) => {
        // Get additional order analytics
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at, total')
          .eq('user_id', customer.id)
          .order('created_at', { ascending: false })

        // Calculate order analytics
        const weekendOrders = (orders || []).filter(o => {
          const date = new Date(o.created_at)
          return date.getDay() === 0 || date.getDay() === 6
        }).length

        const weekendOrderRatio = (orders || []).length > 0
          ? weekendOrders / (orders || []).length
          : 0

        // Calculate days between orders
        let avgDaysBetweenOrders = 0
        if ((orders || []).length > 1) {
          const daysBetween: number[] = []
          for (let i = 0; i < (orders || []).length - 1; i++) {
            const days = Math.floor(
              (new Date((orders || [])[i].created_at).getTime() - new Date((orders || [])[i + 1].created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
            daysBetween.push(days)
          }
          avgDaysBetweenOrders = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length
        }

        // Get referral count
        const { data: referrals } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', customer.id)

        // Get social verification count
        const { data: verifications } = await supabase
          .from('social_verifications')
          .select('id')
          .eq('user_id', customer.id)
          .eq('status', 'approved')

        // Enhanced customer data
        const enhancedCustomer = {
          ...customer,
          weekend_order_ratio: weekendOrderRatio,
          avg_days_between_orders: avgDaysBetweenOrders,
          referral_count: (referrals || []).length,
          social_verifications: (verifications || []).length
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
          predicted_next_order: nextOrderDate
        }
      })
    )

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
      average_health_score: enrichedCustomers.reduce((sum: number, c: any) => sum + c.health_score, 0) / enrichedCustomers.length
    })
  } catch (error: any) {
    console.error('Error fetching customer segments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer segments' },
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
