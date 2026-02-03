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

    // Transform transactions to match frontend interface
    const formattedTransactions = transactions?.map((t: any) => {
      // Map transaction_type to user-friendly type
      const typeMap: Record<string, string> = {
        'refund': 'Refund',
        'funding': 'Wallet Funding',
        'order_payment': 'Order Payment',
        'referral_reward': 'Referral Reward',
        'first_order_bonus': 'First Order Bonus',
        'purchase_points': 'Purchase Points',
        'promo_credit': 'Promo Credit',
        'social_verification': 'Social Verification',
        'streak_bonus': 'Streak Bonus',
        'manual_adjustment': 'Manual Adjustment',
        'affiliate_commission': 'Affiliate Commission',
        'cashback': 'Cashback',
        'card_payment': 'Card Payment',
        'card_refund': 'Card Refund',
        'card_topup': 'Card Top-Up'
      }

      // Check if this is a card transaction
      const isCardTransaction = t.metadata?.transaction_type === 'card_tap' ||
                                t.transaction_type === 'card_payment' ||
                                t.transaction_type === 'card_refund' ||
                                t.transaction_type === 'card_topup';

      return {
        id: t.id,
        type: typeMap[t.transaction_type] || t.transaction_type || 'Transaction',
        description: t.description || 'Wallet transaction',
        amount: t.type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount),
        status: t.status || 'pending',
        paymentMethod: isCardTransaction ? 'wingside_card' : (t.metadata?.payment_method || 'wallet'),
        createdAt: t.created_at,
        orderNumber: t.order_id,
        // Include card transaction details if available
        ...(isCardTransaction && {
          cardDetails: {
            card_serial: t.metadata?.card_serial,
            merchant: t.metadata?.merchant,
            location: t.metadata?.location
          }
        })
      }
    }) || []

    // Get current balance from the latest transaction
    const currentBalance = transactions && transactions.length > 0
      ? transactions[0].balance_after
      : 0

    return NextResponse.json({
      transactions: formattedTransactions,
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