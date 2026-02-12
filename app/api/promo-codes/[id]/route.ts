import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions'

// PUT /api/promo-codes/[id] - Update promo code (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .update({
        code: body.code.toUpperCase(),
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_order_amount: body.min_order_amount || 0,
        max_discount_amount: body.max_discount_amount || null,
        usage_limit: body.usage_limit || null,
        valid_from: body.valid_from,
        valid_until: body.valid_until || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating promo code:', error)
      return NextResponse.json(
        { error: 'Failed to update promo code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ promoCode })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/promo-codes/[id] - Increment promo code usage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // If increment_usage flag is set, increment the used_count
    if (body.increment_usage) {
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .update({ used_count: (await supabase.from('promo_codes').select('used_count').eq('id', id).single()).data?.used_count + 1 || 1 })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error incrementing promo code usage:', error)
        return NextResponse.json(
          { error: 'Failed to update promo code usage' },
          { status: 500 }
        )
      }

      return NextResponse.json({ promoCode })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/promo-codes/[id] - Delete promo code (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const userRole = (profile?.role || 'customer') as UserRole

    if (!canAccessAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting promo code:', error)
      return NextResponse.json(
        { error: 'Failed to delete promo code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
