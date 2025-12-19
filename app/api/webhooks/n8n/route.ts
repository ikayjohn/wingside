import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Webhook secret for validating requests from n8n
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

// Validate webhook request
function validateWebhook(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip validation if no secret configured
  
  const authHeader = request.headers.get('x-webhook-secret');
  return authHeader === WEBHOOK_SECRET;
}

// POST /api/webhooks/n8n - Receive events from n8n (e.g., sync from Embedly/in-store)
export async function POST(request: NextRequest) {
  try {
    if (!validateWebhook(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 });
    }

    const admin = createAdminClient();

    switch (event) {
      // Sync customer data from external source (e.g., in-store registration)
      case 'customer.sync': {
        const { email, full_name, phone, embedly_customer_id, embedly_wallet_id } = data;

        if (!email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if customer exists
        const { data: existing } = await admin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existing) {
          // Update existing customer
          await admin
            .from('profiles')
            .update({
              full_name: full_name || undefined,
              phone: phone || undefined,
              embedly_customer_id: embedly_customer_id || undefined,
              embedly_wallet_id: embedly_wallet_id || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          return NextResponse.json({ success: true, action: 'updated', id: existing.id });
        } else {
          // Create new customer profile (without auth user - they can claim later)
          const { data: newProfile, error } = await admin
            .from('profiles')
            .insert({
              email,
              full_name,
              phone,
              role: 'customer',
              embedly_customer_id,
              embedly_wallet_id,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating profile:', error);
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
          }

          return NextResponse.json({ success: true, action: 'created', id: newProfile.id });
        }
      }

      // Update customer wallet balance (from Embedly via n8n)
      case 'wallet.balance_update': {
        const { email, wallet_balance } = data;

        if (!email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await admin
          .from('profiles')
          .update({ wallet_balance, updated_at: new Date().toISOString() })
          .eq('email', email);

        return NextResponse.json({ success: true, action: 'balance_updated' });
      }

      // Sync order from in-store POS
      case 'order.sync': {
        const {
          customer_email,
          customer_name,
          customer_phone,
          items,
          subtotal,
          tax,
          total,
          payment_method,
          source,
        } = data;

        // Create order in database
        const { data: order, error } = await admin
          .from('orders')
          .insert({
            customer_email,
            customer_name,
            customer_phone,
            subtotal,
            tax,
            total,
            payment_method: payment_method || 'card',
            payment_status: 'paid',
            status: 'completed',
            source: source || 'in-store',
            delivery_address_text: 'In-store pickup',
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating order:', error);
          return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // Create order items
        if (items && Array.isArray(items)) {
          const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }));

          await admin.from('order_items').insert(orderItems);
        }

        return NextResponse.json({ success: true, action: 'order_created', order_id: order.id });
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
