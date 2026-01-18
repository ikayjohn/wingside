import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/referral-rewards - Fetch all referral rewards (admin only)
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('referral_rewards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error fetching referral rewards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral rewards' },
      { status: 500 }
    )
  }
}
