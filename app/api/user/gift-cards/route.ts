import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/gift-cards - Get user's gift cards
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch gift cards where user is recipient (by email) or purchaser
    const { data: giftCards, error: giftCardsError } = await supabase
      .from('gift_cards')
      .select('id, code, card_number, initial_balance, current_balance, recipient_name, recipient_email, is_active, expires_at, created_at, last_used_at, design_image, denomination, purchased_by')
      .or(`recipient_email.eq.${user.email},purchased_by.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (giftCardsError) {
      console.error('Error fetching gift cards:', giftCardsError)
      return NextResponse.json(
        { error: 'Failed to fetch gift cards' },
        { status: 500 }
      )
    }

    const now = new Date()

    // Categorize gift cards
    const active = giftCards.filter(gc =>
      gc.is_active &&
      new Date(gc.expires_at) > now &&
      gc.current_balance > 0
    )

    const used = giftCards.filter(gc =>
      gc.current_balance === 0 &&
      gc.is_active
    )

    const expired = giftCards.filter(gc =>
      new Date(gc.expires_at) <= now ||
      !gc.is_active
    )

    // Calculate total active balance
    const totalBalance = active.reduce((sum, gc) => sum + Number(gc.current_balance), 0)

    return NextResponse.json({
      gift_cards: giftCards,
      active,
      used,
      expired,
      total_balance: totalBalance,
      counts: {
        active: active.length,
        used: used.length,
        expired: expired.length,
        total: giftCards.length,
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('User gift cards fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
