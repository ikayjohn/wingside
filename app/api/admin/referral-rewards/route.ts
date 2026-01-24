import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/referral-rewards - Fetch all referral rewards (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = adminSupabase
      .from('referral_rewards')
      .select(`
        *,
        user:profiles!user_id(id, email, full_name),
        referral:referrals!referral_id(
          id,
          referrer_id,
          referred_email,
          status,
          referrer:profiles!referrer_id(email, full_name)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Error fetching referral rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referral rewards', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = adminSupabase
      .from('referral_rewards')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    // Calculate summary stats
    const stats = {
      total: count || 0,
      pending: 0,
      credited: 0,
      failed: 0,
      totalAmount: 0,
      pendingAmount: 0,
      creditedAmount: 0
    };

    // Get stats for all rewards (not just current page)
    const { data: allRewards } = await adminSupabase
      .from('referral_rewards')
      .select('status, points, amount');

    if (allRewards) {
      allRewards.forEach(reward => {
        const rewardValue = reward.points || reward.amount || 0;
        stats.totalAmount += rewardValue;

        if (reward.status === 'pending') {
          stats.pending++;
          stats.pendingAmount += rewardValue;
        } else if (reward.status === 'credited') {
          stats.credited++;
          stats.creditedAmount += rewardValue;
        } else if (reward.status === 'failed') {
          stats.failed++;
        }
      });
    }

    return NextResponse.json({
      rewards: rewards || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      },
      stats
    });

  } catch (error: unknown) {
    console.error('Get referral rewards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
