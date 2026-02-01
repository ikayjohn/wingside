import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/referral-fraud/scan - Run fraud detection scan
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret first (for automated scans)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let isAuthorized = false

    // Option 1: CRON_SECRET authentication (for cron jobs)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    }
    // Option 2: Admin session authentication (for manual use)
    else {
      const supabase = await createClient()

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (!authError && user) {
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else if (profile?.role === 'admin') {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access or valid cron secret required' },
        { status: 401 }
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
