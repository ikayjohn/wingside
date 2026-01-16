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

// GET /api/admin/customers/[id] - Get customer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const admin = createAdminClient();

    // Get customer profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get customer's addresses
    const { data: addresses } = await admin
      .from('addresses')
      .select('*')
      .eq('user_id', id)
      .order('is_default', { ascending: false, nullsFirst: false });

    // Get customer's recent orders (last 5)
    const { data: recentOrders } = await admin
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get order statistics
    const { count: totalOrders } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // Calculate total spent
    const { data: orderTotals } = await admin
      .from('orders')
      .select('total')
      .eq('user_id', id)
      .eq('status', 'completed');

    const totalSpent = orderTotals?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Get last order date
    const { data: lastOrder } = await admin
      .from('orders')
      .select('created_at')
      .eq('user_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const customerDetails = {
      ...profile,
      addresses: addresses || [],
      recent_orders: recentOrders || [],
      total_orders: totalOrders || 0,
      total_spent: totalSpent,
      last_order_date: lastOrder?.created_at,
    };

    return NextResponse.json({ customer: customerDetails });

  } catch (error: unknown) {
    console.error('Error fetching customer details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
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

  } catch (error: unknown) {
    console.error('Customer deletion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
