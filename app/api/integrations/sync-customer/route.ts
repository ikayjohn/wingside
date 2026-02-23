import { NextRequest, NextResponse } from 'next/server';
import { syncNewCustomer } from '@/lib/integrations';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';

// POST /api/integrations/sync-customer - Sync new customer to Zoho CRM and Embedly
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    const { id, email, full_name, phone, address, city, state, dateOfBirth } = body;

    if (!id || !email || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, full_name' },
        { status: 400 }
      );
    }

    // Customers can only sync themselves; admins/staff can sync any customer
    if (user.id !== id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!hasPermission(profile?.role, 'customers', 'edit')) {
        return NextResponse.json(
          { error: 'Forbidden - can only sync your own account' },
          { status: 403 }
        );
      }
    }

    const result = await syncNewCustomer({
      id,
      email,
      full_name,
      phone,
      dateOfBirth,
      address,
      city,
      state,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Customer sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync customer' },
      { status: 500 }
    );
  }
}
