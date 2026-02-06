import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCardHistory } from '@/lib/embedly/tap-client';

/**
 * GET /api/wingside-card/history
 * Get Wingside Card transaction history
 *
 * Query params:
 * - fromDate: Start date (YYYY-MM-DD, default: 30 days ago)
 * - toDate: End date (YYYY-MM-DD, default: today)
 *
 * Security:
 * - Requires authentication
 * - Users can only view their own card history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params for date range
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = searchParams.get('toDate') ||
      new Date().toISOString().split('T')[0];

    const admin = createAdminClient();

    // Get user's card
    const { data: card, error: cardError } = await admin
      .from('wingside_cards')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cardError) {
      console.error('Error fetching card:', cardError);
      return NextResponse.json(
        { error: 'Failed to fetch card information' },
        { status: 500 }
      );
    }

    if (!card) {
      return NextResponse.json(
        { error: 'No Wingside Card found. Please link a card first.' },
        { status: 404 }
      );
    }

    // Get transaction history from Embedly TAP API
    const historyResult = await getCardHistory(card.card_serial, fromDate, toDate);

    if (!historyResult.success) {
      console.error('Failed to fetch card history:', historyResult.error);

      // Fallback: Get wallet transactions for the date range
      const { data: walletTxs } = await admin
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        card_serial: card.card_serial,
        transactions: walletTxs || [],
        total_count: walletTxs?.length || 0,
        from_date: fromDate,
        to_date: toDate,
        source: 'wallet_fallback'
      });
    }

    // Embedly TAP API returns: { transactions: [...], totalCount: number }
    const transactions = historyResult.data?.transactions || [];

    return NextResponse.json({
      card_serial: card.card_serial,
      transactions,
      total_count: historyResult.data?.totalCount || 0,
      from_date: fromDate,
      to_date: toDate,
      source: 'embedly',
      card_info: {
        status: card.status,
        last_used_at: card.last_used_at,
        total_transactions: card.total_transactions,
        total_spent: card.total_spent
      }
    });

  } catch (error) {
    console.error('[Wingside Card] History error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
