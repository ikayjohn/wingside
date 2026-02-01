import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAddressInput, sanitizeString, isValidUUID } from '@/lib/validation'

// PUT /api/user/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid address ID format' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input (if fields are being updated)
    if (body.label || body.street_address || body.city) {
      const validation = validateAddressInput(body);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors
          },
          { status: 400 }
        );
      }
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

    // Sanitize string inputs
    const sanitizedData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.label) sanitizedData.label = sanitizeString(body.label);
    if (body.street_address) sanitizedData.street_address = sanitizeString(body.street_address);
    if (body.city) sanitizedData.city = sanitizeString(body.city);
    if (body.state) sanitizedData.state = sanitizeString(body.state);
    if (body.postal_code) sanitizedData.postal_code = sanitizeString(body.postal_code);
    if (body.is_default !== undefined) sanitizedData.is_default = body.is_default;

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
      .update(sanitizedData)
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

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid address ID format' },
        { status: 400 }
      );
    }

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