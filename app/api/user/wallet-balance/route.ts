import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/wallet-balance - Fetch user's current wallet balance
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the latest transaction to find current balance
    const { data: latestTransaction, error } = await supabase
      .from('wallet_transactions')
      .select('balance_after')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is ok for new users
      console.error('Error fetching wallet balance:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wallet balance' },
        { status: 500 }
      )
    }

    const balance = latestTransaction?.balance_after || 0

    return NextResponse.json({
      balance: Number(balance),
      currency: 'NGN'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
