import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/orders - Fetch user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')

    // If orderNumber is provided, fetch that specific order (no auth required for confirmation)
    if (orderNumber) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', orderNumber)

      if (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json(
          { error: 'Failed to fetch order' },
          { status: 500 }
        )
      }

      return NextResponse.json({ orders })
    }

    // For listing orders, require authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false })

    // If not admin, only show user's orders
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
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

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get user (optional for guest checkout)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number')
    const orderNumber = orderNumberData || `WS${Date.now()}`

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + item.total_price,
      0
    )
    const deliveryFee = body.delivery_fee || 0
    const tax = body.tax || 0
    const total = subtotal + deliveryFee + tax

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        delivery_address_id: body.delivery_address_id,
        delivery_address_text: body.delivery_address_text,
        status: 'pending',
        payment_status: 'pending',
        payment_method: body.payment_method,
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        total,
        notes: body.notes,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_size: item.size,
      flavors: item.flavors,
      addons: item.addons || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
