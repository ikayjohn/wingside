import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface WebhookEvent {
  event: 'payout' | 'nip' | 'checkout.payment.success' | 'wallet.transfer';
  data: any;
}

// POST /api/embedly/webhooks - Handle Embedly webhooks
export async function POST(request: NextRequest) {
  let event: WebhookEvent | undefined;

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

    event = JSON.parse(body) as WebhookEvent;
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
    console.error('❌ Webhook processing error:', error);

    // Track critical webhook processing failure
    try {
      const supabase = await createClient();
      await supabase.from('webhook_errors').insert({
        webhook_type: 'embedly_main',
        event_data: event,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          event_type: event?.event,
          error_location: 'main_handler'
        },
        severity: 'critical', // Main handler failure
        created_at: new Date().toISOString()
      });

      // Alert admin of main webhook handler failure
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'webhook_system_error',
        title: 'Embedly Webhook System Error',
        message: `Critical webhook processing error. Financial operations may be failing.`,
        metadata: {
          event_type: event?.event,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: 'critical',
          impact: 'Multiple financial operations may be affected'
        },
        is_read: false
      });
    } catch (trackingError) {
      console.error('Failed to track critical webhook error:', trackingError);
    }

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

    // IDEMPOTENCY CHECK: Verify this webhook hasn't been processed already
    const { data: existingTransaction } = await supabase
      .from('wallet_transactions')
      .select('id, status')
      .eq('reference', paymentReference)
      .maybeSingle();

    if (existingTransaction) {
      console.log(`[Idempotency] Payout webhook already processed: ${paymentReference}`);
      return; // Already processed, skip duplicate
    }

    // Update transfer log
    await supabase
      .from('transfer_logs')
      .update({
        status: status.toLowerCase(),
        updated_at: new Date().toISOString(),
        completed_at: dateOfTransaction ? new Date(dateOfTransaction).toISOString() : null
      })
      .eq('provider_reference', paymentReference);

    // Find and update user wallet balance atomically
    if (status === 'Success') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, embedly_wallet_id')
        .eq('bank_account', debitAccountNumber)
        .single();

      if (profile) {
        // Use atomic debit to prevent race conditions
        const { data: debitResult, error: debitError } = await supabase.rpc('atomic_debit_wallet', {
          p_user_id: profile.id,
          p_amount: parseFloat(amount),
          p_transaction_type: 'withdrawal', // Correct: Money leaving wallet to external bank account
          p_description: `Interbank transfer to ${creditAccountNumber}`,
          p_reference: paymentReference,
          p_metadata: {
            payment_method: 'bank_transfer',
            credit_account: creditAccountNumber,
            webhook_event: 'payout',
            date_of_transaction: dateOfTransaction
          }
        });

        if (debitError) {
          console.error('Error debiting wallet (payout):', debitError);
        } else if (debitResult && debitResult.length > 0) {
          const result = debitResult[0];
          if (result.success) {
            console.log(`Processed payout debit: ₦${amount} (Balance: ₦${result.new_balance})`);
          } else {
            console.error(`Payout debit failed: ${result.error_message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error handling payout webhook:', error);

    // CRITICAL: Track webhook handler errors for investigation
    try {
      await supabase.from('webhook_errors').insert({
        webhook_type: 'embedly_payout',
        event_data: data,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          payment_reference: data.paymentReference,
          debit_account: data.debitAccountNumber,
          credit_account: data.creditAccountNumber,
          amount: data.amount,
          status: data.status
        },
        severity: 'high', // Financial operation failure
        created_at: new Date().toISOString()
      });

      // Alert admin of critical webhook failure
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'webhook_processing_error',
        title: 'Embedly Payout Webhook Failed',
        message: `Critical: Payout webhook processing failed. Financial transaction may be incomplete.`,
        metadata: {
          webhook_type: 'payout',
          payment_reference: data.paymentReference,
          amount: data.amount,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: 'critical',
          action_required: 'Investigate and manually process if needed'
        },
        is_read: false
      });
    } catch (trackingError) {
      console.error('Failed to track webhook error:', trackingError);
    }
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

    // IDEMPOTENCY CHECK: Verify this webhook hasn't been processed already
    const { data: existingTransaction } = await supabase
      .from('wallet_transactions')
      .select('id, status')
      .eq('reference', reference)
      .maybeSingle();

    if (existingTransaction) {
      console.log(`[Idempotency] NIP webhook already processed: ${reference}`);
      return; // Already processed, skip duplicate
    }

    // Find user by account number
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, embedly_wallet_id, full_name')
      .eq('bank_account', accountNumber)
      .single();

    if (profile) {
      // Use atomic credit function to prevent race conditions
      const { data: creditResult, error: creditError } = await supabase.rpc('atomic_credit_wallet', {
        p_user_id: profile.id,
        p_amount: parseFloat(amount),
        p_transaction_type: 'funding',
        p_description: description || `Wallet funding from ${senderName || 'bank transfer'}`,
        p_reference: reference,
        p_metadata: {
          payment_method: 'bank_transfer',
          sender_name: senderName,
          webhook_event: 'nip',
          date_of_transaction: dateOfTransaction
        }
      });

      if (creditError) {
        console.error('Error crediting wallet:', creditError);
      } else if (creditResult && creditResult.length > 0) {
        const newBalance = creditResult[0].new_balance;
        console.log(`Processed inflow for user ${profile.full_name}: ₦${amount} (Balance: ₦${newBalance})`);
      }
    }

  } catch (error) {
    console.error('❌ Error handling NIP webhook:', error);

    // CRITICAL: Track webhook handler errors
    try {
      await supabase.from('webhook_errors').insert({
        webhook_type: 'embedly_nip',
        event_data: data,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          reference: data.reference,
          account_number: data.accountNumber,
          amount: data.amount,
          sender_name: data.senderName
        },
        severity: 'high', // Inflow not credited
        created_at: new Date().toISOString()
      });

      // Alert admin
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'webhook_processing_error',
        title: 'Embedly NIP Webhook Failed',
        message: `NIP inflow webhook failed. Customer deposit may not be credited.`,
        metadata: {
          webhook_type: 'nip',
          reference: data.reference,
          amount: data.amount,
          account: data.accountNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: 'critical'
        },
        is_read: false
      });
    } catch (trackingError) {
      console.error('Failed to track webhook error:', trackingError);
    }
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
      // IDEMPOTENCY CHECK: Verify this webhook hasn't been processed already
      const { data: existingCheckout } = await supabase
        .from('checkout_transactions')
        .select('transaction_id, status')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingCheckout && existingCheckout.status === 'completed') {
        console.log(`[Idempotency] Checkout webhook already processed: ${transactionId}`);
        return; // Already processed, skip duplicate
      }

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
    console.error('❌ Error handling checkout webhook:', error);

    // Track webhook handler errors
    try {
      await supabase.from('webhook_errors').insert({
        webhook_type: 'embedly_checkout',
        event_data: data,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          transaction_id: data.transactionId,
          checkout_ref: data.checkoutRef,
          wallet_id: data.walletId,
          amount: data.amount,
          status: data.status
        },
        severity: 'medium', // Checkout payment not recorded
        created_at: new Date().toISOString()
      });

      // Alert admin
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'webhook_processing_error',
        title: 'Embedly Checkout Webhook Failed',
        message: `Checkout payment webhook failed. Payment may not be recorded.`,
        metadata: {
          webhook_type: 'checkout',
          checkout_ref: data.checkoutRef,
          amount: data.amount,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: 'medium'
        },
        is_read: false
      });
    } catch (trackingError) {
      console.error('Failed to track webhook error:', trackingError);
    }
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

    // IDEMPOTENCY CHECK: Verify this webhook hasn't been processed already
    // Check if we've already created transactions for this reference
    const { data: existingTransactions } = await supabase
      .from('wallet_transactions')
      .select('id, user_id, type')
      .eq('reference', reference)
      .limit(2);

    if (existingTransactions && existingTransactions.length >= 2) {
      // Both debit and credit transactions exist for this transfer
      console.log(`[Idempotency] Wallet transfer webhook already processed: ${reference}`);
      return; // Already processed, skip duplicate
    }

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
      // Use atomic debit to prevent race conditions
      const { data: debitResult, error: debitError } = await supabase.rpc('atomic_debit_wallet', {
        p_user_id: fromProfile.id,
        p_amount: parseFloat(amount),
        p_transaction_type: 'transfer_out', // Correct: Money leaving wallet to another wallet
        p_description: toProfile ? `Transfer to ${toProfile.full_name}` : 'Wallet transfer',
        p_reference: reference,
        p_metadata: {
          payment_method: 'wallet_transfer',
          to_account: toAccount,
          to_user_id: toProfile?.id,
          webhook_event: 'wallet.transfer',
          status: status.toLowerCase(),
          timestamp: timestamp
        }
      });

      if (debitError) {
        console.error('Error debiting sender wallet (transfer):', debitError);
      } else if (debitResult && debitResult.length > 0) {
        const result = debitResult[0];
        if (result.success) {
          console.log(`Processed transfer debit from ${fromProfile.full_name}: ₦${amount}`);
        } else {
          console.error(`Transfer debit failed: ${result.error_message}`);
        }
      }
    }

    if (toProfile) {
      // Use atomic credit to prevent race conditions
      const { data: creditResult, error: creditError } = await supabase.rpc('atomic_credit_wallet', {
        p_user_id: toProfile.id,
        p_amount: parseFloat(amount),
        p_transaction_type: 'transfer_in', // Correct: Money entering wallet from another wallet
        p_description: fromProfile ? `Transfer from ${fromProfile.full_name}` : 'Wallet transfer',
        p_reference: reference,
        p_metadata: {
          payment_method: 'wallet_transfer',
          from_account: fromAccount,
          from_user_id: fromProfile?.id,
          webhook_event: 'wallet.transfer',
          status: status.toLowerCase(),
          timestamp: timestamp
        }
      });

      if (creditError) {
        console.error('Error crediting recipient wallet (transfer):', creditError);
      } else if (creditResult && creditResult.length > 0) {
        const newBalance = creditResult[0].new_balance;
        console.log(`Processed transfer credit to ${toProfile.full_name}: ₦${amount} (Balance: ₦${newBalance})`);
      }
    }

  } catch (error) {
    console.error('❌ Error handling wallet transfer webhook:', error);

    // CRITICAL: Track webhook handler errors
    try {
      await supabase.from('webhook_errors').insert({
        webhook_type: 'embedly_wallet_transfer',
        event_data: data,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          reference: data.reference,
          from_account: data.fromAccount,
          to_account: data.toAccount,
          amount: data.amount,
          status: data.status
        },
        severity: 'high', // Transfer not processed
        created_at: new Date().toISOString()
      });

      // Alert admin
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'webhook_processing_error',
        title: 'Embedly Wallet Transfer Webhook Failed',
        message: `Wallet-to-wallet transfer webhook failed. Transfer may be incomplete.`,
        metadata: {
          webhook_type: 'wallet_transfer',
          reference: data.reference,
          amount: data.amount,
          from_account: data.fromAccount,
          to_account: data.toAccount,
          error: error instanceof Error ? error.message : 'Unknown error',
          urgency: 'critical'
        },
        is_read: false
      });
    } catch (trackingError) {
      console.error('Failed to track webhook error:', trackingError);
    }
  }
}