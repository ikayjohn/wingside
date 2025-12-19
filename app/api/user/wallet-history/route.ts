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

    // TODO: Replace with actual wallet transaction table when implemented
    // For now, return recent order payments as wallet transactions
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        order_number,
        total,
        payment_status,
        payment_method,
        created_at,
        status
      `)
      .eq('user_id', user.id)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching wallet history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wallet history' },
        { status: 500 }
      )
    }

    // Transform orders into wallet transaction format
    const transactions = orders?.map(order => ({
      id: order.order_number,
      type: 'payment', // payment, refund, funding, etc.
      amount: -Number(order.total), // Negative for outgoing payments
      description: `Order Payment - ${order.order_number}`,
      status: order.status === 'delivered' ? 'completed' : 'pending',
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      orderNumber: order.order_number,
    })) || []

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}