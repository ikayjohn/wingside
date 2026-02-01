import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * POST /api/wingside-card/webhook
 * Handle Embedly TAP card transaction webhooks
 *
 * Webhook Events:
 * - card.transaction.success - Card payment completed
 * - card.transaction.failed - Card payment failed
 * - card.topup.success - Card topped up successfully
 * - card.status.changed - Card status updated
 *
 * Security:
 * - Webhook signature verification required
 * - Idempotent transaction handling
 */

interface CardTransactionEvent {
  event: 'card.transaction.success' | 'card.transaction.failed' | 'card.topup.success' | 'card.status.changed';
  data: {
    transaction_id: string;
    card_serial: string;
    amount: number;
    type: 'debit' | 'credit';
    description: string;
    merchant?: string;
    location?: string;
    timestamp: string;
    balance_after: number;
    status?: 'success' | 'failed';
    failure_reason?: string;
    new_status?: 'active' | 'suspended' | 'lost' | 'stolen' | 'terminated';
  };
  timestamp: string;
  signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.EMBEDLY_WEBHOOK_SECRET;

    // Enforce webhook secret in all environments
    if (!webhookSecret) {
      console.error('[Wingside Card Webhook] EMBEDLY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the signature from headers
    const signature = request.headers.get('x-embedly-signature');

    if (!signature) {
      console.error('[Wingside Card Webhook] No signature in webhook request');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Get raw body
    const body = await request.text();

    // Validate signature
    let isValidSignature = false;
    try {
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      isValidSignature = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(hash)
      );
    } catch {
      // Signature length mismatch or invalid format
      isValidSignature = false;
    }

    if (!isValidSignature) {
      console.error('[Wingside Card Webhook] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook event
    let event: CardTransactionEvent;
    try {
      event = JSON.parse(body) as CardTransactionEvent;
    } catch {
      console.error('[Wingside Card Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log(`[Wingside Card Webhook] Received event: ${event.event}`);

    const admin = createAdminClient();

    // Handle different event types
    switch (event.event) {
      case 'card.transaction.success': {
        const { data } = event;

        // Idempotency: Check if transaction already processed
        const { data: existingTx } = await admin
          .from('wallet_transactions')
          .select('id')
          .eq('reference', data.transaction_id)
          .maybeSingle();

        if (existingTx) {
          console.log(`[Wingside Card Webhook] Transaction ${data.transaction_id} already processed`);
          return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // Get card and user info
        const { data: cardData } = await admin.rpc('get_card_by_serial', {
          p_card_serial: data.card_serial
        });

        if (!cardData || cardData.length === 0) {
          console.error(`[Wingside Card Webhook] Card not found: ${data.card_serial}`);
          return NextResponse.json(
            { error: 'Card not found' },
            { status: 404 }
          );
        }

        const card = cardData[0];

        // Record card usage in wingside_cards table
        const { data: recordResult } = await admin.rpc('record_card_usage', {
          p_card_serial: data.card_serial,
          p_transaction_amount: data.amount,
          p_transaction_id: data.transaction_id
        });

        if (!recordResult) {
          console.error(`[Wingside Card Webhook] Failed to record card usage`);
        }

        // Create wallet transaction record
        const { error: txError } = await admin.from('wallet_transactions').insert({
          user_id: card.user_id,
          amount: data.amount,
          type: data.type === 'debit' ? 'debit' : 'credit',
          transaction_type: 'card_payment',
          description: data.description || `Card payment at ${data.merchant || 'POS'}`,
          reference: data.transaction_id,
          status: 'completed',
          balance_after: data.balance_after,
          metadata: {
            card_serial: data.card_serial,
            merchant: data.merchant,
            location: data.location,
            transaction_type: 'card_tap'
          },
          created_at: data.timestamp
        });

        if (txError) {
          console.error('[Wingside Card Webhook] Failed to create wallet transaction:', txError);
        } else {
          console.log(`✅ Card transaction recorded: ${data.transaction_id}`);
        }

        // Update wallet balance
        if (data.type === 'debit') {
          await admin.rpc('debit_wallet', {
            p_user_id: card.user_id,
            p_amount: data.amount,
            p_transaction_type: 'card_payment',
            p_description: data.description || `Card payment at ${data.merchant || 'POS'}`,
            p_reference: data.transaction_id
          });
        } else {
          await admin.rpc('credit_wallet', {
            p_user_id: card.user_id,
            p_amount: data.amount,
            p_transaction_type: 'card_refund',
            p_description: data.description || 'Card transaction refund',
            p_reference: data.transaction_id
          });
        }

        // Send notification to user
        await admin.from('notifications').insert({
          user_id: card.user_id,
          type: data.type === 'debit' ? 'card_payment' : 'card_refund',
          title: data.type === 'debit' ? 'Card Payment' : 'Card Refund',
          message: data.type === 'debit'
            ? `Your Wingside Card was charged ₦${data.amount.toLocaleString()} at ${data.merchant || 'POS'}`
            : `₦${data.amount.toLocaleString()} refunded to your Wingside Card`,
          metadata: {
            transaction_id: data.transaction_id,
            card_serial: data.card_serial,
            amount: data.amount,
            merchant: data.merchant,
            location: data.location,
            balance_after: data.balance_after
          },
          is_read: false
        });

        break;
      }

      case 'card.transaction.failed': {
        const { data } = event;

        // Get card and user info
        const { data: cardData } = await admin.rpc('get_card_by_serial', {
          p_card_serial: data.card_serial
        });

        if (!cardData || cardData.length === 0) {
          console.error(`[Wingside Card Webhook] Card not found: ${data.card_serial}`);
          return NextResponse.json(
            { error: 'Card not found' },
            { status: 404 }
          );
        }

        const card = cardData[0];

        // Send failure notification
        await admin.from('notifications').insert({
          user_id: card.user_id,
          type: 'card_payment_failed',
          title: 'Card Payment Failed',
          message: `Card payment of ₦${data.amount.toLocaleString()} failed: ${data.failure_reason || 'Insufficient balance'}`,
          metadata: {
            card_serial: data.card_serial,
            amount: data.amount,
            merchant: data.merchant,
            failure_reason: data.failure_reason
          },
          is_read: false
        });

        console.log(`⚠️ Card transaction failed: ${data.transaction_id}`);
        break;
      }

      case 'card.topup.success': {
        const { data } = event;

        // Already handled by top-up endpoint
        // Just record for audit log
        console.log(`✅ Card top-up webhook: ${data.transaction_id} - ₦${data.amount}`);
        break;
      }

      case 'card.status.changed': {
        const { data } = event;

        // Update card status in database
        const { error: updateError } = await admin
          .from('wingside_cards')
          .update({ status: data.new_status })
          .eq('card_serial', data.card_serial);

        if (updateError) {
          console.error('[Wingside Card Webhook] Failed to update card status:', updateError);
        } else {
          console.log(`✅ Card status updated: ${data.card_serial} → ${data.new_status}`);
        }

        break;
      }

      default:
        console.log(`[Wingside Card Webhook] Unknown event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Wingside Card Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
