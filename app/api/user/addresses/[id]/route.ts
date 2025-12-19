import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/user/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if address belongs to user
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If setting as default, unset other default addresses
    if (body.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id)
    }

    // Update address
    const { data: address, error } = await supabase
      .from('addresses')
      .update({
        label: body.label?.trim(),
        street_address: body.street_address?.trim(),
        city: body.city?.trim(),
        state: body.state?.trim() || null,
        postal_code: body.postal_code?.trim() || null,
        is_default: body.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/addresses/[id] - Delete address
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if address belongs to user
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('user_id, is_default')
      .eq('id', id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    if (existingAddress.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent deletion of default address if there are other addresses
    if (existingAddress.is_default) {
      const { data: otherAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .neq('id', id)
        .limit(1)

      if (otherAddresses && otherAddresses.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete default address. Set another address as default first.' },
          { status: 400 }
        )
      }
    }

    // Delete address
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting address:', error)
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Address deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}