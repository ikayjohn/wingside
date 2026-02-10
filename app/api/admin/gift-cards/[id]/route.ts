import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { csrfProtection } from '@/lib/csrf'

// GET /api/admin/gift-cards/[id] - Get single gift card with transaction history (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Fetch gift card details
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (giftCardError || !giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Fetch transaction history
    const { data: transactions, error: transactionsError } = await supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('gift_card_id', id)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      )
    }

    // Fetch purchaser details if available
    let purchaser = null
    if (giftCard.purchased_by) {
      const { data: purchaserProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', giftCard.purchased_by)
        .single()

      purchaser = purchaserProfile
    }

    return NextResponse.json({
      gift_card: giftCard,
      transactions: transactions || [],
      purchaser,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Admin gift card detail fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/gift-cards/[id] - Update gift card (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    const supabase = await createClient()

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
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

    const { is_active, balance_adjustment, adjustment_reason } = body

    // Get current gift card state
    const { data: currentGiftCard, error: fetchError } = await supabase
      .from('gift_cards')
      .select('current_balance, is_active')
      .eq('id', id)
      .single()

    if (fetchError || !currentGiftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    const updates: Record<string, any> = {}

    // Update active status if provided
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    // Handle balance adjustment if provided
    if (balance_adjustment && typeof balance_adjustment === 'number') {
      const newBalance = Number(currentGiftCard.current_balance) + balance_adjustment

      if (newBalance < 0) {
        return NextResponse.json(
          { error: 'Balance adjustment would result in negative balance' },
          { status: 400 }
        )
      }

      updates.current_balance = newBalance

      // Record transaction for balance adjustment
      await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: id,
          transaction_type: 'adjustment',
          amount: balance_adjustment,
          description: adjustment_reason || 'Admin balance adjustment',
          user_id: user.id,
          balance_after: newBalance,
        })
    }

    // Update gift card
    const { data: updatedGiftCard, error: updateError } = await supabase
      .from('gift_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating gift card:', updateError)
      return NextResponse.json(
        { error: 'Failed to update gift card' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      gift_card: updatedGiftCard,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Admin gift card update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
