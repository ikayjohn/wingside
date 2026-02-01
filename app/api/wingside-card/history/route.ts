import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCardHistory } from '@/lib/embedly/tap-client';

/**
 * GET /api/wingside-card/history
 * Get Wingside Card transaction history
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

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
    const historyResult = await getCardHistory(card.card_serial, page, limit);

    if (!historyResult.success) {
      console.error('Failed to fetch card history:', historyResult.error);

      // Fallback: Get wallet transactions
      const { data: walletTxs } = await admin
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      const { count } = await admin
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return NextResponse.json({
        card_serial: card.card_serial,
        transactions: walletTxs || [],
        total_count: count || 0,
        page,
        limit,
        source: 'wallet_fallback'
      });
    }

    // Merge card transactions with wallet transaction data
    const transactions = historyResult.data?.transactions || [];

    return NextResponse.json({
      card_serial: card.card_serial,
      transactions,
      total_count: historyResult.data?.total_count || 0,
      page: historyResult.data?.page || page,
      limit: historyResult.data?.limit || limit,
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
