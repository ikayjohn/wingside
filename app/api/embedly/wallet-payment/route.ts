import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import embedlyClient from '@/lib/embedly/client';
import { csrfProtection } from '@/lib/csrf';

// POST /api/embedly/wallet-payment - Process payment using wallet
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    const supabase = await createClient();

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

    const { order_id, amount, remarks } = body;

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!order_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and amount are required' },
        { status: 400 }
      );
    }

    // Get user's wallet details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'Wallet not found. Please create a wallet first.' },
        { status: 400 }
      );
    }

    // Get current wallet details
    let walletTransaction: any = null; // Declare outside try block for error handling access
    let transactionReference: string = '';
    let finalWalletBalance: number = 0; // Track actual balance after transfer

    // Initialize admin client for critical operations
    const admin = createAdminClient();

    try {
      const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

      // SYNC: Always sync wallet status with our database before checking
      // This ensures our database reflects the true state from Embedly
      const isWalletActive =
        wallet.isActive !== false &&
        (!wallet.status || wallet.status.toLowerCase() === 'active');

      // Update profile with latest wallet data from Embedly
      try {
        const syncData: any = {
          wallet_balance: wallet.availableBalance,
          is_wallet_active: isWalletActive,
          last_wallet_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Update virtual account info if available
        if (wallet.virtualAccount?.accountNumber) {
          syncData.bank_account = wallet.virtualAccount.accountNumber;
          syncData.bank_code = wallet.virtualAccount.bankCode;
          syncData.bank_name = wallet.virtualAccount.bankName;
        }

        await admin
          .from('profiles')
          .update(syncData)
          .eq('id', user.id);

        console.log(`✅ Synced wallet status: active=${isWalletActive}, balance=${wallet.availableBalance}`);
      } catch (syncError) {
        console.error('⚠️  Failed to sync wallet status:', syncError);
        // Don't fail the payment if sync fails - we still have fresh data from Embedly
      }

      if (!isWalletActive) {
        console.error(`Wallet ${profile.embedly_wallet_id} is inactive. Status:`, wallet.status || wallet.isActive);
        return NextResponse.json(
          {
            error: 'Wallet is currently inactive',
            details: 'Your wallet needs to be activated before making payments. Please contact support or create a new wallet.',
            code: 'WALLET_INACTIVE',
            helpUrl: '/my-account/cards'
          },
          { status: 400 }
        );
      }

      // Check if sufficient balance
      if (wallet.availableBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }

      console.log(`Processing wallet payment of ₦${amount} from wallet ${profile.embedly_wallet_id}`);

      // Create local wallet transaction record (debit) with PENDING status
      transactionReference = `ORDER-${order_id}-${Date.now()}`;
      const initialBalance = wallet.availableBalance;
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          amount: amount,
          currency: 'NGN',
          reference: transactionReference,
          description: remarks || `Payment for order ${order_id}`,
          status: 'pending', // Mark as pending until transfer completes
          balance_before: initialBalance,
          balance_after: initialBalance - amount, // Expected balance after transfer
          metadata: {
            order_id,
            wallet_id: profile.embedly_wallet_id,
            payment_method: 'wallet'
          }
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        console.error('Error creating wallet transaction record:', transactionError);
        throw new Error('Failed to record wallet transaction');
      }

      walletTransaction = transaction; // Assign to outer scope variable
      console.log(`📝 Created pending transaction ${walletTransaction.id} with reference ${transactionReference}`);

      // Perform actual wallet-to-wallet transfer to merchant wallet
      const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;

      if (merchantWalletId && merchantWalletId !== 'placeholder-merchant-wallet-id') {
        console.log(`💸 Transferring ₦${amount} from customer wallet to merchant wallet...`);

        try {
          // Get merchant wallet details
          const merchantWallet = await embedlyClient.getWalletById(merchantWalletId);

          // Transfer from customer wallet to merchant wallet
          await embedlyClient.walletToWalletTransfer({
            fromAccount: wallet.virtualAccount.accountNumber,
            toAccount: merchantWallet.virtualAccount.accountNumber,
            amount: amount,
            transactionReference: transactionReference,
            remarks: remarks || `Payment for order ${order_id}`
          });

          console.log(`✅ Successfully transferred ₦${amount} to merchant wallet (${merchantWalletId})`);

          // Update transaction status to completed after successful transfer with actual balance
          const { error: transactionUpdateError } = await admin
            .from('wallet_transactions')
            .update({
              status: 'completed',
              balance_after: finalWalletBalance, // Actual balance from Embedly after transfer
              updated_at: new Date().toISOString()
            })
            .eq('id', walletTransaction.id);

          if (transactionUpdateError) {
            console.error('Error updating transaction status:', transactionUpdateError);
            // Don't throw - transfer succeeded, this is just a status update issue
          } else {
            console.log(`✅ Transaction ${walletTransaction.id} marked as completed`);
          }

          // Fetch updated wallet balance from Embedly and update profile using admin client
          try {
            const updatedWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
            finalWalletBalance = updatedWallet.availableBalance; // Store actual balance
            console.log(`💰 New wallet balance: ₦${finalWalletBalance}`);

            // Update profile wallet_balance in Supabase using admin client
            const { error: profileUpdateError } = await admin
              .from('profiles')
              .update({
                wallet_balance: finalWalletBalance
              })
              .eq('id', user.id);

            if (profileUpdateError) {
              console.error('Error updating profile wallet_balance:', profileUpdateError);
            } else {
              console.log(`✅ Profile wallet_balance updated to ₦${finalWalletBalance}`);
            }
          } catch (balanceUpdateError) {
            console.error('Error fetching updated wallet balance:', balanceUpdateError);
            // Fallback: calculate expected balance if fetch fails
            finalWalletBalance = wallet.availableBalance - amount;
            console.warn(`⚠️ Using calculated balance: ₦${finalWalletBalance}`);
          }
        } catch (transferError) {
          console.error('❌ Wallet transfer failed:', transferError);

          // Mark transaction as failed using admin client
          await admin
            .from('wallet_transactions')
            .update({
              status: 'failed',
              metadata: {
                ...walletTransaction.metadata,
                error: transferError instanceof Error ? transferError.message : 'Unknown error',
                failed_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', walletTransaction.id);

          throw new Error(`Failed to transfer funds to merchant wallet: ${transferError instanceof Error ? transferError.message : 'Unknown error'}`);
        }
      } else {
        console.warn('⚠️ Merchant wallet not configured. Skipping actual transfer.');

        // Mark transaction as failed using admin client
        await admin
          .from('wallet_transactions')
          .update({
            status: 'failed',
            metadata: {
              ...walletTransaction.metadata,
              error: 'Merchant wallet not configured',
              failed_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', walletTransaction.id);

        throw new Error('Merchant wallet not configured. Please set EMBEDLY_MERCHANT_WALLET_ID in environment variables.');
      }

      // Update order status to paid using admin client to bypass RLS
      const { data: order, error: orderUpdateError } = await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_reference: transactionReference,
          paid_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single();

      if (orderUpdateError) {
        console.error('Error updating order status:', orderUpdateError);
        throw new Error('Failed to update order status after payment');
      }

      if (!order) {
        throw new Error('Order not found or could not be updated');
      }

      console.log(`✅ Order ${order_id} marked as paid and confirmed`);

      // Award purchase points (₦100 = 1 point) using admin client
      const purchasePoints = Math.floor(amount / 100);

      if (purchasePoints > 0) {
        const { error: pointsError } = await admin.rpc('award_points', {
          p_user_id: user.id,
          p_reward_type: 'purchase',
          p_points: purchasePoints,
          p_amount_spent: amount,
          p_description: `Points earned from order #${order?.order_number}`,
          p_metadata: { order_id, order_number: order?.order_number }
        });

        if (!pointsError) {
          console.log(`✅ Awarded ${purchasePoints} points for ₦${amount} spent (wallet payment)`)
        } else {
          console.error('Error awarding points:', pointsError)
        }
      }

      // Check and award first order bonus using admin client
      const { data: existingClaim } = await admin
        .from('reward_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('reward_type', 'first_order')
        .maybeSingle();

      if (!existingClaim) {
        // Award first order bonus (15 points)
        const { error: firstOrderError } = await admin.rpc('claim_reward', {
          p_user_id: user.id,
          p_reward_type: 'first_order',
          p_points: 15,
          p_description: 'First order bonus',
          p_metadata: { order_id, order_number: order?.order_number }
        });

        if (!firstOrderError) {
          console.log(`✅ Awarded 15 points for first order (wallet payment)`)
        } else {
          console.error('Error awarding first order bonus:', firstOrderError)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        transactionReference: transactionReference, // Use the actual reference from the transaction
        transactionId: walletTransaction.id,
        newBalance: finalWalletBalance, // Use actual balance from Embedly after transfer
        pointsAwarded: purchasePoints
      });

    } catch (embedlyError) {
      console.error('Embedly wallet payment error:', embedlyError);

      // If transaction was created but failed, mark it as failed using admin client
      // This ensures financial records accurately reflect failed payments
      if (walletTransaction) {
        try {
          await admin
            .from('wallet_transactions')
            .update({
              status: 'failed',
              metadata: {
                ...walletTransaction.metadata,
                error: embedlyError instanceof Error ? embedlyError.message : 'Unknown error',
                failed_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', walletTransaction.id);

          console.log(`❌ Transaction ${walletTransaction.id} marked as failed`);
        } catch (updateError) {
          console.error('Error updating failed transaction status:', updateError);
        }
      }

      return NextResponse.json(
        {
          error: 'Failed to process wallet payment',
          details: embedlyError instanceof Error ? embedlyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Wallet payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process wallet payment' },
      { status: 500 }
    );
  }
}