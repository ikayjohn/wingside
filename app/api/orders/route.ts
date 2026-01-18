import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation, sendOrderNotification } from '@/lib/emails/service'

// GET /api/orders - Fetch user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const orderId = searchParams.get('orderId')

    // If orderNumber is provided, fetch that specific order (no auth required for confirmation/tracking)
    if (orderNumber) {
      console.log(`[Orders API] Looking up order by orderNumber: ${orderNumber}`)

      let { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', orderNumber)

      console.log(`[Orders API] Server client result:`, {
        found: orders?.length || 0,
        error: error?.message
      })

      // If server client fails (RLS) or returns empty, use admin client
      if (error || !orders || orders.length === 0) {
        console.log('[Orders API] Trying admin client...')
        const admin = createAdminClient()
        const result = await admin
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('order_number', orderNumber)

        orders = result.data
        error = result.error

        console.log(`[Orders API] Admin client result:`, {
          found: orders?.length || 0,
          error: error?.message
        })
      }

      if (error) {
        console.error('[Orders API] Error fetching order:', error)
        return NextResponse.json(
          { error: 'Failed to fetch order' },
          { status: 500 }
        )
      }

      console.log(`[Orders API] ✅ Returning ${orders?.length || 0} orders`)
      return NextResponse.json({ orders })
    }

    // If orderId is provided, fetch that specific order (no auth required for tracking)
    if (orderId) {
      let { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)

      // If server client fails (RLS), use admin client
      if (error && (!orders || orders.length === 0)) {
        console.log('[Orders API] Server client failed for orderId lookup, trying admin client...')
        const admin = createAdminClient()
        const result = await admin
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('id', orderId)

        orders = result.data
        error = result.error
      }

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

    // Process referral rewards if user is logged in and this is their first order
    if (user?.id && total >= 1000) { // Minimum order amount for referral rewards
      try {
        // Call the referral reward processing function (now awards points directly)
        const { data: rewardProcessed, error: rewardError } = await supabase.rpc(
          'process_referral_reward_after_first_order',
          {
            user_id: user.id,
            order_amount: total
          }
        )

        if (rewardError) {
          console.error('Error processing referral reward:', rewardError)
          // Don't fail the order, just log the error
        } else if (rewardProcessed) {
          console.log('Referral rewards (points) processed successfully for user:', user.id)
          // Points are now automatically credited to both users' profiles by the database function
        }
      } catch (error) {
        console.error('Error in referral processing:', error)
        // Don't fail the order, just log the error
      }
    }

    // Send order confirmation email to customer
    try {
      const emailResult = await sendOrderConfirmation({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: body.items.map((item: any) => ({
          product_name: item.product_name,
          product_size: item.size,
          flavors: item.flavors,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal,
        deliveryFee,
        tax,
        total,
        deliveryAddress: body.delivery_address_text,
        status: order.status,
      });

      if (!emailResult.success) {
        console.error('Failed to send order confirmation email:', emailResult.error);
        // Don't fail the order if email fails
      } else {
        console.log('Order confirmation email sent successfully to', order.customer_email);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    // Send order notification email to admin
    try {
      const notificationResult = await sendOrderNotification({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        items: body.items,
        total,
        deliveryAddress: body.delivery_address_text,
        paymentMethod: body.payment_method || 'card',
      });

      if (!notificationResult.success) {
        console.error('Failed to send order notification email:', notificationResult.error);
        // Don't fail the order if email fails
      } else {
        console.log('Order notification email sent successfully to admin');
      }
    } catch (emailError) {
      console.error('Error sending order notification email:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      order,
      referralRewardsProcessed: user?.id ? true : false
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
