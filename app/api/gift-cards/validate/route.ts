import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit'

// POST /api/gift-cards/validate - Validate gift card code
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { code } = body

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // Validate code format (12 alphanumeric characters)
    const codeStr = String(code).trim().toUpperCase()
    if (!/^[A-Z0-9]{12}$/.test(codeStr)) {
      return NextResponse.json(
        { error: 'Invalid gift card code format. Must be 12 alphanumeric characters.' },
        { status: 400 }
      )
    }

    // Rate limiting to prevent brute force: 10 validation attempts per minute per IP
    const clientIp = await getClientIp()
    const rateLimitKey = `gift-card-validate:${clientIp}`
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 10,
      window: 60 * 1000, // 1 minute
      blockDuration: 5 * 60 * 1000 // 5 minute block
    })

    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit)
    }

    const supabase = await createClient()

    // Fetch gift card details
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('id, code, current_balance, is_active, expires_at, recipient_name, design_image')
      .eq('code', codeStr)
      .single()

    if (giftCardError || !giftCard) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid gift card code'
        },
        { status: 404 }
      )
    }

    // Check if active
    if (!giftCard.is_active) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Gift card is not active'
        },
        { status: 400 }
      )
    }

    // Check if expired
    const expiryDate = new Date(giftCard.expires_at)
    if (expiryDate < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Gift card has expired'
        },
        { status: 400 }
      )
    }

    // Check if has balance
    if (giftCard.current_balance <= 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Gift card has no remaining balance'
        },
        { status: 400 }
      )
    }

    // Return valid gift card details
    return NextResponse.json({
      valid: true,
      gift_card: {
        id: giftCard.id,
        code: giftCard.code,
        balance: giftCard.current_balance,
        expires_at: giftCard.expires_at,
        recipient_name: giftCard.recipient_name,
        design_image: giftCard.design_image,
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Gift card validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
