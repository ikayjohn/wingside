import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

// GET /api/embedly/cards - List all cards for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's profile to get customerId
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

    console.log('Fetching cards for customer:', profile.embedly_customer_id);

    // Fetch cards from Embedly
    const cards = await embedlyClient.getCards(profile.embedly_customer_id)

    console.log('Cards fetched:', cards);

    return NextResponse.json({
      success: true,
      cards
    })
  } catch (error) {
    console.error('Error fetching cards:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/embedly/cards - Create a new card
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
    const { cardType, cardName } = body

    // Validate card type
    if (!cardType || !['VIRTUAL', 'PHYSICAL'].includes(cardType)) {
      return NextResponse.json(
        { error: 'Invalid card type. Must be VIRTUAL or PHYSICAL' },
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

    // Create card via Embedly
    const card = await embedlyClient.createCard({
      customerId: profile.embedly_customer_id,
      walletId: profile.embedly_wallet_id,
      cardType,
      cardName
    })

    return NextResponse.json({
      success: true,
      card
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create card' },
      { status: 500 }
    )
  }
}
