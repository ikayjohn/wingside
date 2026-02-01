import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/points/award - Manually award points to a user (Admin only)
export async function POST(request: NextRequest) {
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, points, reason, metadata } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!points || points <= 0) {
      return NextResponse.json(
        { error: 'points must be a positive integer' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      )
    }

    // Use admin client to call the function
    const adminSupabase = createAdminClient()

    // Call the admin_award_points function
    const { data, error } = await adminSupabase.rpc('admin_award_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
      p_admin_id: user.id,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Error awarding points:', error)
      return NextResponse.json(
        { error: 'Failed to award points', details: error.message },
        { status: 500 }
      )
    }

    const result = data[0]

    // Get user info for response
    const { data: targetUser, error: targetUserError } = await adminSupabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (targetUserError) {
      console.error('Error fetching target user:', targetUserError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(
      `✅ Admin ${profile.role} (${user.email}) awarded ${points} points to ${targetUser?.email}. Reason: ${reason}`
    )

    return NextResponse.json({
      success: result.success,
      newTotalPoints: result.new_total_points,
      transactionId: result.transaction_id,
      user: {
        id: userId,
        email: targetUser?.email,
        fullName: targetUser?.full_name
      },
      pointsAwarded: points,
      reason
    })
  } catch (error: unknown) {
    console.error('Admin award points error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
