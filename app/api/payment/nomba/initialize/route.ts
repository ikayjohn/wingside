import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const requestId = `INIT-${Date.now()}`
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[Nomba Initialize ${requestId}] Starting payment initialization`)
  console.log(`${'='.repeat(60)}`)

  try {
    const body = await request.json()
    const { order_id, amount, email, metadata } = body

    console.log(`[Nomba Initialize ${requestId}] Request body:`, {
      order_id,
      amount,
      email,
      metadata,
    })

    if (!order_id || !amount || !email) {
      console.error(`[Nomba Initialize ${requestId}] ❌ Missing required fields`)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify order exists
    console.log(`[Nomba Initialize ${requestId}] Fetching order ${order_id}...`)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number, total, customer_name, customer_email')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error(`[Nomba Initialize ${requestId}] ❌ Order not found:`, orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log(`[Nomba Initialize ${requestId}] ✅ Order found: ${order.order_number}`)

    // Check Nomba credentials
    const accountId = process.env.NOMBA_ACCOUNT_ID

    if (!accountId) {
      console.error(`[Nomba Initialize ${requestId}] ❌ NOMBA_ACCOUNT_ID not configured`)
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    console.log(`[Nomba Initialize ${requestId}] ✅ Account ID configured: ${accountId}`)

    // Get access token
    console.log(`[Nomba Initialize ${requestId}] Requesting access token...`)
    const accessToken = await getNombaAccessToken()

    if (!accessToken) {
      console.error(`[Nomba Initialize ${requestId}] ❌ Failed to get access token`)
      return NextResponse.json(
        { error: 'Failed to authenticate with payment gateway' },
        { status: 500 }
      )
    }

    console.log(`[Nomba Initialize ${requestId}] ✅ Access token obtained: ${accessToken.substring(0, 20)}...`)

    // Build callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
    const callbackUrl = `${appUrl}/payment/nomba/callback?order_id=${order_id}`

    console.log(`[Nomba Initialize ${requestId}] Callback URL: ${callbackUrl}`)

    // Generate unique order reference
    const orderReference = `WS-${order.order_number}-${Date.now()}`
    console.log(`[Nomba Initialize ${requestId}] Order reference: ${orderReference}`)

    // IMPORTANT: Nomba expects amount in naira format (NOT kobo like Paystack!)
    // Format as string with 2 decimal places (e.g., "250.00" for ₦250)
    const amountInNaira = Number(amount).toFixed(2)
    console.log(`[Nomba Initialize ${requestId}] Amount: ₦${amount} → "${amountInNaira}" (naira format)`)

    // Create checkout order
    console.log(`[Nomba Initialize ${requestId}] Creating checkout order...`)
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
          amount: amountInNaira, // Send as string in naira format with 2 decimals
          currency: 'NGN',
        },
        tokenizeCard: false,
      }),
    })

    const checkoutData: NombaCheckoutResponse = await checkoutResponse.json()

    console.log(`[Nomba Initialize ${requestId}] Nomba API response:`, {
      status: checkoutResponse.status,
      code: checkoutData.code,
      description: checkoutData.description,
      hasCheckoutLink: !!checkoutData.data?.checkoutLink,
    })

    if (checkoutData.code !== '00' || !checkoutData.data?.checkoutLink) {
      console.error(`[Nomba Initialize ${requestId}] ❌ Checkout creation failed:`, checkoutData)
      return NextResponse.json(
        {
          error: checkoutData.description || 'Failed to initialize payment',
          details: checkoutData
        },
        { status: 500 }
      )
    }

    console.log(`[Nomba Initialize ${requestId}] ✅ Checkout created successfully`)

    // Update order with payment reference (use admin client to bypass RLS)
    console.log(`[Nomba Initialize ${requestId}] Updating order with payment reference...`)
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        payment_reference: orderReference,
        payment_gateway: 'nomba',
      })
      .eq('id', order_id)

    if (updateError) {
      console.error(`[Nomba Initialize ${requestId}] ❌ CRITICAL: Failed to update order:`, updateError)
      console.error(`[Nomba Initialize ${requestId}] Order ID: ${order_id}`)
      console.error(`[Nomba Initialize ${requestId}] Payment Reference: ${orderReference}`)
      // Don't proceed if we can't update the order - the webhook won't be able to find it!
      return NextResponse.json(
        {
          error: 'Failed to initialize payment. Please try again.',
          details: 'Could not update order with payment reference'
        },
        { status: 500 }
      )
    }

    console.log(`[Nomba Initialize ${requestId}] ✅ Order updated with payment reference`)

    console.log(`[Nomba Initialize ${requestId}] ✅ Payment initialization complete`)
    console.log(`Checkout URL: ${checkoutData.data.checkoutLink}`)
    console.log(`${'='.repeat(60)}\n`)

    return NextResponse.json({
      checkout_url: checkoutData.data.checkoutLink,
      order_reference: orderReference,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Nomba Initialize ${requestId}] ❌ Exception:`, error)
    console.error(`[Nomba Initialize ${requestId}] Error message: ${errorMessage}`)
    console.error(`[Nomba Initialize ${requestId}] Stack:`, error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
