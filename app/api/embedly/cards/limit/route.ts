import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/cards/limit - Update card spending limits
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
    const { cardId, dailyLimit, monthlyLimit } = body

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      )
    }

    if (dailyLimit !== undefined && dailyLimit <= 0) {
      return NextResponse.json(
        { error: 'Daily limit must be greater than 0' },
        { status: 400 }
      )
    }

    if (monthlyLimit !== undefined && monthlyLimit <= 0) {
      return NextResponse.json(
        { error: 'Monthly limit must be greater than 0' },
        { status: 400 }
      )
    }

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.embedly_customer_id) {
      return NextResponse.json(
        { error: 'Embedly customer not found' },
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

    // Update card limits via Embedly
    await embedlyClient.updateCardLimit({
      cardId,
      dailyLimit,
      monthlyLimit
    })

    return NextResponse.json({
      success: true,
      message: 'Card limits updated successfully'
    })
  } catch (error) {
    console.error('Error updating card limits:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update card limits' },
      { status: 500 }
    )
  }
}
