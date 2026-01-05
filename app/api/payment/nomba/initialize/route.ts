import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

interface NombaAuthResponse {
  code: string
  description: string
  data?: {
    access_token: string
    expiresAt: string
  }
}

interface NombaCheckoutResponse {
  code: string
  description: string
  data?: {
    checkoutLink: string
    orderReference: string
  }
}

// Get Nomba access token
async function getNombaAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.NOMBA_CLIENT_ID
    const clientSecret = process.env.NOMBA_CLIENT_SECRET
    const accountId = process.env.NOMBA_ACCOUNT_ID

    if (!clientId || !clientSecret || !accountId) {
      console.error('Nomba credentials not configured')
      return null
    }

    const response = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const data: NombaAuthResponse = await response.json()

    if (data.code === '00' && data.data?.access_token) {
      return data.data.access_token
    }

    console.error('Failed to get Nomba access token:', data)
    return null
  } catch (error) {
    console.error('Error getting Nomba access token:', error)
    return null
  }
}

// POST /api/payment/nomba/initialize - Initialize Nomba checkout
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

    const supabase = createClient()

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

    // Check Nomba credentials
    const accountId = process.env.NOMBA_ACCOUNT_ID

    if (!accountId) {
      console.error('NOMBA_ACCOUNT_ID not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Get access token
    const accessToken = await getNombaAccessToken()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with payment gateway' },
        { status: 500 }
      )
    }

    // Build callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
    const callbackUrl = `${appUrl}/payment/nomba/callback?order_id=${order_id}`

    // Generate unique order reference
    const orderReference = `WS-${order.order_number}-${Date.now()}`

    // Create checkout order
    const checkoutResponse = await fetch('https://api.nomba.com/v1/checkout/order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        order: {
          orderReference,
          customerId: order_id,
          callbackUrl,
          customerEmail: email,
          amount: amount.toFixed(2),
          currency: 'NGN',
        },
        tokenizeCard: false, // Set to true if you want to save cards for future
      }),
    })

    const checkoutData: NombaCheckoutResponse = await checkoutResponse.json()

    if (checkoutData.code !== '00' || !checkoutData.data?.checkoutLink) {
      console.error('Nomba checkout creation error:', checkoutData)
      return NextResponse.json(
        { error: checkoutData.description || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({
        payment_reference: orderReference,
        payment_gateway: 'nomba',
      })
      .eq('id', order_id)

    return NextResponse.json({
      checkout_url: checkoutData.data.checkoutLink,
      order_reference: orderReference,
    })
  } catch (error: any) {
    console.error('Nomba payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
