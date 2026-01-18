import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/customers/[id]/timeline - Get complete customer timeline
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    // Fetch customer info
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Fetch all timeline events in parallel
    const [
      ordersResult,
      referralsResult,
      socialVerificationsResult,
      leadResult,
      leadActivitiesResult
    ] = await Promise.all([
      // Orders
      supabase
        .from('orders')
        .select('id, order_number, status, total, created_at, delivery_address_text')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false }),

      // Referrals made
      supabase
        .from('referrals')
        .select('id, referred_email, status, created_at, reward_amount')
        .eq('referrer_id', customerId)
        .order('created_at', { ascending: false }),

      // Social verifications
      supabase
        .from('social_verifications')
        .select('id, platform, status, points_awarded, created_at')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false }),

      // Lead (if converted from lead)
      supabase
        .from('leads')
        .select('id, name, source, status, score, converted_at')
        .eq('converted_to_customer_id', customerId)
        .single(),

      // Lead activities (if was a lead)
      supabase
        .from('lead_activities')
        .select('id, activity_type, subject, description, created_at')
        .eq('lead_id', (await supabase.from('leads').select('id').eq('converted_to_customer_id', customerId).single()).data?.id)
        .order('created_at', { ascending: false })
    ])

    // Build timeline array
    const timeline: any[] = []

    // Add customer creation
    timeline.push({
      type: 'customer_created',
      title: 'Customer Account Created',
      description: `${customer.full_name || 'Customer'} joined Wingside`,
      icon: '👤',
      color: 'green',
      date: customer.created_at,
      metadata: {
        email: customer.email,
        phone: customer.phone
      }
    })

    // Add orders
    if (ordersResult.data) {
      ordersResult.data.forEach((order: any) => {
        timeline.push({
          type: 'order',
          title: `Order #${order.order_number}`,
          description: `Placed order for ₦${order.total?.toLocaleString()} - ${order.status}`,
          icon: '📦',
          color: order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'blue',
          date: order.created_at,
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            delivery_address: order.delivery_address_text
          },
          link: `/admin/orders?search=${order.order_number}`
        })
      })
    }

    // Add referrals
    if (referralsResult.data) {
      referralsResult.data.forEach((referral: any) => {
        let statusText = ''
        switch (referral.status) {
          case 'signup_completed':
            statusText = 'Referred friend signed up'
            break
          case 'first_order_completed':
            statusText = `Referral completed - earned ₦${referral.reward_amount}`
            break
          case 'rewarded':
            statusText = `Reward granted - ₦${referral.reward_amount}`
            break
          default:
            statusText = `Referral sent to ${referral.referred_email}`
        }

        timeline.push({
          type: 'referral',
          title: 'Referral Activity',
          description: statusText,
          icon: '🎁',
          color: 'purple',
          date: referral.created_at,
          metadata: {
            referred_email: referral.referred_email,
            status: referral.status,
            reward_amount: referral.reward_amount
          }
        })
      })
    }

    // Add social verifications
    if (socialVerificationsResult.data) {
      socialVerificationsResult.data.forEach((verification: any) => {
        timeline.push({
          type: 'social_verification',
          title: `Social Verification - ${verification.platform}`,
          description: verification.status === 'approved'
            ? `Verified ${verification.platform} account - earned ${verification.points_awarded} points`
            : `Social verification ${verification.status}`,
          icon: '✓',
          color: verification.status === 'approved' ? 'green' : 'yellow',
          date: verification.created_at,
          metadata: {
            platform: verification.platform,
            status: verification.status,
            points_awarded: verification.points_awarded
          }
        })
      })
    }

    // Add lead conversion
    if (leadResult.data) {
      const lead = leadResult.data
      timeline.push({
        type: 'lead_conversion',
        title: 'Converted from Lead',
        description: `Was a lead before becoming a customer (score: ${lead.score})`,
        icon: '🎯',
        color: 'indigo',
        date: lead.converted_at,
        metadata: {
          lead_id: lead.id,
          source: lead.source,
          status: lead.status,
          score: lead.score
        },
        link: `/admin/leads`
      })

      // Add lead activities (before conversion)
      if (leadActivitiesResult.data) {
        leadActivitiesResult.data.forEach((activity: any) => {
          const activityDate = new Date(activity.created_at)
          const conversionDate = new Date(lead.converted_at)

          // Only show activities before conversion
          if (activityDate < conversionDate) {
            timeline.push({
              type: 'lead_activity',
              title: `Lead: ${activity.subject || activity.activity_type.replace('_', ' ')}`,
              description: activity.description || '',
              icon: '📝',
              color: 'gray',
              date: activity.created_at,
              metadata: {
                activity_type: activity.activity_type,
                subject: activity.subject,
                description: activity.description
              }
            })
          }
        })
      }
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate summary statistics
    const stats = {
      total_orders: ordersResult.data?.length || 0,
      total_referrals: referralsResult.data?.length || 0,
      total_verifications: socialVerificationsResult.data?.length || 0,
      first_order: ordersResult.data?.[ordersResult.data.length - 1],
      last_order: ordersResult.data?.[0],
      lifetime_value: customer.total_spent || 0,
      days_since_last_order: ordersResult.data?.[0]
        ? Math.floor((Date.now() - new Date(ordersResult.data[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null
    }

    return NextResponse.json({
      customer,
      timeline,
      stats
    })
  } catch (error: any) {
    console.error('Error fetching customer timeline:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer timeline' },
      { status: 500 }
    )
  }
}
