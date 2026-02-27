import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/rewards/available - Check what rewards user can claim
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

    // Get user's profile with points, birthday, and order count
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, created_at, birthday_day, birthday_month')
      .eq('id', user.id)
      .single();

    // Get user's claimed rewards
    const { data: claimedRewards } = await supabase
      .from('reward_claims')
      .select('reward_type, claimed_at')
      .eq('user_id', user.id);

    const claimedTypes = new Set(claimedRewards?.map(r => r.reward_type) || []);

    // Get user's order count
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('payment_status', 'paid');

    const safeOrderCount = orderCount ?? 0;

    // Define available rewards
    const availableRewards = [
      {
        id: 'first_order',
        name: 'First Order Bonus',
        points: 15,
        description: 'Complete your first order to earn bonus points!',
        icon: '🎉',
        category: 'milestone',
        canClaim: safeOrderCount > 0 && !claimedTypes.has('first_order'),
        claimed: claimedTypes.has('first_order'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'first_order')?.claimed_at,
        progress: safeOrderCount > 0 ? 1 : 0,
        progressText: safeOrderCount > 0 ? '1/1 orders completed' : '0/1 orders completed',
        requirement: 'Complete your first paid order'
      },
      {
        id: 'instagram_follow',
        name: 'Instagram Follower',
        points: 30,
        description: 'Follow us on Instagram and earn points!',
        icon: '📸',
        category: 'social',
        canClaim: !claimedTypes.has('instagram_follow'),
        claimed: claimedTypes.has('instagram_follow'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'instagram_follow')?.claimed_at,
        requirement: 'Follow our Instagram account'
      },
      {
        id: 'twitter_follow',
        name: 'Twitter Follower',
        points: 25,
        description: 'Follow us on Twitter/X and earn points!',
        icon: '🐦',
        category: 'social',
        canClaim: !claimedTypes.has('twitter_follow'),
        claimed: claimedTypes.has('twitter_follow'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'twitter_follow')?.claimed_at,
        requirement: 'Follow our Twitter account'
      },
      {
        id: 'tiktok_follow',
        name: 'TikTok Follower',
        points: 30,
        description: 'Follow us on TikTok and earn points!',
        icon: '🎵',
        category: 'social',
        canClaim: !claimedTypes.has('tiktok_follow'),
        claimed: claimedTypes.has('tiktok_follow'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'tiktok_follow')?.claimed_at,
        requirement: 'Follow our TikTok account'
      },
      {
        id: 'facebook_follow',
        name: 'Facebook Follower',
        points: 25,
        description: 'Follow us on Facebook and earn points!',
        icon: '👍',
        category: 'social',
        canClaim: !claimedTypes.has('facebook_follow'),
        claimed: claimedTypes.has('facebook_follow'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'facebook_follow')?.claimed_at,
        requirement: 'Follow our Facebook page'
      },
      {
        id: 'youtube_follow',
        name: 'YouTube Subscriber',
        points: 40,
        description: 'Subscribe to our YouTube channel and earn points!',
        icon: '▶️',
        category: 'social',
        canClaim: !claimedTypes.has('youtube_follow'),
        claimed: claimedTypes.has('youtube_follow'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'youtube_follow')?.claimed_at,
        requirement: 'Subscribe to our YouTube channel'
      },
      {
        id: 'review',
        name: 'Leave a Review',
        points: 20,
        description: 'Leave a review and help others discover us!',
        icon: '⭐',
        category: 'engagement',
        canClaim: !claimedTypes.has('review'),
        claimed: claimedTypes.has('review'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'review')?.claimed_at,
        requirement: 'Leave a product or service review'
      },
      {
        id: 'birthday',
        name: 'Birthday Bonus',
        points: 100,
        description: 'Special points on your birthday!',
        icon: '🎂',
        category: 'special',
        canClaim: !claimedTypes.has('birthday') && isBirthdayToday(profile?.birthday_day, profile?.birthday_month),
        claimed: claimedTypes.has('birthday'),
        claimedAt: claimedRewards?.find(r => r.reward_type === 'birthday')?.claimed_at,
        requirement: 'Available on your birthday'
      }
    ];

    // Calculate points from purchases (₦100 = 1 point)
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .eq('user_id', user.id)
      .eq('payment_status', 'paid');

    // Calculate purchase points using per-order rounding (matches actual awarded points)
    const purchasePoints = orders?.reduce((sum, order) => sum + Math.floor(Number(order.total) / 100), 0) || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    return NextResponse.json({
      currentPoints: profile?.total_points || 0,
      purchasePoints,
      totalSpent,
      orderCount: orderCount || 0,
      availableRewards: availableRewards.filter(r => r.canClaim),
      claimedRewards: availableRewards.filter(r => r.claimed),
      allRewards: availableRewards
    });
  } catch (error) {
    console.error('Get available rewards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isBirthdayToday(birthdayDay: number | null | undefined, birthdayMonth: number | null | undefined): boolean {
  if (!birthdayDay || !birthdayMonth) return false;

  const today = new Date();
  return (
    today.getDate() === birthdayDay &&
    (today.getMonth() + 1) === birthdayMonth // getMonth() is 0-indexed, birthday_month is 1-indexed
  );
}
