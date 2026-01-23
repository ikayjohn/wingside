import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/wingpost-locations - Fetch all active locations (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query
    let query = createAdminClient()
      .from('wingpost_locations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
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
