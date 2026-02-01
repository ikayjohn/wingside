import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { userId, orderAmount, orderId } = body;

    if (!userId || !orderAmount) {
      return NextResponse.json(
        { error: 'User ID and order amount are required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Call the database function to process referral rewards
    const { data, error } = await supabase
      .rpc('process_referral_reward_after_first_order', {
        user_id: userId,
        order_amount: orderAmount
      });

    if (error) {
      console.error('Error processing referral reward:', error);
      return NextResponse.json(
        { error: 'Failed to process referral reward' },
        { status: 500 }
      );
    }

    // If reward was processed successfully, get details
    if (data) {
      // Get the processed reward details
      const { data: rewardDetails } = await supabase
        .from('referral_rewards')
        .select(`
          *,
          referrals (
            referrer_id,
            referred_email,
            referral_code_used
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(2);

      return NextResponse.json({
        success: true,
        message: 'Referral rewards processed successfully',
        rewards: rewardDetails || [],
        orderId
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No pending referral rewards found for this user'
    });

  } catch (error) {
    console.error('Process reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}