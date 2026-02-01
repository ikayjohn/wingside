import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { sendOrderConfirmation, sendOrderNotification } from '@/lib/emails/service'

// GET /api/orders - Fetch user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const orderId = searchParams.get('orderId')

    // Order lookup requires either authentication or email verification
    // SECURITY: Never use admin client for unauthenticated order lookups
    if (orderNumber) {
      console.log(`[Orders API] Looking up order by orderNumber: ${orderNumber}`)

      // Get email parameter for verification (required for guest lookups)
      const verificationEmail = searchParams.get('email')

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      // For authenticated users, use normal client with RLS
      if (user) {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('order_number', orderNumber)

        if (error) {
          console.error('[Orders API] Error fetching order:', error)
          return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
          )
        }

        console.log(`[Orders API] ✅ Returning ${orders?.length || 0} orders for authenticated user`)
        return NextResponse.json({ orders })
      }

      // For guest users, require email verification
      if (!verificationEmail) {
        return NextResponse.json(
          { error: 'Email verification required for order lookup' },
          { status: 401 }
        )
      }

      // Use admin client ONLY with email verification for guest orders
      console.log('[Orders API] Guest order lookup with email verification')
      const admin = createAdminClient()
      const { data: orders, error } = await admin
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('order_number', orderNumber)
        .eq('customer_email', verificationEmail.toLowerCase().trim())

      if (error) {
        console.error('[Orders API] Error fetching order:', error)
        return NextResponse.json(
          { error: 'Failed to fetch order' },
          { status: 500 }
        )
      }

      if (!orders || orders.length === 0) {
        return NextResponse.json(
          { error: 'Order not found or email does not match' },
          { status: 404 }
        )
      }

      console.log(`[Orders API] ✅ Returning ${orders.length} orders for verified guest`)
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
    const discountAmount = body.discount_amount || 0
    const referralDiscount = body.referral_discount || 0
    const total = subtotal + deliveryFee + tax - discountAmount - referralDiscount

    // Validate promo code if provided
    if (body.promo_code_id) {
      const { data: promoCode, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('id', body.promo_code_id)
        .eq('is_active', true)
        .single()

      if (promoError || !promoCode) {
        return NextResponse.json(
          { error: 'Invalid promo code' },
          { status: 400 }
        )
      }

      // Check expiration
      const now = new Date()
      if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
        return NextResponse.json(
          { error: 'Promo code has expired' },
          { status: 400 }
        )
      }

      if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
        return NextResponse.json(
          { error: 'Promo code not yet valid' },
          { status: 400 }
        )
      }

      // Check usage limit
      if (promoCode.usage_limit && promoCode.used_count >= promoCode.usage_limit) {
        return NextResponse.json(
          { error: 'Promo code usage limit reached' },
          { status: 400 }
        )
      }

      // Check minimum order amount
      if (subtotal < promoCode.min_order_amount) {
        return NextResponse.json(
          { error: `Minimum order amount for this promo code is ₦${promoCode.min_order_amount.toLocaleString()}` },
          { status: 400 }
        )
      }
    }

    // Generate secure tracking token for guest order tracking
    const trackingToken = crypto.randomBytes(32).toString('hex');

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        tracking_token: trackingToken,
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
        promo_code_id: body.promo_code_id || null,
        discount_amount: body.discount_amount || 0,
        referral_code: body.referral_code || null,
        referral_discount: body.referral_discount || 0,
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
        // Call the referral reward processing function with detailed status tracking
        const { data: rewardResult, error: rewardError } = await supabase.rpc(
          'process_referral_reward_after_first_order',
          {
            user_id: user.id,
            order_amount: total
          }
        )

        if (rewardError) {
          console.error('❌ Error processing referral reward:', {
            userId: user.id,
            orderId: order.id,
            orderNumber: order.order_number,
            error: rewardError
          });

          // Create admin notification for failed referral reward
          await supabase.from('notifications').insert({
            user_id: null, // Admin notification
            type: 'referral_reward_failed',
            title: 'Referral Reward Processing Failed',
            message: `Failed to process referral reward for order ${order.order_number}. User: ${order.customer_email}`,
            metadata: {
              user_id: user.id,
              order_id: order.id,
              order_number: order.order_number,
              error: rewardError.message
            }
          });

          // Don't fail the order, but ensure error is visible
        } else if (rewardResult && rewardResult.length > 0) {
          const result = rewardResult[0];

          if (result.success) {
            // Log detailed status
            console.log('✅ Referral reward processing completed:', {
              userId: user.id,
              referrerCredited: result.referrer_credited,
              referredCredited: result.referred_credited,
              errorMessage: result.error_message
            });

            // Check if any wallet credit failed
            if (!result.referrer_credited || !result.referred_credited) {
              // Create notification for partial failure
              await supabase.from('notifications').insert({
                user_id: null,
                type: 'referral_reward_partial_failure',
                title: 'Referral Reward Partially Failed',
                message: `Order ${order.order_number}: ${result.error_message}`,
                metadata: {
                  user_id: user.id,
                  order_id: order.id,
                  order_number: order.order_number,
                  referrer_credited: result.referrer_credited,
                  referred_credited: result.referred_credited,
                  error: result.error_message
                }
              });
              console.warn('⚠️ Referral reward partially failed:', result.error_message);
            }
          } else {
            console.log('ℹ️ No referral reward to process:', result.error_message);
          }
        } else {
          console.log('ℹ️ No referral reward data returned');
        }
      } catch (error) {
        console.error('❌ Error in referral processing:', {
          userId: user.id,
          orderId: order.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

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
