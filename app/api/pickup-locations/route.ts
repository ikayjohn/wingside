import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/pickup-locations - Fetch all active pickup locations (public)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: pickupLocations, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching pickup locations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pickup locations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pickupLocations })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/pickup-locations - Create new pickup location (admin only)
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

    const admin = createAdminClient()
    const body = await request.json()

    const { data: pickupLocation, error } = await admin
      .from('pickup_locations')
      .insert({
        name: body.name,
        address: body.address,
        city: body.city || 'Port Harcourt',
        state: body.state || 'Rivers',
        phone: body.phone || null,
        opening_hours: body.opening_hours || null,
        estimated_time: body.estimated_time || '15-20 mins',
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pickup location:', error)
      return NextResponse.json(
        { error: 'Failed to create pickup location' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pickupLocation }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
