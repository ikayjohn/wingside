import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's referral stats
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, total_referral_earnings')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get all referrals made by this user
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_email,
        status,
        reward_amount,
        created_at,
        completed_at,
        referred_user_id,
        profiles!referred_user_id (
          full_name,
          created_at
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Referrals error:', referralsError);
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    // Get user's referral rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (rewardsError) {
      console.error('Rewards error:', rewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Calculate statistics (now based on points)
    const stats = {
      totalReferrals: referrals?.length || 0,
      pendingReferrals: referrals?.filter(r => r.status === 'pending_signup' || r.status === 'signed_up').length || 0,
      completedReferrals: referrals?.filter(r => r.status === 'first_order_completed').length || 0,
      totalEarnings: rewards?.filter(r => r.status === 'credited').reduce((sum, r) => sum + (r.points || r.amount || 0), 0) || 0,
      pendingRewards: rewards?.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.points || r.amount || 0), 0) || 0,
      creditedRewards: rewards?.filter(r => r.status === 'credited').reduce((sum, r) => sum + (r.points || r.amount || 0), 0) || 0
    };

    return NextResponse.json({
      referralCode: userProfile?.referral_code,
      stats,
      referrals: referrals || [],
      rewards: rewards || []
    });

  } catch (error) {
    console.error('My referrals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}