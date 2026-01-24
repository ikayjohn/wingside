import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/referral-fraud/scan - Run fraud detection scan
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

    const adminSupabase = createAdminClient()

    // Run fraud detection
    const { data, error } = await adminSupabase.rpc('run_referral_fraud_detection')

    if (error) {
      console.error('Error running fraud detection:', error)
      return NextResponse.json(
        { error: 'Failed to run fraud detection', details: error.message },
        { status: 500 }
      )
    }

    const result = data[0]

    console.log(`✅ Fraud detection scan completed: ${result.flags_created} flags created`)

    return NextResponse.json({
      success: true,
      flagsCreated: result.flags_created,
      summary: result.summary
    })
  } catch (error: unknown) {
    console.error('Fraud detection scan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
