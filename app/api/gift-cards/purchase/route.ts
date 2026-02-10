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

// Valid denominations in Naira
const VALID_DENOMINATIONS = [15000, 20000, 50000] as const
type Denomination = typeof VALID_DENOMINATIONS[number]

// Valid card designs (Valentine's + Love categories)
const VALID_DESIGNS = [
  'val-01.png', 'val-02.png', 'val-03.png', 'val-04.png',
  'gift-love1.png', 'gift-love2.png', 'gift-love3.png',
  'gift-love4.png', 'gift-love5.png', 'gift-love6.png'
] as const
type CardDesign = typeof VALID_DESIGNS[number]

// Validate denomination
function isValidDenomination(value: any): value is Denomination {
  return VALID_DENOMINATIONS.includes(value)
}

// Validate card design
function isValidCardDesign(value: any): value is CardDesign {
  return VALID_DESIGNS.includes(value)
}

// POST /api/gift-cards/purchase - Purchase a gift card
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

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

    const { denomination, design_image, recipient_name, recipient_email } = body

    // Validate required fields
    if (!denomination || !design_image || !recipient_name || !recipient_email) {
      return NextResponse.json(
        { error: 'Missing required fields: denomination, design_image, recipient_name, recipient_email' },
        { status: 400 }
      )
    }

    // Validate denomination
    if (!isValidDenomination(denomination)) {
      return NextResponse.json(
        { error: `Invalid denomination. Must be one of: ${VALID_DENOMINATIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate card design
    if (!isValidCardDesign(design_image)) {
      return NextResponse.json(
        { error: `Invalid card design. Must be one of: ${VALID_DESIGNS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate and sanitize recipient email
    const sanitizedEmail = sanitizeEmail(recipient_email)
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid recipient email address' },
        { status: 400 }
      )
    }

    // Validate recipient name (basic sanitization)
    const sanitizedName = recipient_name.trim()
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Recipient name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to purchase gift cards' },
        { status: 401 }
      )
    }

    // Rate limiting: 3 purchases per hour per user+IP
    const clientIp = await getClientIp()
    const rateLimitKey = `gift-card-purchase:${user.id}:${clientIp}`
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 3,
      window: 60 * 60 * 1000, // 1 hour
      blockDuration: 2 * 60 * 60 * 1000 // 2 hour block
    })

    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit)
    }

    // Calculate expiry date (6 months from now)
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 6)

    // Generate unique gift card code via database function
    const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_card_code')

    if (codeError || !codeData) {
      console.error('Error generating gift card code:', codeError)
      return NextResponse.json(
        { error: 'Failed to generate gift card code. Please try again.' },
        { status: 500 }
      )
    }

    const giftCardCode = codeData as string

    // Create gift card record (inactive until payment)
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        card_number: giftCardCode, // Backward compatibility
        pin: '0000', // Backward compatibility (not used for new system)
        denomination: denomination,
        initial_balance: denomination,
        current_balance: 0, // Will be set to denomination after payment
        recipient_name: sanitizedName,
        recipient_email: sanitizedEmail,
        purchased_by: user.id,
        design_image: design_image,
        is_active: false, // Will be activated after successful payment
        expires_at: expiryDate.toISOString(),
      })
      .select('id, code')
      .single()

    if (giftCardError || !giftCard) {
      console.error('Error creating gift card:', giftCardError)
      return NextResponse.json(
        { error: 'Failed to create gift card. Please try again.' },
        { status: 500 }
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
    const amountInKobo = denomination * 100

    // Build callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
    const sanitizedAppUrl = sanitizeUrl(appUrl)

    if (!sanitizedAppUrl) {
      console.error('Invalid NEXT_PUBLIC_APP_URL')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const callbackUrl = `${sanitizedAppUrl}/payment/callback?type=gift_card&gift_card_id=${encodeURIComponent(giftCard.id)}`

    // Generate unique payment reference
    const paymentReference = `GC_${giftCardCode}_${Date.now()}`

    const paystackResponse = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          reference: paymentReference,
          callback_url: callbackUrl,
          metadata: {
            type: 'gift_card_purchase',
            gift_card_id: giftCard.id,
            gift_card_code: giftCardCode,
            design_image: design_image,
            denomination: denomination,
            recipient_name: sanitizedName,
            recipient_email: sanitizedEmail,
            purchased_by: user.id,
          },
        }),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData)

      // Delete the gift card since payment initialization failed
      await supabase
        .from('gift_cards')
        .delete()
        .eq('id', giftCard.id)

      return NextResponse.json(
        { error: 'Failed to initialize payment. Please try again.' },
        { status: 500 }
      )
    }

    // Update gift card with payment reference
    await supabase
      .from('gift_cards')
      .update({
        payment_reference: paymentReference,
      })
      .eq('id', giftCard.id)

    return NextResponse.json({
      success: true,
      gift_card_id: giftCard.id,
      code: giftCardCode,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Gift card purchase error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
