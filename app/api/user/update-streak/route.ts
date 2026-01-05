import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/user/update-streak - Update user streak
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_order_date, streak_start_date')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastOrderDate = profile.last_order_date ? new Date(profile.last_order_date) : null
    if (lastOrderDate) {
      lastOrderDate.setHours(0, 0, 0, 0)
    }

    let currentStreak = profile.current_streak || 0
    let longestStreak = profile.longest_streak || 0
    let streakStartDate = profile.streak_start_date ? new Date(profile.streak_start_date) : today

    // Calculate if this is a consecutive day
    const oneDayMs = 24 * 60 * 60 * 1000
    const daysDiff = lastOrderDate ? Math.floor((today.getTime() - lastOrderDate.getTime()) / oneDayMs) : null

    if (!lastOrderDate) {
      // First order ever
      currentStreak = 1
      streakStartDate = today
    } else if (daysDiff === 0) {
      // Same day - don't update streak
      return NextResponse.json({
        streak: currentStreak,
        longestStreak,
        message: 'Already updated today'
      })
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      currentStreak += 1
    } else {
      // Streak broken - start new streak
      currentStreak = 1
      streakStartDate = today
    }

    // Update longest streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_order_date: today.toISOString().split('T')[0],
        streak_start_date: streakStartDate.toISOString().split('T')[0],
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating streak:', updateError)
      return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
    }

    return NextResponse.json({
      streak: currentStreak,
      longestStreak,
      message: currentStreak > 1 ? `🔥 ${currentStreak} day streak!` : 'Streak updated!',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
