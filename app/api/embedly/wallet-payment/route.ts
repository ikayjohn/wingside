import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient from '@/lib/embedly/client';

// POST /api/embedly/wallet-payment - Process payment using wallet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id, amount, remarks } = await request.json();

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
    try {
      const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

      // Check if sufficient balance
      if (wallet.availableBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }

      console.log(`Processing wallet payment of ₦${amount} from wallet ${profile.embedly_wallet_id}`);

      // Create local wallet transaction record (debit)
      const transactionReference = `ORDER-${order_id}-${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          amount: amount,
          currency: 'NGN',
          reference: transactionReference,
          description: remarks || `Payment for order ${order_id}`,
          status: 'completed',
          metadata: {
            order_id,
            wallet_id: profile.embedly_wallet_id,
            payment_method: 'wallet'
          }
        });

      if (transactionError) {
        console.error('Error creating wallet transaction record:', transactionError);
        throw new Error('Failed to record wallet transaction');
      }

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

          // Fetch updated wallet balance from Embedly and update profile
          try {
            const updatedWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
            console.log(`💰 New wallet balance: ₦${updatedWallet.availableBalance}`);

            // Update profile wallet_balance in Supabase
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({
                wallet_balance: updatedWallet.availableBalance
              })
              .eq('id', user.id);

            if (profileUpdateError) {
              console.error('Error updating profile wallet_balance:', profileUpdateError);
            } else {
              console.log(`✅ Profile wallet_balance updated to ₦${updatedWallet.availableBalance}`);
            }
          } catch (balanceUpdateError) {
            console.error('Error fetching updated wallet balance:', balanceUpdateError);
            // Don't throw error - payment was successful, just balance update failed
          }
        } catch (transferError) {
          console.error('❌ Wallet transfer failed:', transferError);
          throw new Error(`Failed to transfer funds to merchant wallet: ${transferError instanceof Error ? transferError.message : 'Unknown error'}`);
        }
      } else {
        console.warn('⚠️ Merchant wallet not configured. Skipping actual transfer.');
        throw new Error('Merchant wallet not configured. Please set EMBEDLY_MERCHANT_WALLET_ID in environment variables.');
      }

      // Update order status to paid
      const { data: order, error: orderUpdateError } = await supabase
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

      // Award purchase points (₦100 = 1 point)
      const purchasePoints = Math.floor(amount / 100);

      if (purchasePoints > 0) {
        const { error: pointsError } = await supabase.rpc('award_points', {
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

      // Check and award first order bonus
      const { data: existingClaim } = await supabase
        .from('reward_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('reward_type', 'first_order')
        .maybeSingle();

      if (!existingClaim) {
        // Award first order bonus (15 points)
        const { error: firstOrderError } = await supabase.rpc('claim_reward', {
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
        transactionReference: `ORDER-${order_id}-${Date.now()}`,
        newBalance: wallet.availableBalance - amount,
        pointsAwarded: purchasePoints
      });

    } catch (embedlyError) {
      console.error('Embedly wallet payment error:', embedlyError);
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