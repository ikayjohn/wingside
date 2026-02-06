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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { amount } = body;

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

    const admin = createAdminClient();

    // Get user's card and profile (need mobile number for Embedly API)
    const { data: card, error: cardError } = await admin
      .from('wingside_cards')
      .select(`
        *,
        profiles!inner(
          phone_number
        )
      `)
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

    // Get user's phone number
    const { data: profile } = await admin
      .from('profiles')
      .select('phone_number')
      .eq('id', user.id)
      .single();

    if (!profile?.phone_number) {
      return NextResponse.json(
        { error: 'Phone number required for top-up. Please update your profile.' },
        { status: 400 }
      );
    }

    // Top up via Embedly TAP API
    console.log(`[Wingside Card] Topping up card ${card.card_serial} with ₦${amount}`);

    const topUpResult = await topUpCard({
      mobile_number: profile.phone_number,
      amount,
      card_serial: card.card_serial
    });

    if (!topUpResult.success) {
      console.error('Card top-up failed:', topUpResult.error);
      return NextResponse.json(
        { error: topUpResult.error || 'Failed to top up card' },
        { status: 500 }
      );
    }

    console.log(`✅ Card ${card.card_serial} topped up successfully`);

    // Record transaction in wallet_transactions for tracking
    const txReference = `CARD_TOPUP_${Date.now()}`;
    await admin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount,
        transaction_type: 'credit',
        payment_method: 'card_topup',
        status: 'completed',
        description: `Card top-up: ₦${amount.toLocaleString()}`,
        reference: txReference,
        metadata: {
          card_serial: card.card_serial,
          source: 'embedly_tap'
        }
      });

    return NextResponse.json({
      success: true,
      card_serial: card.card_serial,
      amount,
      reference: txReference,
      message: topUpResult.message || 'Card topped up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Wingside Card] Top-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
