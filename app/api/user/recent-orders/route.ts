import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/recent-orders - Fetch user's recent orders
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

    // Fetch user's recent orders with items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          product_name,
          size,
          flavors,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching recent orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}