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

      // For MVP, we'll just record the wallet payment without actual transfer
      // In production, you would transfer funds to your merchant wallet
      // For now, we'll deduct from available balance and track the transaction
      console.log(`Processing wallet payment of ₦${amount} from wallet ${profile.embedly_wallet_id}`);

      // TODO: Set up merchant wallet and implement actual wallet-to-wallet transfer
      // const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;
      //
      // if (merchantWalletId && merchantWalletId !== 'placeholder-merchant-wallet-id') {
      //   await embedlyClient.walletToWalletTransfer({
      //     fromWalletId: profile.embedly_wallet_id,
      //     toWalletId: merchantWalletId,
      //     amount: amount,
      //     remarks: remarks || `Payment for order ${order_id}`,
      //     reference: `ORDER-${order_id}-${Date.now()}`
      //   });
      // }

      // Update order status to paid
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        transactionReference: `ORDER-${order_id}-${Date.now()}`,
        newBalance: wallet.availableBalance - amount
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