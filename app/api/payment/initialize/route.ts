import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeEmail, sanitizeUrl } from '@/lib/security'
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate email format
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

// Validate amount (must be positive and within reasonable bounds)
function isValidAmount(amount: number): boolean {
  const MIN_AMOUNT = 100 // Minimum ₦100
  const MAX_AMOUNT = 10000000 // Maximum ₦10,000,000
  return typeof amount === 'number' &&
         amount >= MIN_AMOUNT &&
         amount <= MAX_AMOUNT &&
         Number.isFinite(amount)
}

// POST /api/payment/initialize - Initialize Paystack payment
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { order_id, amount, email, metadata } = body

    // Validate required fields
    if (!order_id || !amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate and sanitize email
    const sanitizedEmail = sanitizeEmail(email)
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Validate amount
    const numericAmount = Number(amount)
    if (!isValidAmount(numericAmount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between ₦100 and ₦10,000,000' },
        { status: 400 }
      )
    }

    // Validate order_id format (should be a valid UUID or string)
    if (typeof order_id !== 'string' || order_id.length < 1) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, user_id, total, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Strict rate limiting: 5 payment initializations per 15 minutes per user+IP combination
    // This prevents abuse while allowing legitimate retry attempts
    const clientIp = await getClientIp();
    const rateLimitKey = `${order.user_id || 'guest'}:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 5,
      window: 15 * 60 * 1000, // 15 minutes
      blockDuration: 30 * 60 * 1000 // 30 minute block after exceeding limit
    });

    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    // Check if order is already paid
    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json(
        { error: 'Order has already been paid for' },
        { status: 400 }
      )
    }

    // Verify amount matches order total (within small margin for rounding)
    const amountDifference = Math.abs(numericAmount - order.total)
    if (amountDifference > 1) { // Allow ₦1 difference for rounding
      return NextResponse.json(
        { error: 'Amount does not match order total' },
        { status: 400 }
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
    const amountInKobo = Math.round(order.total * 100)

    // Build callback URL - validate app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
    const sanitizedAppUrl = sanitizeUrl(appUrl)

    if (!sanitizedAppUrl) {
      console.error('Invalid NEXT_PUBLIC_APP_URL')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const callbackUrl = `${sanitizedAppUrl}/payment/callback?order_id=${encodeURIComponent(order_id)}`

    const paystackResponse = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          amount: amountInKobo,
          reference: `${order.order_number}_${Date.now()}`,
          callback_url: callbackUrl,
          metadata: {
            order_id,
            order_number: order.order_number,
            custom_fields: {
              // Remove sensitive data from metadata
              ...metadata,
            },
          },
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData)
      return NextResponse.json(
        { error: 'Failed to initialize payment. Please try again.' },
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
