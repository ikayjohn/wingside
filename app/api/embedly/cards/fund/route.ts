import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/cards/fund - Fund a card from wallet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cardId, amount, narration } = body

    if (!cardId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Card ID and amount are required' },
        { status: 400 }
      )
    }

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.embedly_customer_id || !profile?.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'Embedly customer or wallet not found' },
        { status: 404 }
      )
    }

    // Verify user owns this card
    const cards = await embedlyClient.getCards(profile.embedly_customer_id)
    const card = cards.find(c => c.id === cardId || c.cardId === cardId)

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Fund card via Embedly
    await embedlyClient.fundCard({
      cardId,
      amount,
      narration
    })

    return NextResponse.json({
      success: true,
      message: `Card funded with ₦${amount.toLocaleString()}`
    })
  } catch (error) {
    console.error('Error funding card:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fund card' },
      { status: 500 }
    )
  }
}
