import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/wallet-payment-simple - Simplified version without balance tracking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { order_id, amount, remarks } = body;

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile?.embedly_wallet_id) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

    const isWalletActive = wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active');

    // Sync wallet status
    await admin.from('profiles').update({
      wallet_balance: wallet.availableBalance,
      is_wallet_active: isWalletActive,
      last_wallet_sync: new Date().toISOString()
    }).eq('id', user.id);

    if (!isWalletActive) {
      return NextResponse.json({
        error: 'Wallet is currently inactive',
        code: 'WALLET_INACTIVE'
      }, { status: 400 });
    }

    if (wallet.availableBalance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const transactionReference = `ORDER-${order_id}-${Date.now()}`;

    // Transfer to merchant wallet
    const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;

    if (merchantWalletId && merchantWalletId !== 'placeholder-merchant-wallet-id') {
      const merchantWallet = await embedlyClient.getWalletById(merchantWalletId);

      await embedlyClient.walletToWalletTransfer({
        fromAccount: wallet.virtualAccount.accountNumber,
        toAccount: merchantWallet.virtualAccount.accountNumber,
        amount: amount,
        transactionReference: transactionReference,
        remarks: remarks || `Payment for order ${order_id}`
      });

      // Create simple transaction record (without balance columns for now)
      try {
        await admin.from('wallet_transactions').insert({
          user_id: user.id,
          type: 'debit',
          amount: amount,
          currency: 'NGN',
          reference: transactionReference,
          description: remarks || `Payment for order ${order_id}`,
          status: 'completed',
          order_id: order_id
        });
      } catch (insertError) {
        console.error('Failed to create transaction record:', insertError);
        // Continue anyway - the transfer succeeded
      }

      // Update order
      const { data: order } = await admin
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

      // Award points
      const purchasePoints = Math.floor(amount / 100);
      if (purchasePoints > 0) {
        await admin.rpc('award_points', {
          p_user_id: user.id,
          p_reward_type: 'purchase',
          p_points: purchasePoints,
          p_amount_spent: amount,
          p_description: `Points earned from order #${order?.order_number}`,
          p_metadata: { order_id, order_number: order?.order_number }
        });
      }

      // Get updated balance
      const updatedWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

      await admin.from('profiles').update({
        wallet_balance: updatedWallet.availableBalance
      }).eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        transactionReference,
        newBalance: updatedWallet.availableBalance,
        orderId: order_id
      });
    }

    return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 });

  } catch (error: any) {
    console.error('Wallet payment error:', error);
    return NextResponse.json({
      error: 'Failed to process wallet payment',
      details: error.message
    }, { status: 500 });
  }
}
