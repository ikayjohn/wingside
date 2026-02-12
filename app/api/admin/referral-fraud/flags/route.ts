import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/referral-fraud/flags - Get all fraud flags
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const fraudType = searchParams.get('fraudType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = adminSupabase
      .from('referral_fraud_flags')
      .select(`
        *,
        referral:referrals!referral_id(
          id,
          referrer_id,
          referred_user_id,
          referred_email,
          referral_code_used,
          status,
          created_at
        ),
        referrer:referrals!referral_id(
          referrer:profiles!referrer_id(
            id,
            email,
            full_name
          )
        ),
        reviewer:profiles!reviewed_by(
          id,
          email,
          full_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)
    if (fraudType) query = query.eq('fraud_type', fraudType)

    // Apply pagination and ordering
    const { data: flags, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching fraud flags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fraud flags', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      flags: flags || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error: unknown) {
    console.error('Get fraud flags error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
