import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromCache, memoryCache, CACHE_KEYS } from '@/lib/redis';

// GET /api/admin/stores - Get all stores (including inactive) for admin
export async function GET() {
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

    // Get all stores (active and inactive) ordered by display_order
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stores', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ stores: stores || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/stores - Create new store
export async function POST(request: Request) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.address || !body.city || !body.state) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, city, state' },
        { status: 400 }
      );
    }

    // Insert new store
    const { data: store, error } = await supabase
      .from('stores')
      .insert([{
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        phone: body.phone || '',
        email: body.email || '',
        opening_hours: body.opening_hours || '',
        image_url: body.image_url || '',
        thumbnail_url: body.thumbnail_url || '',
        is_headquarters: body.is_headquarters || false,
        rating: body.rating || 0,
        review_count: body.review_count || 0,
        services: body.services || [],
        features: body.features || [],
        maps_url: body.maps_url || '',
        is_active: body.is_active !== undefined ? body.is_active : true,
        display_order: body.display_order || 0,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      return NextResponse.json(
        { error: 'Failed to create store', details: error.message },
        { status: 500 }
      );
    }

    // Clear cache so new store is immediately available
    try {
      await deleteFromCache(CACHE_KEYS.STORES);
      memoryCache.delete(CACHE_KEYS.STORES);
    } catch (cacheError) {
      console.error('Error clearing cache:', cacheError);
      // Continue even if cache clear fails
    }

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
