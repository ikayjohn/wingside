import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient from '@/lib/embedly/client';

// GET /api/embedly/wallet-check - Check wallet configuration and balance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get user's profile with wallet info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id, wallet_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        details: profileError
      });
    }

    const diagnostics: any = {
      hasCustomerId: !!profile.embedly_customer_id,
      hasWalletId: !!profile.embedly_wallet_id,
      customerId: profile.embedly_customer_id,
      walletId: profile.embedly_wallet_id,
      cachedBalance: profile.wallet_balance,
      merchantWalletId: process.env.EMBEDLY_MERCHANT_WALLET_ID,
      hasMerchantWallet: !!process.env.EMBEDLY_MERCHANT_WALLET_ID,
      hasApiKey: !!process.env.EMBEDLY_API_KEY,
    };

    // Try to fetch wallet from Embedly
    if (profile.embedly_wallet_id) {
      try {
        const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        diagnostics.embedlyWallet = {
          found: true,
          availableBalance: wallet.availableBalance,
          ledgerBalance: wallet.ledgerBalance,
          accountNumber: wallet.virtualAccount.accountNumber,
          bankName: wallet.virtualAccount.bankName,
        };
      } catch (embedlyError: any) {
        diagnostics.embedlyWallet = {
          found: false,
          error: embedlyError.message || 'Failed to fetch wallet from Embedly',
        };
      }
    } else {
      diagnostics.embedlyWallet = {
        found: false,
        error: 'No wallet ID in profile',
      };
    }

    // Try to fetch merchant wallet
    if (process.env.EMBEDLY_MERCHANT_WALLET_ID) {
      try {
        const merchantWallet = await embedlyClient.getWalletById(process.env.EMBEDLY_MERCHANT_WALLET_ID);
        diagnostics.merchantWallet = {
          found: true,
          availableBalance: merchantWallet.availableBalance,
          accountNumber: merchantWallet.virtualAccount.accountNumber,
        };
      } catch (merchantError: any) {
        diagnostics.merchantWallet = {
          found: false,
          error: merchantError.message || 'Failed to fetch merchant wallet',
        };
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics
    });

  } catch (error: any) {
    console.error('Wallet check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check wallet configuration',
        details: error.message
      },
      { status: 500 }
    );
  }
}
