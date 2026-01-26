import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { creditWallet } from '@/lib/wallet/helper';

// POST /api/points/convert - Convert points to wallet cash
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { points } = await request.json();

    // Validate input
    if (!points || points < 100) {
      return NextResponse.json(
        { error: 'Minimum 100 points required' },
        { status: 400 }
      );
    }

    // Get user's current points
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    if (!profile || profile.total_points < points) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      );
    }

    // Convert points to cash (1 point = ₦10)
    const cashAmount = points * 10;

    // Deduct points from profile
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({
        total_points: profile.total_points - points
      })
      .eq('id', user.id);

    if (pointsError) {
      console.error('Error deducting points:', pointsError);
      return NextResponse.json(
        { error: 'Failed to deduct points' },
        { status: 500 }
      );
    }

    // Credit wallet
    const walletResult = await creditWallet(
      user.id,
      cashAmount,
      'points_conversion',
      `Converted ${points} points to cash`,
      {
        metadata: { points_converted: points }
      }
    );

    if (!walletResult.success) {
      // Rollback points deduction
      await supabase
        .from('profiles')
        .update({
          total_points: profile.total_points
        })
        .eq('id', user.id);

      return NextResponse.json(
        { error: walletResult.error || 'Failed to credit wallet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      points_converted: points,
      cash_amount: cashAmount,
      new_balance: walletResult.newBalance
    });

  } catch (error) {
    console.error('Points conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
