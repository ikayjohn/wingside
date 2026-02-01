import { NextRequest, NextResponse } from 'next/server';
import { notifyCustomerCreated } from '@/lib/webhooks/n8n';

// POST /api/webhooks/notify - Trigger webhook notifications from client
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
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 });
    }

    switch (event) {
      case 'customer.created': {
        await notifyCustomerCreated({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Notify webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
