import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { csrfProtection } from '@/lib/csrf';

// POST /api/rewards/award - Award purchase-based points to user
// Only handles 'purchase' reward type. For one-time rewards, use /api/rewards/claim instead.
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    const supabase = await createClient();
    const body = await request.json();
    const { rewardType, orderId, description, metadata } = body;

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow 'purchase' reward type through this endpoint
    // All other reward types must go through /api/rewards/claim (server-enforced points)
    if (rewardType !== 'purchase') {
      return NextResponse.json(
        { error: 'This endpoint only supports purchase rewards. Use /api/rewards/claim for other reward types.' },
        { status: 400 }
      );
    }

    // Require orderId — we validate the amount from the database, never from the client
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required for purchase rewards' },
        { status: 400 }
      );
    }

    // Look up the actual order total from the database (never trust client amountSpent)
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, total_amount, user_id, payment_status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Only award points for paid orders
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Points can only be awarded for paid orders' },
        { status: 400 }
      );
    }

    // Check if points were already awarded for this order
    const { data: existingReward } = await admin
      .from('rewards')
      .select('id')
      .eq('user_id', user.id)
      .eq('reward_type', 'purchase')
      .eq('metadata->>order_id', orderId)
      .maybeSingle();

    if (existingReward) {
      return NextResponse.json(
        { error: 'Points already awarded for this order' },
        { status: 409 }
      );
    }

    const amountSpent = Number(order.total_amount);

    // Server-enforced points calculation: 1 point per ₦100 spent
    const enforced_points = Math.floor(amountSpent / 100);

    if (enforced_points <= 0) {
      return NextResponse.json(
        { error: 'Order amount too low to earn points (minimum ₦100)' },
        { status: 400 }
      );
    }

    // Call the award_points function with server-calculated points
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_reward_type: 'purchase',
      p_points: enforced_points,
      p_amount_spent: amountSpent,
      p_description: description || `Earned ${enforced_points} points from ₦${amountSpent.toLocaleString()} purchase`,
      p_metadata: { ...(metadata || {}), order_id: orderId }
    });

    if (error) {
      console.error('Error awarding points:', error);
      return NextResponse.json(
        { error: 'Failed to award points' },
        { status: 500 }
      );
    }

    // Fetch updated profile to get new points total
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      rewardId: data,
      pointsAwarded: enforced_points,
      newPointsTotal: profile?.total_points || 0
    });
  } catch (error) {
    console.error('Award points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
