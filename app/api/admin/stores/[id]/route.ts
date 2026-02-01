import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromCache, memoryCache, CACHE_KEYS } from '@/lib/redis';

// PUT /api/admin/stores/[id] - Update store
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id: storeId } = await params;

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.opening_hours !== undefined) updateData.opening_hours = body.opening_hours;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
    if (body.is_headquarters !== undefined) updateData.is_headquarters = body.is_headquarters;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.review_count !== undefined) updateData.review_count = body.review_count;
    if (body.services !== undefined) updateData.services = body.services;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.maps_url !== undefined) updateData.maps_url = body.maps_url;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;

    // Update store
    const { data: store, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      return NextResponse.json(
        { error: 'Failed to update store', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Clear cache so updated data is immediately available
    console.log('🗑️ Clearing cache after store update...');
    try {
      await deleteFromCache(CACHE_KEYS.STORES);
      memoryCache.delete(CACHE_KEYS.STORES);
      console.log('✅ Cache cleared successfully');
    } catch (cacheError) {
      console.error('❌ Error clearing cache:', cacheError);
      // Continue even if cache clear fails
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/stores/[id] - Delete store
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id: storeId } = await params;

    // Delete store
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) {
      console.error('Error deleting store:', error);
      return NextResponse.json(
        { error: 'Failed to delete store', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Clear cache so deletion is immediately reflected
    try {
      await deleteFromCache(CACHE_KEYS.STORES);
      memoryCache.delete(CACHE_KEYS.STORES);
    } catch (cacheError) {
      console.error('Error clearing cache:', cacheError);
      // Continue even if cache clear fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
