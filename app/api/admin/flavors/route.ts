import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CacheInvalidation } from '@/lib/redis';

// GET /api/admin/flavors - Fetch all flavors (admin only)
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
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') === 'true';

    // Build query
    let query = createAdminClient()
      .from('flavors')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: flavors, error } = await query;

    if (error) {
      console.error('Error fetching flavors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flavors' },
        { status: 500 }
      );
    }

    return NextResponse.json({ flavors: flavors || [] });
  } catch (error) {
    console.error('Get flavors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/flavors - Create new flavor (admin only)
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

    const body = await request.json();
    const { name, category, description, image_url, spice_level, is_active, display_order } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const validCategories = ['HOT', 'BBQ', 'DRY RUB', 'BOLD & FUN', 'SWEET', 'BOOZY'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Create flavor
    const admin = createAdminClient();
    const { data: flavor, error } = await admin
      .from('flavors')
      .insert({
        name: name.trim(),
        category,
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        spice_level: spice_level || 0,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating flavor:', error);
      return NextResponse.json(
        { error: 'Failed to create flavor' },
        { status: 500 }
      );
    }

    // Invalidate all flavor-related caches
    await CacheInvalidation.flavors()

    return NextResponse.json({ flavor, message: 'Flavor created successfully' });
  } catch (error) {
    console.error('Create flavor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
