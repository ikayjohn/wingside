import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/embedly/wallet-status - Check if user has wallet and provide helpful info
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id, bank_account, bank_name, wallet_balance, is_wallet_active, full_name, email, phone')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const diagnostics: any = {
      user: {
        id: user.id,
        email: profile.email,
        fullName: profile.full_name
      },
      wallet: {
        hasCustomerId: !!profile.embedly_customer_id,
        hasWalletId: !!profile.embedly_wallet_id,
        customerId: profile.embedly_customer_id,
        walletId: profile.embedly_wallet_id,
        bankAccount: profile.bank_account,
        bankName: profile.bank_name,
        balance: profile.wallet_balance,
        isActive: profile.is_wallet_active
      },
      configuration: {
        orgId: process.env.EMBEDLY_ORG_ID ? 'Set' : 'Missing',
        merchantWalletId: process.env.EMBEDLY_MERCHANT_WALLET_ID || 'Not set'
      },
      canPayWithWallet: !!(profile.embedly_wallet_id && profile.is_wallet_active),
      needsWalletCreation: !profile.embedly_wallet_id
    };

    // Provide actionable recommendations
    if (!profile.embedly_wallet_id) {
      diagnostics.recommendation = {
        action: 'create_wallet',
        message: 'You need to create a wallet before you can pay with it',
        endpoint: '/api/embedly/auto-wallet',
        method: 'POST',
        instructions: [
          '1. Call POST /api/embedly/auto-wallet to create your wallet',
          '2. Your wallet will be automatically created with a virtual account',
          '3. Fund your wallet via bank transfer to the virtual account',
          '4. Use wallet balance to pay for orders'
        ]
      };
    } else if (!profile.is_wallet_active) {
      diagnostics.recommendation = {
        action: 'activate_wallet',
        message: 'Your wallet exists but is not active',
        instructions: [
          '1. Contact support to activate your wallet',
          '2. Or create a new wallet if there\'s an issue with the current one'
        ]
      };
    } else if (profile.wallet_balance === 0 || profile.wallet_balance === null) {
      diagnostics.recommendation = {
        action: 'fund_wallet',
        message: 'Your wallet balance is low or zero',
        bankAccount: profile.bank_account,
        bankName: profile.bank_name,
        instructions: [
          `1. Transfer funds to your virtual account: ${profile.bank_account} (${profile.bank_name})`,
          '2. Your balance will be updated automatically',
          '3. Then proceed with payment'
        ]
      };
    } else {
      diagnostics.recommendation = {
        action: 'ready_to_pay',
        message: 'Your wallet is ready to use!',
        currentBalance: profile.wallet_balance
      };
    }

    return NextResponse.json({
      success: true,
      diagnostics
    });

  } catch (error: any) {
    console.error('Wallet status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check wallet status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
