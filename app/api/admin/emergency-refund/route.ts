import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import embedlyClient from '@/lib/embedly/client';

// POST /api/admin/emergency-refund - Emergency refund to fix duplicate charges
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, amount, reason } = body;

    if (!user_id || !amount) {
      return NextResponse.json(
        { error: 'user_id and amount are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get user's profile with Embedly wallet info
    const { data: userProfile } = await admin
      .from('profiles')
      .select('full_name, embedly_wallet_id, email')
      .eq('id', user_id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userProfile.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'User does not have an Embedly wallet to refund to' },
        { status: 400 }
      );
    }

    // Get merchant wallet
    const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;
    if (!merchantWalletId || merchantWalletId === 'placeholder-merchant-wallet-id') {
      return NextResponse.json(
        { error: 'Merchant wallet not configured. Set EMBEDLY_MERCHANT_WALLET_ID in environment variables' },
        { status: 500 }
      );
    }

    try {
      // Get user wallet
      const userWallet = await embedlyClient.getWalletById(userProfile.embedly_wallet_id);
      const merchantWallet = await embedlyClient.getWalletById(merchantWalletId);

      console.log(`💸 Emergency refund: ₦${amount} from merchant to user ${userProfile.embedly_wallet_id}...`);

      // Transfer from merchant wallet to user wallet
      await embedlyClient.walletToWalletTransfer({
        fromAccount: merchantWallet.virtualAccount.accountNumber,
        toAccount: userWallet.virtualAccount.accountNumber,
        amount: amount,
        transactionReference: `EMERGENCY-REFUND-${Date.now()}`,
        remarks: `Emergency refund: ${reason || 'Duplicate payment correction'}`
      });

      console.log(`✅ Successfully refunded ₦${amount} to user's wallet`);

      // Fetch updated balance
      const updatedWallet = await embedlyClient.getWalletById(userProfile.embedly_wallet_id);
      const newBalance = updatedWallet.availableBalance;

      // Create transaction record
      const { error: txnError } = await admin
        .from('wallet_transactions')
        .insert({
          user_id: user_id,
          type: 'credit',
          amount: amount,
          currency: 'NGN',
          reference: `EMERGENCY-REFUND-${Date.now()}`,
          description: `Emergency refund: ${reason || 'Duplicate payment correction'}`,
          status: 'completed',
          metadata: {
            refund_type: 'emergency_admin_correction',
            refunded_by: user.id,
            emergency_refund: true
          }
        });

      if (txnError) {
        console.error('Warning: Could not create transaction record:', txnError);
      }

      // Update profile wallet balance
      await admin
        .from('profiles')
        .update({
          wallet_balance: newBalance
        })
        .eq('id', user_id);

      return NextResponse.json({
        success: true,
        message: `Emergency refund successful! Refunded ₦${amount.toLocaleString()} to ${userProfile.full_name || userProfile.email}. New balance: ₦${newBalance.toLocaleString()}`,
        newBalance,
        previousBalance: newBalance - amount
      });

    } catch (embedlyError) {
      console.error('Emergency refund failed:', embedlyError);
      return NextResponse.json(
        { 
          error: 'Refund failed',
          details: embedlyError instanceof Error ? embedlyError.message : 'Unknown Embedly error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Emergency refund error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
