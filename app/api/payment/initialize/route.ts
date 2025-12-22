import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/payment/initialize - Initialize Paystack payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, amount, email, metadata } = body

    if (!order_id || !amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Initialize payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Convert amount to kobo (Paystack expects amounts in kobo/cents)
    const amountInKobo = Math.round(amount * 100)

    // Build callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
    const callbackUrl = `${appUrl}/payment/callback?order_id=${order_id}`

    const paystackResponse = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference: `${order.order_number}_${Date.now()}`,
          callback_url: callbackUrl,
          metadata: {
            order_id,
            order_number: order.order_number,
            ...metadata,
          },
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData)
      return NextResponse.json(
        { error: paystackData.message || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({
        payment_reference: paystackData.data.reference,
      })
      .eq('id', order_id)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error: any) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
