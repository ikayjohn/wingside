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

    const { denomination, design_image, recipient_name, recipient_email, payment_method } = body

    // Validate required fields
    if (!denomination || !design_image || !recipient_name || !recipient_email) {
      return NextResponse.json(
        { error: 'Missing required fields: denomination, design_image, recipient_name, recipient_email' },
        { status: 400 }
      )
    }

    // Validate payment method
    const selectedPaymentMethod = payment_method || 'paystack' // Default to Paystack
    if (selectedPaymentMethod !== 'paystack' && selectedPaymentMethod !== 'nomba') {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be "paystack" or "nomba"' },
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

    // Generate unique payment reference
    const paymentReference = `GC_${giftCardCode}_${Date.now()}`

    let authorizationUrl: string
    let accessCode: string | undefined
    let reference: string

    if (selectedPaymentMethod === 'paystack') {
      // Initialize payment with Paystack
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

      if (!paystackSecretKey) {
        console.error('PAYSTACK_SECRET_KEY not configured')
        return NextResponse.json(
          { error: 'Paystack payment gateway not configured' },
          { status: 500 }
        )
      }

      // Convert amount to kobo (Paystack expects amounts in kobo/cents)
      const amountInKobo = denomination * 100

      const callbackUrl = `${sanitizedAppUrl}/payment/callback?type=gift_card&gift_card_id=${encodeURIComponent(giftCard.id)}`

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
          { error: 'Failed to initialize Paystack payment. Please try again.' },
          { status: 500 }
        )
      }

      authorizationUrl = paystackData.data.authorization_url
      accessCode = paystackData.data.access_code
      reference = paystackData.data.reference
    } else {
      // Initialize payment with Nomba
      const nombaClientId = process.env.NOMBA_CLIENT_ID
      const nombaClientSecret = process.env.NOMBA_CLIENT_SECRET
      const nombaAccountId = process.env.NOMBA_ACCOUNT_ID

      if (!nombaClientId || !nombaClientSecret || !nombaAccountId) {
        console.error('Nomba credentials not configured')
        return NextResponse.json(
          { error: 'Nomba payment gateway not configured' },
          { status: 500 }
        )
      }

      // Get Nomba access token
      const tokenResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accountId': nombaAccountId,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: nombaClientId,
          client_secret: nombaClientSecret,
        }),
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.code !== '00' || !tokenData.data?.access_token) {
        console.error('Failed to get Nomba access token:', tokenData)

        // Delete the gift card since payment initialization failed
        await supabase
          .from('gift_cards')
          .delete()
          .eq('id', giftCard.id)

        return NextResponse.json(
          { error: 'Failed to initialize Nomba payment. Please try again.' },
          { status: 500 }
        )
      }

      const accessToken = tokenData.data.access_token

      // Create Nomba checkout
      const checkoutResponse = await fetch('https://api.nomba.com/v1/checkout/order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'accountId': nombaAccountId,
        },
        body: JSON.stringify({
          orderReference: paymentReference,
          amount: denomination,
          currency: 'NGN',
          customerEmail: user.email || sanitizedEmail,
          customization: {
            title: 'Wingside Gift Card',
            description: `${sanitizedName} - ${design_image}`,
            logo: `${sanitizedAppUrl}/logo.png`,
          },
          callbackUrl: `${sanitizedAppUrl}/payment/nomba/callback?type=gift_card&gift_card_id=${encodeURIComponent(giftCard.id)}`,
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
      })

      const checkoutData = await checkoutResponse.json()

      if (checkoutData.code !== '00' || !checkoutData.data?.checkoutLink) {
        console.error('Nomba checkout initialization error:', checkoutData)

        // Delete the gift card since payment initialization failed
        await supabase
          .from('gift_cards')
          .delete()
          .eq('id', giftCard.id)

        return NextResponse.json(
          { error: 'Failed to initialize Nomba payment. Please try again.' },
          { status: 500 }
        )
      }

      authorizationUrl = checkoutData.data.checkoutLink
      reference = checkoutData.data.orderReference
    }

    // Update gift card with payment reference and method
    await supabase
      .from('gift_cards')
      .update({
        payment_reference: paymentReference,
        payment_method: selectedPaymentMethod,
      })
      .eq('id', giftCard.id)

    return NextResponse.json({
      success: true,
      gift_card_id: giftCard.id,
      code: giftCardCode,
      authorization_url: authorizationUrl,
      access_code: accessCode,
      reference: reference,
      payment_method: selectedPaymentMethod,
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
