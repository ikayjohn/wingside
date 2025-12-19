import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/delivery-areas - Fetch all delivery areas
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: deliveryAreas, error } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching delivery areas:', error)
      return NextResponse.json(
        { error: 'Failed to fetch delivery areas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deliveryAreas })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/delivery-areas - Create new delivery area (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const { data: deliveryArea, error } = await supabase
      .from('delivery_areas')
      .insert({
        name: body.name,
        description: body.description,
        delivery_fee: body.delivery_fee,
        min_order_amount: body.min_order_amount || 0,
        estimated_time: body.estimated_time,
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery area:', error)
      return NextResponse.json(
        { error: 'Failed to create delivery area' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deliveryArea }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
