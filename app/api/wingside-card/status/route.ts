import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateCardStatus } from '@/lib/embedly/tap-client';

/**
 * PUT /api/wingside-card/status
 * Update Wingside Card status
 *
 * Request body:
 * - status: 'active' | 'suspended' | 'lost' | 'stolen'
 * - reason: String (optional)
 *
 * Security:
 * - Requires authentication
 * - Users can only update their own card status
 * - Status transitions validated
 */
export async function PUT(request: NextRequest) {
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
    const { status, reason } = body;

    // Validate status
    const validStatuses = ['active', 'suspended', 'lost', 'stolen'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Validate status transition
    if (card.status === 'terminated') {
      return NextResponse.json(
        { error: 'Cannot update status of terminated card' },
        { status: 400 }
      );
    }

    if (card.status === status) {
      return NextResponse.json(
        { error: `Card is already ${status}` },
        { status: 400 }
      );
    }

    // Update status via Embedly TAP API
    console.log(`[Wingside Card] Updating card ${card.card_serial} status to ${status}`);

    const updateResult = await updateCardStatus(card.card_serial, status);

    if (!updateResult.success) {
      console.error('Card status update failed:', updateResult.error);
      return NextResponse.json(
        { error: updateResult.error || 'Failed to update card status' },
        { status: 500 }
      );
    }

    // Update local database
    const { error: dbError } = await admin
      .from('wingside_cards')
      .update({
        status,
        metadata: {
          ...card.metadata,
          status_history: [
            ...(card.metadata?.status_history || []),
            {
              from: card.status,
              to: status,
              reason,
              timestamp: new Date().toISOString(),
              updated_by: user.id
            }
          ]
        }
      })
      .eq('id', card.id);

    if (dbError) {
      console.error('Failed to update card status in database:', dbError);
      // Don't fail - Embedly is source of truth
    }

    // Create notification for lost/stolen cards
    if (status === 'lost' || status === 'stolen') {
      await admin.from('notifications').insert({
        user_id: user.id,
        type: 'card_security_alert',
        title: `Card Reported ${status === 'lost' ? 'Lost' : 'Stolen'}`,
        message: `Your Wingside Card (${card.card_serial}) has been ${status === 'lost' ? 'reported as lost' : 'reported as stolen'}. The card is now blocked and cannot be used. Contact support if you need assistance.`,
        metadata: {
          card_serial: card.card_serial,
          status,
          reason
        }
      });
    }

    console.log(`✅ Card ${card.card_serial} status updated to ${status}`);

    return NextResponse.json({
      success: true,
      card_serial: card.card_serial,
      old_status: card.status,
      new_status: status,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Wingside Card] Status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wingside-card/status
 * Get current Wingside Card status
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
        { error: 'No Wingside Card found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      card_serial: card.card_serial,
      status: card.status,
      card_type: card.card_type,
      max_debit: card.max_debit,
      linked_at: card.linked_at,
      last_used_at: card.last_used_at,
      total_transactions: card.total_transactions,
      total_spent: card.total_spent,
      status_history: card.metadata?.status_history || []
    });

  } catch (error) {
    console.error('[Wingside Card] Get status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
