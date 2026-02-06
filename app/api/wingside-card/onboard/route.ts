import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { onboardCard } from '@/lib/embedly/tap-client';
import crypto from 'crypto';

/**
 * POST /api/wingside-card/onboard
 * Link a physical Wingside Card to user's wallet
 *
 * Security:
 * - Requires authentication
 * - ONE card per user enforced
 * - Card serial must be unique
 * - PIN is hashed before storage
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
    const { card_serial, card_pin } = body;

    // Validate input
    if (!card_serial || !card_pin) {
      return NextResponse.json(
        { error: 'Card serial and PIN are required' },
        { status: 400 }
      );
    }

    // Validate card serial format (8 alphanumeric characters)
    if (!/^[0-9A-F]{8}$/i.test(card_serial)) {
      return NextResponse.json(
        { error: 'Invalid card serial format. Expected: 8 alphanumeric characters (e.g., 372FB056)' },
        { status: 400 }
      );
    }

    // Validate PIN (4-6 digits)
    if (!/^\d{4,6}$/.test(card_pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check if user can link a card (ONE card per user)
    const { data: canLink, error: checkError } = await admin.rpc(
      'can_user_link_card',
      { p_user_id: user.id }
    );

    if (checkError) {
      console.error('Error checking card eligibility:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify card eligibility' },
        { status: 500 }
      );
    }

    if (!canLink) {
      return NextResponse.json(
        { error: 'You already have an active Wingside Card. Each customer can only have one card.' },
        { status: 400 }
      );
    }

    // Check if card serial is already linked
    const { data: existingCard } = await admin
      .from('wingside_cards')
      .select('id, user_id')
      .eq('card_serial', card_serial)
      .maybeSingle();

    if (existingCard) {
      return NextResponse.json(
        { error: 'This card is already linked to another account' },
        { status: 400 }
      );
    }

    // Get user's profile and Embedly wallet info
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, full_name, embedly_customer_id, embedly_wallet_id')
      .eq('id', user.id)
      .single();

    if (!profile?.embedly_customer_id || !profile?.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'Your wallet is not set up. Please contact support.' },
        { status: 400 }
      );
    }

    // Onboard card via Embedly TAP API
    console.log(`[Wingside Card] Onboarding card ${card_serial} for user ${user.id}`);

    const embedlyResult = await onboardCard({
      customer_id: profile.embedly_customer_id,
      wallet_id: profile.embedly_wallet_id,
      card_serial,
      card_pin
    });

    // Defensive null check
    if (!embedlyResult) {
      console.error('Embedly card onboarding returned null/undefined');
      return NextResponse.json(
        { error: 'Card activation service unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (!embedlyResult.success) {
      console.error('Embedly card onboarding failed:', embedlyResult.error);
      return NextResponse.json(
        { error: embedlyResult.error || 'Failed to activate card' },
        { status: 500 }
      );
    }

    // Hash PIN for local storage (bcrypt would be better, but using sha256 for now)
    const cardPinHash = crypto
      .createHash('sha256')
      .update(card_pin)
      .digest('hex');

    // Store card in database
    const { data: card, error: insertError } = await admin
      .from('wingside_cards')
      .insert({
        user_id: user.id,
        embedly_customer_id: profile.embedly_customer_id,
        embedly_wallet_id: profile.embedly_wallet_id,
        card_serial,
        card_pin_hash: cardPinHash,
        status: 'active',
        card_type: 'standard',
        max_debit: 50000, // Default ₦50,000 limit
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing card:', insertError);

      // Try to revert Embedly onboarding if possible
      // (Embedly may not have a revert API, handle gracefully)

      return NextResponse.json(
        { error: 'Failed to save card information' },
        { status: 500 }
      );
    }

    console.log(`✅ Wingside Card ${card_serial} linked successfully to user ${user.id}`);

    // Return card info (without PIN hash)
    return NextResponse.json({
      success: true,
      card: {
        id: card.id,
        card_serial: card.card_serial,
        status: card.status,
        card_type: card.card_type,
        max_debit: card.max_debit,
        linked_at: card.linked_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Wingside Card] Onboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
