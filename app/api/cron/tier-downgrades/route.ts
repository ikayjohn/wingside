import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/cron/tier-downgrades - Process tier downgrades for inactive users
// This should be called via a cron job (daily or weekly)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized tier downgrade attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Call the process_tier_downgrades function
    const { data: downgrades, error } = await supabase.rpc('process_tier_downgrades')

    if (error) {
      console.error('Error processing tier downgrades:', error)
      return NextResponse.json(
        { error: 'Failed to process tier downgrades', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Processed ${downgrades?.length || 0} tier downgrades`)

    // Log details of each downgrade
    if (downgrades && downgrades.length > 0) {
      downgrades.forEach((downgrade: {
        email: string
        old_tier: string
        new_tier: string
        old_points: number
        new_points: number
        days_inactive: number
      }) => {
        console.log(
          `  📉 ${downgrade.email}: ${downgrade.old_tier} → ${downgrade.new_tier} ` +
          `(${downgrade.old_points} → ${downgrade.new_points} pts, inactive ${downgrade.days_inactive} days)`
        )
      })
    }

    return NextResponse.json({
      success: true,
      downgrades_processed: downgrades?.length || 0,
      downgrades: downgrades || []
    })
  } catch (error: unknown) {
    console.error('Tier downgrade processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/cron/tier-downgrades - Preview users who would be downgraded (for testing)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized tier downgrade preview attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Query users who would be affected (without actually downgrading)
    const { data: inactiveUsers, error } = await supabase
      .from('profiles')
      .select('id, email, total_points, last_activity_date')
      .lt('last_activity_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .gt('total_points', 0)
      .order('total_points', { ascending: false })

    if (error) {
      console.error('Error fetching inactive users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inactive users', details: error.message },
        { status: 500 }
      )
    }

    // Calculate what would happen to each user
    const preview = inactiveUsers?.map(user => {
      const points = user.total_points || 0
      const daysInactive = Math.floor(
        (Date.now() - new Date(user.last_activity_date).getTime()) / (24 * 60 * 60 * 1000)
      )

      let oldTier = 'Wing Member'
      let newTier = 'Wing Member'
      let newPoints = points

      if (points >= 20000) {
        oldTier = 'Wingzard'
        newTier = 'Wing Leader'
        newPoints = 20000
      } else if (points >= 5001) {
        oldTier = 'Wing Leader'
        newTier = 'Wing Member'
        newPoints = 5001
      }

      return {
        email: user.email,
        old_tier: oldTier,
        new_tier: newTier,
        old_points: points,
        new_points: newPoints,
        points_lost: points - newPoints,
        days_inactive: daysInactive,
        last_activity: user.last_activity_date
      }
    }) || []

    return NextResponse.json({
      total_affected: preview.length,
      users: preview
    })
  } catch (error: unknown) {
    console.error('Tier downgrade preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
