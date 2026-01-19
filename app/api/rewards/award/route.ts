import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/rewards/award - Award points to user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { rewardType, points, amountSpent, description, metadata } = body;

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the award_points function
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_reward_type: rewardType,
      p_points: points,
      p_amount_spent: amountSpent || 0,
      p_description: description,
      p_metadata: metadata || {}
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
