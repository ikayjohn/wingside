import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/promo-codes/validate - Validate promo code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { code, orderAmount } = body

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    // Validate order amount with proper bounds and decimal handling
    const MAX_ORDER_AMOUNT = 10000000; // ₦10,000,000 max
    const numericAmount = Number(orderAmount);

    if (!orderAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    if (numericAmount > MAX_ORDER_AMOUNT) {
      return NextResponse.json(
        { error: `Order amount exceeds maximum allowed (₦${MAX_ORDER_AMOUNT.toLocaleString()})` },
        { status: 400 }
      )
    }

    // Round to 2 decimal places to prevent float precision issues
    const sanitizedAmount = Math.round(numericAmount * 100) / 100;

    // Fetch promo code
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !promoCode) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
    }

    // Check if promo code is valid (date range)
    const now = new Date()
    const validFrom = promoCode.valid_from ? new Date(promoCode.valid_from) : null
    const validUntil = promoCode.valid_until ? new Date(promoCode.valid_until) : null

    if (validFrom && now < validFrom) {
      return NextResponse.json({ error: 'Promo code not yet valid' }, { status: 400 })
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 })
    }

    // Check usage limit
    if (promoCode.usage_limit && promoCode.used_count >= promoCode.usage_limit) {
      return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 })
    }

    // Check minimum order amount
    if (sanitizedAmount < promoCode.min_order_amount) {
      return NextResponse.json(
        {
          error: `Minimum order amount is ₦${promoCode.min_order_amount.toLocaleString()}`,
        },
        { status: 400 }
      )
    }

    // Calculate discount with proper decimal handling
    let discountAmount = 0

    if (promoCode.discount_type === 'percentage') {
      discountAmount = Math.round((sanitizedAmount * promoCode.discount_value) / 100 * 100) / 100

      // Apply max discount cap if set
      if (promoCode.max_discount_amount && discountAmount > promoCode.max_discount_amount) {
        discountAmount = promoCode.max_discount_amount
      }
    } else {
      // Fixed discount
      discountAmount = promoCode.discount_value
    }

    // Don't allow discount to exceed order amount
    if (discountAmount > sanitizedAmount) {
      discountAmount = sanitizedAmount
    }

    // Round final discount to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discount_type,
        discountValue: promoCode.discount_value,
      },
      discountAmount,
      message: `Promo code applied! You saved ₦${discountAmount.toLocaleString()}`,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
