import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { topUpCard } from '@/lib/embedly/tap-client';

/**
 * POST /api/wingside-card/top-up
 * Add money to Wingside Card (adds to wallet balance)
 *
 * Request body:
 * - amount: Number (required, minimum ₦100)
 * - source: 'wallet' | 'external' (default: 'external')
 * - reference: Payment reference (optional)
 *
 * Security:
 * - Requires authentication
 * - Users can only top up their own card
 * - Minimum amount: ₦100
 * - Maximum amount: ₦1,000,000 per transaction
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { amount, source = 'external', reference } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum top-up is ₦100' },
        { status: 400 }
      );
    }

    if (amount > 1000000) {
      return NextResponse.json(
        { error: 'Maximum top-up amount is ₦1,000,000' },
        { status: 400 }
      );
    }

    // Validate source
    if (!['wallet', 'external'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be "wallet" or "external"' },
        { status: 400 }
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

    // Top up via Embedly TAP API
    console.log(`[Wingside Card] Topping up card ${card.card_serial} with ₦${amount}`);

    const topUpResult = await topUpCard({
      card_serial: card.card_serial,
      amount,
      source,
      reference
    });

    if (!topUpResult.success) {
      console.error('Card top-up failed:', topUpResult.error);
      return NextResponse.json(
        { error: topUpResult.error || 'Failed to top up card' },
        { status: 500 }
      );
    }

    // Also update wallet balance (since card and wallet share balance)
    const { error: walletError } = await admin.rpc('credit_wallet', {
      p_user_id: user.id,
      p_amount: amount,
      p_transaction_type: 'card_topup',
      p_description: `Card top-up: ₦${amount.toLocaleString()}`,
      p_reference: reference || topUpResult.data?.transaction_id || null
    });

    if (walletError) {
      console.error('Failed to sync wallet balance:', walletError);
      // Don't fail the request - Embedly is source of truth
    }

    console.log(`✅ Card ${card.card_serial} topped up successfully`);

    return NextResponse.json({
      success: true,
      transaction_id: topUpResult.data?.transaction_id,
      card_serial: card.card_serial,
      amount,
      new_balance: topUpResult.data?.new_balance || 0,
      timestamp: topUpResult.data?.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('[Wingside Card] Top-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
