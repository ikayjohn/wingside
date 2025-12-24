import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/rewards/claim - Claim a one-time reward
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { rewardType, points, description, metadata } = body;

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate reward type
    const validRewardTypes = ['first_order', 'instagram_follow', 'twitter_follow', 'review', 'birthday'];
    if (!validRewardTypes.includes(rewardType)) {
      return NextResponse.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_type', rewardType)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Reward already claimed', alreadyClaimed: true },
        { status: 400 }
      );
    }

    // Call the claim_reward function
    const { data, error } = await supabase.rpc('claim_reward', {
      p_user_id: user.id,
      p_reward_type: rewardType,
      p_points: points,
      p_description: description,
      p_metadata: metadata || {}
    });

    if (error) {
      console.error('Error claiming reward:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to claim reward' },
        { status: 500 }
      );
    }

    // Fetch updated profile to get new points total
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      rewardId: data,
      newPointsTotal: profile?.points || 0,
      message: `You've earned ${points} points!`
    });
  } catch (error) {
    console.error('Claim reward error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/rewards/claim - Check reward claim status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const rewardType = searchParams.get('type');

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!rewardType) {
      return NextResponse.json(
        { error: 'Reward type is required' },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: claim } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_type', rewardType)
      .maybeSingle();

    return NextResponse.json({
      claimed: !!claim,
      claimDate: claim?.created_at
    });
  } catch (error) {
    console.error('Check claim status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
