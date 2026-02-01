import { NextRequest, NextResponse } from 'next/server';
import { syncNewCustomer } from '@/lib/integrations';

// POST /api/integrations/sync-customer - Sync new customer to Zoho CRM and Embedly
export async function POST(request: NextRequest) {
  try {
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
    const { id, email, full_name, phone, address, city, state } = body;

    if (!id || !email || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, full_name' },
        { status: 400 }
      );
    }

    const result = await syncNewCustomer({
      id,
      email,
      full_name,
      phone,
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
