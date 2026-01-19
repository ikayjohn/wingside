import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/referral-rewards - Fetch all referral rewards (admin only)
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin()
    if (auth.success !== true) return auth.error

    const { admin } = auth

    const { data, error } = await admin
      .from('referral_rewards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching referral rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral rewards' },
      { status: 500 }
    )
  }
}
