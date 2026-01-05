import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/wallet-history - Fetch user's wallet transaction history
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

    // Fetch actual wallet transactions
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // If table doesn't exist yet, return empty array with a warning
      if (error.code === '42P01') {
        console.warn('wallet_transactions table not found - returning empty history')
        return NextResponse.json({
          transactions: [],
          balance: 0,
          message: 'Wallet system will be available soon'
        })
      }

      console.error('Error fetching wallet history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wallet history' },
        { status: 500 }
      )
    }

    // Get current balance from the latest transaction
    const currentBalance = transactions && transactions.length > 0
      ? transactions[0].balance_after
      : 0

    return NextResponse.json({
      transactions: transactions || [],
      balance: currentBalance
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}