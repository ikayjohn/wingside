import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/referrals - Fetch all referrals (admin only)
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin()
    if (auth.success !== true) return auth.error

    const { admin } = auth

    const { data, error } = await admin
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey (
          full_name,
          email,
          referral_code
        ),
        referred_user:profiles!referrals_referred_user_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}
