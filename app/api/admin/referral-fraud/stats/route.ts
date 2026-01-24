import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/referral-fraud/stats - Get fraud detection statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()

    // Get dashboard stats
    const { data, error } = await adminSupabase.rpc('get_fraud_dashboard_stats')

    if (error) {
      console.error('Error fetching fraud stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fraud statistics', details: error.message },
        { status: 500 }
      )
    }

    const stats = data[0]

    return NextResponse.json({
      totalFlags: stats.total_flags,
      pendingReview: stats.pending_review,
      confirmedFraud: stats.confirmed_fraud,
      falsePositives: stats.false_positives,
      bySeverity: stats.by_severity,
      byType: stats.by_type,
      recentFlags: stats.recent_flags
    })
  } catch (error: unknown) {
    console.error('Get fraud stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
