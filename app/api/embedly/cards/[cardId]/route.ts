import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

interface RouteContext {
  params: Promise<{ cardId: string }>
}

// GET /api/embedly/cards/[cardId] - Get card details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { cardId } = await context.params

    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this card
    const cards = await embedlyClient.getCards(user.id)
    const cardExists = cards.find(c => c.id === cardId || c.cardId === cardId)

    if (!cardExists) {
      return NextResponse.json(
        { error: 'Card not found or access denied' },
        { status: 404 }
      )
    }

    // Get card details
    const card = await embedlyClient.getCardDetails(cardId)

    return NextResponse.json({
      success: true,
      card
    })
  } catch (error) {
    console.error('Error fetching card details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    )
  }
}

// POST /api/embedly/cards/[cardId] - Block, unblock, freeze, unfreeze card
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { cardId } = await context.params
    const body = await request.json()
    const { action } = body

    if (!action || !['block', 'unblock', 'freeze', 'unfreeze'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this card
    const { data: profile } = await supabase
      .from('profiles')
      .select('embedly_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.embedly_customer_id) {
      return NextResponse.json(
        { error: 'Embedly customer not found' },
        { status: 404 }
      )
    }

    const cards = await embedlyClient.getCards(profile.embedly_customer_id)
    const cardExists = cards.find(c => c.id === cardId || c.cardId === cardId)

    if (!cardExists) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Perform action
    switch (action) {
      case 'block':
        await embedlyClient.blockCard(cardId)
        break
      case 'unblock':
        await embedlyClient.unblockCard(cardId)
        break
      case 'freeze':
        await embedlyClient.freezeCard(cardId)
        break
      case 'unfreeze':
        await embedlyClient.unfreezeCard(cardId)
        break
    }

    return NextResponse.json({
      success: true,
      message: `Card ${action}ed successfully`
    })
  } catch (error) {
    console.error('Error performing card action:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 500 }
    )
  }
}
