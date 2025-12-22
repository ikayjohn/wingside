import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface WebhookEvent {
  event: 'payout' | 'nip' | 'checkout.payment.success' | 'wallet.transfer';
  data: any;
}

// POST /api/embedly/webhooks - Handle Embedly webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-auth-signature');

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.EMBEDLY_WEBHOOK_SECRET;
    if (webhookSecret) {
      if (!signature) {
        console.error('Webhook signature missing');
        return NextResponse.json(
          { error: 'Signature missing' },
          { status: 401 }
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== `sha256${expectedSignature}`) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event: WebhookEvent = JSON.parse(body);
    const supabase = await createClient();

    console.log('Received Embedly webhook:', event.event, event.data);

    switch (event.event) {
      case 'payout':
        await handlePayoutWebhook(event.data, supabase);
        break;

      case 'nip':
        await handleNipWebhook(event.data, supabase);
        break;

      case 'checkout.payment.success':
        await handleCheckoutWebhook(event.data, supabase);
        break;

      case 'wallet.transfer':
        await handleWalletTransferWebhook(event.data, supabase);
        break;

      default:
        console.log('Unhandled webhook event type:', event.event);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Still return 200 OK to prevent webhook retries
    return NextResponse.json(
      { error: 'Webhook processing failed', received: true },
      { status: 200 }
    );
  }
}

async function handlePayoutWebhook(data: any, supabase: any) {
  try {
    const {
      debitAccountNumber,
      creditAccountNumber,
      amount,
      currency,
      status,
      paymentReference,
      dateOfTransaction
    } = data;

    // Update transfer log
    await supabase
      .from('transfer_logs')
      .update({
        status: status.toLowerCase(),
        updated_at: new Date().toISOString(),
        completed_at: dateOfTransaction ? new Date(dateOfTransaction).toISOString() : null
      })
      .eq('provider_reference', paymentReference);

    // Find and update user wallet balance
    if (status === 'Success') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, embedly_wallet_id')
        .eq('bank_account', debitAccountNumber)
        .single();

      if (profile) {
        // Update wallet balance in profile (this might be better handled by fetching from Embedly)
        await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        // Create transaction record
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: profile.id,
            type: 'debit',
            amount,
            currency,
            reference: paymentReference,
            description: `Interbank transfer to ${creditAccountNumber}`,
            status: 'completed',
            created_at: dateOfTransaction ? new Date(dateOfTransaction).toISOString() : new Date().toISOString()
          });
      }
    }

  } catch (error) {
    console.error('Error handling payout webhook:', error);
  }
}

async function handleNipWebhook(data: any, supabase: any) {
  try {
    const {
      accountNumber,
      reference,
      amount,
      senderName,
      dateOfTransaction,
      description
    } = data;

    // Find user by account number
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, embedly_wallet_id, full_name')
      .eq('bank_account', accountNumber)
      .single();

    if (profile) {
      // Create credit transaction record
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: profile.id,
          type: 'credit',
          amount,
          currency: 'NGN',
          reference,
          description: description || `Inflow from ${senderName}`,
          status: 'completed',
          created_at: dateOfTransaction ? new Date(dateOfTransaction).toISOString() : new Date().toISOString()
        });

      // Update wallet balance (in a real implementation, you'd fetch the latest balance from Embedly)
      await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      console.log(`Processed inflow for user ${profile.full_name}: ₦${amount}`);
    }

  } catch (error) {
    console.error('Error handling NIP webhook:', error);
  }
}

async function handleCheckoutWebhook(data: any, supabase: any) {
  try {
    const {
      transactionId,
      walletId,
      checkoutRef,
      amount,
      status,
      senderAccountNumber,
      senderName,
      createdAt
    } = data;

    if (status === 'success') {
      // Find checkout wallet and associated organization/user
      // This would depend on how you track checkout wallets in your system

      // Create transaction record for checkout payment
      await supabase
        .from('checkout_transactions')
        .upsert({
          transaction_id: transactionId,
          wallet_id: walletId,
          checkout_ref: checkoutRef,
          amount,
          status: 'completed',
          sender_account: senderAccountNumber,
          sender_name: senderName,
          created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log(`Processed checkout payment: ${checkoutRef} - ₦${amount}`);
    }

  } catch (error) {
    console.error('Error handling checkout webhook:', error);
  }
}

async function handleWalletTransferWebhook(data: any, supabase: any) {
  try {
    const {
      reference,
      fromAccount,
      toAccount,
      amount,
      status,
      timestamp
    } = data;

    // Update transfer log
    await supabase
      .from('transfer_logs')
      .update({
        status: status.toLowerCase(),
        updated_at: new Date().toISOString(),
        completed_at: timestamp ? new Date(timestamp).toISOString() : null
      })
      .eq('reference', reference);

    // Find users involved in the transfer
    const { data: fromProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('bank_account', fromAccount)
      .single();

    const { data: toProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('bank_account', toAccount)
      .single();

    if (fromProfile) {
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: fromProfile.id,
          type: 'debit',
          amount,
          currency: 'NGN',
          reference,
          description: toProfile ? `Transfer to ${toProfile.full_name}` : 'Wallet transfer',
          status: status.toLowerCase(),
          created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
        });
    }

    if (toProfile) {
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: toProfile.id,
          type: 'credit',
          amount,
          currency: 'NGN',
          reference,
          description: fromProfile ? `Transfer from ${fromProfile.full_name}` : 'Wallet transfer',
          status: status.toLowerCase(),
          created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error handling wallet transfer webhook:', error);
  }
}