import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CacheInvalidation, deleteCachePattern } from '@/lib/redis';
import { csrfProtection } from '@/lib/csrf';

// PATCH /api/admin/flavors/[id] - Update flavor (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF protection for state-changing operations
  const csrfError = await csrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
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

    // Validate category if provided
    if (category) {
      const validCategories = ['HOT', 'BBQ', 'DRY RUB', 'BOLD & FUN', 'SWEET', 'BOOZY'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (image_url !== undefined) updateData.image_url = image_url?.trim() || null;
    if (spice_level !== undefined) updateData.spice_level = spice_level;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    // Update flavor
    const admin = createAdminClient();
    const { data: flavor, error } = await admin
      .from('flavors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating flavor:', error);
      return NextResponse.json(
        { error: 'Failed to update flavor' },
        { status: 500 }
      );
    }

    if (!flavor) {
      return NextResponse.json(
        { error: 'Flavor not found' },
        { status: 404 }
      );
    }

    // Invalidate all flavor-related caches
    await CacheInvalidation.flavors()

    return NextResponse.json({ flavor, message: 'Flavor updated successfully' });
  } catch (error) {
    console.error('Update flavor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/flavors/[id] - Delete flavor (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF protection for state-changing operations
  const csrfError = await csrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
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

    // Check if flavor is being used by any products
    const admin = createAdminClient();
    const { data: products } = await admin
      .from('product_flavors')
      .select('product_id')
      .eq('flavor_id', id)
      .limit(1);

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete flavor that is in use by products. Deactivate it instead.' },
        { status: 400 }
      );
    }

    // Delete flavor
    const { error } = await admin
      .from('flavors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flavor:', error);
      return NextResponse.json(
        { error: 'Failed to delete flavor' },
        { status: 500 }
      );
    }

    // Invalidate all flavor-related caches
    await CacheInvalidation.flavors()

    return NextResponse.json({ success: true, message: 'Flavor deleted successfully' });
  } catch (error) {
    console.error('Delete flavor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
