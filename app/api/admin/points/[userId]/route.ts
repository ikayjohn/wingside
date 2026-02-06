import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/points/[userId] - Get detailed points information for a user (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Use admin client to call the function
    const adminSupabase = createAdminClient()

    // Call the get_user_points_details function
    const { data, error } = await adminSupabase.rpc('get_user_points_details', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error fetching user points details:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch user points details',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('No data returned for user:', userId)
      return NextResponse.json(
        { error: 'User not found or no data returned', userId },
        { status: 404 }
      )
    }

    const userDetails = data[0]

    return NextResponse.json({
      userId: userDetails.user_id,
      email: userDetails.email,
      fullName: userDetails.full_name,
      totalPoints: userDetails.total_points,
      tier: userDetails.tier,
      summary: {
        totalEarned: userDetails.points_earned_total,
        totalRedeemed: userDetails.points_redeemed_total,
        totalExpired: userDetails.points_expired_total,
        netBalance: userDetails.total_points
      },
      recentTransactions: userDetails.recent_transactions || []
    })
  } catch (error: unknown) {
    console.error('Admin get user points details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
