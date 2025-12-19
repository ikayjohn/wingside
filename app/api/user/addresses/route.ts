import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/addresses - Fetch user's addresses
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's addresses
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/user/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const { label, street_address, city, state, postal_code, is_default } = body
    if (!label || !street_address || !city) {
      return NextResponse.json(
        { error: 'Label, street address, and city are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other default addresses
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Create new address
    const { data: address, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: label.trim(),
        street_address: street_address.trim(),
        city: city.trim(),
        state: state?.trim() || null,
        postal_code: postal_code?.trim() || null,
        country: 'Nigeria', // Default country
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating address:', error)
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}