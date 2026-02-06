import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCardBalance } from '@/lib/embedly/tap-client';

/**
 * GET /api/wingside-card/balance
 * Get Wingside Card balance (same as wallet balance)
 *
 * Security:
 * - Requires authentication
 * - Users can only check their own card balance
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

    const admin = createAdminClient();

    // Get user's card
    const { data: card, error: cardError } = await admin
      .from('wingside_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
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
        { error: 'No active Wingside Card found. Please link a card first.' },
        { status: 404 }
      );
    }

    // Get balance from Embedly TAP API
    const balanceResult = await getCardBalance(card.card_serial);

    if (!balanceResult.success) {
      console.error('Failed to fetch card balance:', balanceResult.error);

      // Fallback: Get balance from wallet table
      const { data: wallet } = await admin
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        card_serial: card.card_serial,
        balance: wallet?.balance || 0,
        currency: 'NGN',
        source: 'wallet_fallback',
        last_updated: new Date().toISOString()
      });
    }

    // Embedly TAP API returns: { phone, fullname, walletBalance, valid }
    return NextResponse.json({
      card_serial: card.card_serial,
      balance: balanceResult.data?.walletBalance || 0,
      currency: 'NGN',
      source: 'embedly',
      last_updated: new Date().toISOString(),
      customer_info: {
        fullname: balanceResult.data?.fullname,
        phone: balanceResult.data?.phone,
        valid: balanceResult.data?.valid === 1
      },
      card_info: {
        status: card.status,
        max_debit: card.max_debit,
        last_used_at: card.last_used_at,
        total_transactions: card.total_transactions,
        total_spent: card.total_spent
      }
    });

  } catch (error) {
    console.error('[Wingside Card] Balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
