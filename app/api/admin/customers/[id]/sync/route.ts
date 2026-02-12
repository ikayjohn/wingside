import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, hasPermission, UserRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncNewCustomer, getIntegrationStatus } from '@/lib/integrations';

async function requireCustomersAccess() {
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

  const userRole = (profile?.role || 'customer') as UserRole

  if (!canAccessAdmin(userRole)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  if (!hasPermission(userRole, 'customers', 'view')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return {};
}

// POST /api/admin/customers/[id]/sync - Manually sync customer to integrations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireCustomersAccess();
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

    // Check integration status
    const status = getIntegrationStatus();
    if (!status.zoho && !status.embedly) {
      return NextResponse.json(
        { error: 'No integrations configured. Add ZOHO_* or EMBEDLY_* env vars.' },
        { status: 400 }
      );
    }

    // Get default address if available
    const { data: address, error: addressError } = await admin
      .from('addresses')
      .select('street_address, city, state')
      .eq('user_id', id)
      .eq('is_default', true)
      .single();

    // No default address is OK (PGRST116), other errors should be logged
    if (addressError && addressError.code !== 'PGRST116') {
      console.error('Error fetching default address:', addressError);
    }

    // Sync to integrations
    const result = await syncNewCustomer({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || '',
      phone: profile.phone,
      address: address?.street_address,
      city: address?.city,
      state: address?.state,
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Customer synced successfully',
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed to sync customer' }, { status: 500 });
  }
}

// GET /api/admin/customers/[id]/sync - Get integration status for customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireCustomersAccess();
    if (error) return error;

    const { id } = await params;
    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('zoho_contact_id, embedly_customer_id, embedly_wallet_id, wallet_balance')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const status = getIntegrationStatus();

    return NextResponse.json({
      integrations: status,
      customer: {
        zoho_contact_id: profile?.zoho_contact_id,
        embedly_customer_id: profile?.embedly_customer_id,
        embedly_wallet_id: profile?.embedly_wallet_id,
        wallet_balance: profile?.wallet_balance,
      },
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
