import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/wingpost-locations - Fetch all locations (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Build query
    let query = createAdminClient()
      .from('wingpost_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: locations, error } = await query;

    if (error) {
      console.error('Error fetching wingpost locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ locations: locations || [] });
  } catch (error) {
    console.error('Get wingpost locations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/wingpost-locations - Create new location (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
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
    const {
      name,
      badge,
      address,
      city,
      rating,
      reviews,
      distance,
      thumbnail,
      image,
      phone,
      hours,
      maps_url,
      is_active
    } = body;

    // Validate required fields
    if (!name || !address || !city || !phone || !hours) {
      return NextResponse.json(
        { error: 'Name, address, city, phone, and hours are required' },
        { status: 400 }
      );
    }

    // Create location
    const admin = createAdminClient();
    const { data: location, error } = await admin
      .from('wingpost_locations')
      .insert({
        name: name.trim(),
        badge: badge?.trim() || null,
        address: address.trim(),
        city: city.trim(),
        rating: (rating && !isNaN(rating)) ? rating : 4.9,
        reviews: (reviews && !isNaN(reviews)) ? reviews : 0,
        distance: distance?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        image: image?.trim() || null,
        phone: phone.trim(),
        hours: hours.trim(),
        maps_url: maps_url?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wingpost location:', error);
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ location, message: 'Location created successfully' });
  } catch (error) {
    console.error('Create wingpost location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
