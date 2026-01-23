import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/wingpost-locations/[id] - Update location (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    console.log('PATCH request for location ID:', id);
    console.log('Request body:', body);

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

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (badge !== undefined) updateData.badge = badge?.trim() || null;
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (rating !== undefined) updateData.rating = isNaN(rating) ? 0 : rating;
    if (reviews !== undefined) updateData.reviews = isNaN(reviews) ? 0 : reviews;
    if (distance !== undefined) updateData.distance = distance?.trim() || null;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail?.trim() || null;
    if (image !== undefined) updateData.image = image?.trim() || null;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (hours !== undefined) updateData.hours = hours.trim();
    if (maps_url !== undefined) updateData.maps_url = maps_url?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update location
    const admin = createAdminClient();
    const { data: location, error } = await admin
      .from('wingpost_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wingpost location:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message || 'Failed to update location' },
        { status: 500 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ location, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update wingpost location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/wingpost-locations/[id] - Delete location (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Delete location
    const admin = createAdminClient();
    const { error } = await admin
      .from('wingpost_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wingpost location:', error);
      return NextResponse.json(
        { error: 'Failed to delete location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete wingpost location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
