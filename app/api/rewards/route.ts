import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/rewards - Get user's rewards history
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's profile with points
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, email')
      .eq('id', user.id)
      .single();

    // Fetch user's rewards history
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Fetch claimed rewards
    const { data: claimedRewards } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', user.id);

    // Calculate total spent from orders (match by email to include guest orders)
    const { data: orders } = await supabase
      .from('orders')
      .select('total, payment_status')
      .eq('customer_email', profile?.email || user.email)
      .eq('payment_status', 'paid');

    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const purchasePoints = Math.floor(totalSpent / 100);

    return NextResponse.json({
      points: profile?.total_points || 0,
      purchasePoints,
      totalSpent,
      rewards: rewards || [],
      claimedRewards: claimedRewards || []
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
