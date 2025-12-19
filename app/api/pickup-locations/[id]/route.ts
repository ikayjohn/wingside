import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return {}
}

// GET /api/pickup-locations/[id] - Get single pickup location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: pickupLocation, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Pickup location not found' }, { status: 404 })
    }

    return NextResponse.json({ pickupLocation })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/pickup-locations/[id] - Update pickup location (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()

    const { data: pickupLocation, error } = await admin
      .from('pickup_locations')
      .update({
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        phone: body.phone,
        opening_hours: body.opening_hours,
        estimated_time: body.estimated_time,
        is_active: body.is_active,
        display_order: body.display_order,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating pickup location:', error)
      return NextResponse.json({ error: 'Failed to update pickup location' }, { status: 500 })
    }

    return NextResponse.json({ pickupLocation })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/pickup-locations/[id] - Delete pickup location (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const admin = createAdminClient()

    const { error } = await admin
      .from('pickup_locations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting pickup location:', error)
      return NextResponse.json({ error: 'Failed to delete pickup location' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
