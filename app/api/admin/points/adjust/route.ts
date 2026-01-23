import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/points/adjust - Flexibly adjust points (positive = award, negative = deduct)
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

    // Parse request body
    const body = await request.json()
    const { userId, pointsChange, reason, metadata } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (pointsChange === undefined || pointsChange === null || pointsChange === 0) {
      return NextResponse.json(
        { error: 'pointsChange must be a non-zero integer (positive to award, negative to deduct)' },
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

    // Call the admin_adjust_points function
    const { data, error } = await adminSupabase.rpc('admin_adjust_points', {
      p_user_id: userId,
      p_points_change: pointsChange,
      p_reason: reason,
      p_admin_id: user.id,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Error adjusting points:', error)
      return NextResponse.json(
        { error: 'Failed to adjust points', details: error.message },
        { status: 500 }
      )
    }

    const result = data[0]

    // Get user info for response
    const { data: targetUser } = await adminSupabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    const action = pointsChange > 0 ? 'awarded' : 'deducted'
    const absPoints = Math.abs(pointsChange)

    console.log(
      `✅ Admin ${profile.role} (${user.email}) ${action} ${absPoints} points ${pointsChange > 0 ? 'to' : 'from'} ${targetUser?.email}. Reason: ${reason}`
    )

    return NextResponse.json({
      success: result.success,
      newTotalPoints: result.new_total_points,
      transactionId: result.transaction_id,
      actionType: result.action_type,
      user: {
        id: userId,
        email: targetUser?.email,
        fullName: targetUser?.full_name
      },
      pointsChange,
      reason
    })
  } catch (error: unknown) {
    console.error('Admin adjust points error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
