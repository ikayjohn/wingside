import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  deleteFromCache,
  CACHE_KEYS,
  memoryCache
} from '@/lib/redis'

// PUT /api/delivery-areas/[id] - Update delivery area (admin only)
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    console.log('📝 Updating delivery area:', { id, body })

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    const { data: deliveryArea, error } = await admin
      .from('delivery_areas')
      .update({
        name: body.name,
        description: body.description,
        delivery_fee: body.delivery_fee,
        min_order_amount: body.min_order_amount || 0,
        estimated_time: body.estimated_time,
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating delivery area:', error)
      return NextResponse.json(
        { error: 'Failed to update delivery area' },
        { status: 500 }
      )
    }

    console.log('✅ Delivery area updated successfully:', deliveryArea)

    // Invalidate cache after updating delivery area
    await deleteFromCache(CACHE_KEYS.DELIVERY_AREAS)
    memoryCache.delete(CACHE_KEYS.DELIVERY_AREAS)

    return NextResponse.json({ deliveryArea })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/delivery-areas/[id] - Delete delivery area (admin only)
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    // Soft delete by setting is_active to false
    const { error } = await admin
      .from('delivery_areas')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting delivery area:', error)
      return NextResponse.json(
        { error: 'Failed to delete delivery area' },
        { status: 500 }
      )
    }

    // Invalidate cache after deleting delivery area
    await deleteFromCache(CACHE_KEYS.DELIVERY_AREAS)
    memoryCache.delete(CACHE_KEYS.DELIVERY_AREAS)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
