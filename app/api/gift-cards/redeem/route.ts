import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { csrfProtection } from '@/lib/csrf'

// POST /api/gift-cards/redeem - Redeem gift card for an order
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

    const { code, amount, order_id } = body

    // Validate required fields
    if (!code || !amount || !order_id) {
      return NextResponse.json(
        { error: 'Missing required fields: code, amount, order_id' },
        { status: 400 }
      )
    }

    // Validate code format (12 alphanumeric characters)
    const codeStr = String(code).trim().toUpperCase()
    if (!/^[A-Z0-9]{12}$/.test(codeStr)) {
      return NextResponse.json(
        { error: 'Invalid gift card code format' },
        { status: 400 }
      )
    }

    // Validate amount
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Call database function to redeem gift card
    const { data, error: redeemError } = await supabase.rpc('redeem_gift_card_by_code', {
      p_code: codeStr,
      p_amount: numericAmount,
      p_order_id: order_id,
      p_user_id: user.id,
    })

    if (redeemError) {
      console.error('Redemption function error:', redeemError)
      return NextResponse.json(
        { error: 'Failed to redeem gift card. Please try again.' },
        { status: 500 }
      )
    }

    // Database function returns array with single result
    const result = Array.isArray(data) ? data[0] : data

    if (!result || !result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result?.message || 'Gift card redemption failed'
        },
        { status: 400 }
      )
    }

    // Update order with gift card information
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        gift_card_id: result.gift_card_id,
        gift_card_amount: numericAmount,
      })
      .eq('id', order_id)

    if (orderUpdateError) {
      console.error('Error updating order with gift card:', orderUpdateError)
      // Don't fail the request - the gift card was already redeemed
      // This update is for tracking purposes only
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gift_card_id: result.gift_card_id,
      remaining_balance: result.remaining_balance,
      amount_redeemed: numericAmount,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Gift card redemption error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
