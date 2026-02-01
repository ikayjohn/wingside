import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/orders/track/[token] - Track order by secure token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: 'Invalid tracking token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch order by tracking token
    // No authentication required - token is the proof of ownership
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address_text,
        status,
        payment_status,
        payment_method,
        subtotal,
        delivery_fee,
        tax,
        discount_amount,
        total,
        notes,
        created_at,
        paid_at,
        estimated_delivery_time,
        actual_delivery_time,
        items:order_items(
          id,
          product_name,
          flavor_name,
          size,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('tracking_token', token)
      .single();

    if (error || !order) {
      console.error('Order lookup error:', error);
      return NextResponse.json(
        { error: 'Order not found. Please check your tracking link.' },
        { status: 404 }
      );
    }

    // Return order details with tracking information
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        // Add user-friendly status messages
        statusMessage: getStatusMessage(order.status, order.payment_status),
        canCancel: order.status === 'pending' && order.payment_status !== 'paid',
        canReorder: order.status === 'completed' || order.status === 'delivered',
      }
    });

  } catch (error) {
    console.error('Tracking endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

// Helper function to generate user-friendly status messages
function getStatusMessage(status: string, paymentStatus: string): string {
  if (paymentStatus === 'pending') {
    return 'Waiting for payment confirmation';
  }

  switch (status) {
    case 'pending':
      return 'Order received and being prepared';
    case 'confirmed':
      return 'Order confirmed and in preparation';
    case 'preparing':
      return 'Your delicious wings are being prepared';
    case 'ready':
      return 'Order ready for pickup/delivery';
    case 'out_for_delivery':
      return 'Out for delivery - arriving soon!';
    case 'delivered':
      return 'Order delivered - enjoy your meal!';
    case 'completed':
      return 'Order completed';
    case 'cancelled':
      return 'Order cancelled';
    case 'failed':
      return 'Order failed - please contact support';
    default:
      return 'Processing your order';
  }
}
