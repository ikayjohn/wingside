import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return {};
}

// DELETE /api/admin/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const admin = createAdminClient();

    // Check if customer exists
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete from auth (this will cascade to profiles if RLS is set up correctly)
    const { error: deleteError } = await admin.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('Auth deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user from auth' }, { status: 500 });
    }

    // Also explicitly delete from profiles (in case cascade doesn't work)
    const { error: profileDeleteError } = await admin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      console.error('Profile deletion error:', profileDeleteError);
      // Don't fail if profile deletion fails after auth deletion
    }

    console.log(`Deleted customer: ${profile.email} (${profile.full_name})`);

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      deletedCustomer: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
      }
    });

  } catch (error: any) {
    console.error('Customer deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
