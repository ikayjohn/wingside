import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/referral-fraud/review - Review a fraud flag
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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { flagId, status, adminNotes } = body

    // Validate required fields
    if (!flagId) {
      return NextResponse.json(
        { error: 'flagId is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['flagged', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Call review function
    const { data, error } = await adminSupabase.rpc('review_fraud_flag', {
      p_flag_id: flagId,
      p_admin_id: user.id,
      p_status: status,
      p_admin_notes: adminNotes || null
    })

    if (error) {
      console.error('Error reviewing fraud flag:', error)
      return NextResponse.json(
        { error: 'Failed to review fraud flag', details: error.message },
        { status: 500 }
      )
    }

    // Get updated flag details
    const { data: updatedFlag, error: flagError } = await adminSupabase
      .from('referral_fraud_flags')
      .select('*')
      .eq('id', flagId)
      .single()

    if (flagError) {
      console.error('Error fetching updated flag:', flagError)
      return NextResponse.json(
        { error: 'Failed to fetch updated flag' },
        { status: 500 }
      )
    }

    console.log(`✅ Admin ${user.email} reviewed fraud flag ${flagId}: ${status}`)

    return NextResponse.json({
      success: true,
      flag: updatedFlag
    })
  } catch (error: unknown) {
    console.error('Review fraud flag error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
