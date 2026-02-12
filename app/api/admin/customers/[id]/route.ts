import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import embedlyClient from '@/lib/embedly/client';

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
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

    // Fetch referrer name if referred_by exists
    let referrerName = null;
    if (profile.referred_by) {
      const { data: referrer, error: referrerError } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', profile.referred_by)
        .single();

      if (referrerError) {
        console.error('Error fetching referrer:', referrerError);
      }

      if (referrer) {
        referrerName = referrer.full_name || referrer.email;
      }
    }

    // Fetch wallet details from Embedly if wallet exists
    let embedlyWalletDetails = null;
    if (profile.embedly_wallet_id) {
      try {
        const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        embedlyWalletDetails = {
          accountNumber: wallet.virtualAccount?.accountNumber || wallet.mobNum || 'N/A',
          bankName: wallet.virtualAccount?.bankName || 'N/A',
          availableBalance: wallet.availableBalance || 0,
          ledgerBalance: wallet.ledgerBalance || 0,
          currencyId: wallet.currencyId,
          walletName: wallet.name,
        };
      } catch (error) {
        console.error('Error fetching Embedly wallet:', error);
        // Don't fail the request if wallet fetch fails
      }
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

    // Calculate total spent (include all orders except cancelled)
    const { data: orderTotals } = await admin
      .from('orders')
      .select('total, status')
      .eq('user_id', id)
      .neq('status', 'cancelled');

    const totalSpent = orderTotals?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Get last order date (most recent non-cancelled order)
    const { data: lastOrder, error: lastOrderError } = await admin
      .from('orders')
      .select('created_at')
      .eq('user_id', id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // No orders is OK (PGRST116), other errors should be logged
    if (lastOrderError && lastOrderError.code !== 'PGRST116') {
      console.error('Error fetching last order:', lastOrderError);
    }

    // Get last visit date (most recent order of any status)
    const { data: lastVisit, error: lastVisitError } = await admin
      .from('orders')
      .select('created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // No orders is OK (PGRST116), other errors should be logged
    if (lastVisitError && lastVisitError.code !== 'PGRST116') {
      console.error('Error fetching last visit:', lastVisitError);
    }

    const customerDetails = {
      ...profile,
      referrer_name: referrerName,
      embedly_wallet_details: embedlyWalletDetails,
      addresses: addresses || [],
      recent_orders: recentOrders || [],
      total_orders: totalOrders || 0,
      total_spent: totalSpent,
      last_order_date: lastOrder?.created_at,
      last_visit_date: lastVisit?.created_at,
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
