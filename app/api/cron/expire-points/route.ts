import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/cron/expire-points - Process points expiration
// This should be called via a cron job (daily)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized points expiration attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Call the process_points_expiration function
    const { data: expirations, error } = await supabase.rpc('process_points_expiration')

    if (error) {
      console.error('Error processing points expiration:', error)
      return NextResponse.json(
        { error: 'Failed to process points expiration', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Processed ${expirations?.length || 0} points expirations`)

    // Log details of each expiration
    if (expirations && expirations.length > 0) {
      expirations.forEach((exp: {
        email: string
        points_expired: number
        reward_type: string
        expired_at: string
      }) => {
        console.log(
          `  ⏰ ${exp.email}: ${exp.points_expired} ${exp.reward_type} points expired (${new Date(exp.expired_at).toLocaleDateString()})`
        )
      })
    }

    return NextResponse.json({
      success: true,
      expirations_processed: expirations?.length || 0,
      expirations: expirations || []
    })
  } catch (error: unknown) {
    console.error('Points expiration processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/cron/expire-points - Preview points that will expire (for testing)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized points expiration preview attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Query rewards that are expired but not yet processed
    const { data: expiredRewards, error } = await supabase
      .from('rewards')
      .select(`
        id,
        user_id,
        reward_type,
        points,
        expires_at,
        status,
        profiles!inner(email, full_name)
      `)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'earned')
      .order('expires_at', { ascending: true })

    if (error) {
      console.error('Error fetching expired rewards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch expired rewards', details: error.message },
        { status: 500 }
      )
    }

    // Calculate summary
    const preview = expiredRewards?.map(reward => ({
      email: (reward.profiles as any).email,
      full_name: (reward.profiles as any).full_name,
      reward_type: reward.reward_type,
      points: reward.points,
      expired_at: reward.expires_at,
      days_overdue: Math.floor(
        (Date.now() - new Date(reward.expires_at!).getTime()) / (24 * 60 * 60 * 1000)
      )
    })) || []

    const totalPointsToExpire = preview.reduce((sum, r) => sum + r.points, 0)

    return NextResponse.json({
      total_affected: preview.length,
      total_points_to_expire: totalPointsToExpire,
      rewards: preview
    })
  } catch (error: unknown) {
    console.error('Points expiration preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
