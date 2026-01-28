import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateOrderStreak } from '@/lib/streak/helper'

// POST /api/user/update-streak - Update user streak (authenticated endpoint)
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

    // Get order total from request body
    const body = await request.json().catch(() => ({ orderTotal: 0 }))
    const orderTotal = body.orderTotal || 0

    // Call the shared streak helper function
    const result = await updateOrderStreak(
      user.id,
      orderTotal,
      false // Use regular client (already authenticated)
    )

    return NextResponse.json({
      streak: result.streak,
      longestStreak: result.longestStreak,
      message: result.message || 'Streak updated!',
      qualifiesForStreak: result.qualifiesForStreak,
      awardedPoints: result.awardedPoints || 0,
      streakCompleted: result.streakCompleted || false
    })
  } catch (error) {
    console.error('Unexpected error in update-streak API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
