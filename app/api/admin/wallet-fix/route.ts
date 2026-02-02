import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient from '@/lib/embedly/client';

// POST /api/admin/wallet-fix - Admin endpoint to fix inactive wallet for any user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated admin user
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get target user's profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, embedly_customer_id, embedly_wallet_id, first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetProfile.embedly_customer_id) {
      return NextResponse.json(
        { error: 'User has no Embedly customer account' },
        { status: 400 }
      );
    }

    // Check if current wallet exists and get its status
    let currentWalletStatus = 'none';
    let currentWalletInfo: any = null;

    if (targetProfile.embedly_wallet_id) {
      try {
        const currentWallet = await embedlyClient.getWalletById(targetProfile.embedly_wallet_id);
        const isActive =
          currentWallet.isActive !== false &&
          (!currentWallet.status || currentWallet.status.toLowerCase() === 'active');

        currentWalletStatus = isActive ? 'active' : 'inactive';
        currentWalletInfo = {
          id: currentWallet.id,
          balance: currentWallet.availableBalance,
          status: currentWalletStatus,
          accountNumber: currentWallet.virtualAccount.accountNumber,
        };

        if (isActive) {
          return NextResponse.json(
            {
              error: 'Wallet is already active',
              walletInfo: currentWalletInfo
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error checking current wallet:', error);
        currentWalletStatus = 'error';
        // Continue with creating new wallet if current one can't be checked
      }
    }

    // Get currencies to find NGN
    const currencies = await embedlyClient.getCurrencies();
    const ngn = currencies.find(currency => currency.shortName === 'NGN');

    if (!ngn) {
      return NextResponse.json(
        { error: 'NGN currency not found in Embedly system' },
        { status: 500 }
      );
    }

    // Create new wallet
    console.log(`[Admin] Creating new wallet for user ${targetProfile.email} (ID: ${userId})`);
    console.log(`[Admin] Old wallet status: ${currentWalletStatus}`);

    const newWallet = await embedlyClient.createWallet({
      customerId: targetProfile.embedly_customer_id,
      currencyId: ngn.id,
      name: `${targetProfile.first_name} ${targetProfile.last_name}`,
    });

    // Update user's profile with new wallet ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_wallet_id: newWallet.id,
        wallet_balance: newWallet.availableBalance || 0,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with new wallet:', updateError);
      return NextResponse.json(
        {
          error: 'Wallet created but failed to update profile',
          details: updateError.message,
          walletId: newWallet.id
        },
        { status: 500 }
      );
    }

    console.log(`[Admin] ✅ New wallet created for ${targetProfile.email}: ${newWallet.id}`);

    return NextResponse.json({
      success: true,
      message: `New active wallet created for ${targetProfile.email}`,
      user: {
        id: targetProfile.id,
        email: targetProfile.email,
        name: `${targetProfile.first_name} ${targetProfile.last_name}`,
      },
      oldWallet: currentWalletInfo,
      newWallet: {
        id: newWallet.id,
        accountNumber: newWallet.virtualAccount.accountNumber,
        bankName: newWallet.virtualAccount.bankName,
        balance: newWallet.availableBalance,
      },
    });

  } catch (error: any) {
    console.error('[Admin] Wallet fix error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix wallet',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/wallet-fix?userId=xxx - Check wallet status for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated admin user
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, embedly_customer_id, embedly_wallet_id, first_name, last_name, email, wallet_balance')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result: any = {
      userId: targetProfile.id,
      email: targetProfile.email,
      hasCustomerId: !!targetProfile.embedly_customer_id,
      hasWalletId: !!targetProfile.embedly_wallet_id,
      cachedBalance: targetProfile.wallet_balance,
    };

    // Check wallet status if wallet ID exists
    if (targetProfile.embedly_wallet_id) {
      try {
        const wallet = await embedlyClient.getWalletById(targetProfile.embedly_wallet_id);
        const isActive =
          wallet.isActive !== false &&
          (!wallet.status || wallet.status.toLowerCase() === 'active');

        result.wallet = {
          id: wallet.id,
          status: isActive ? 'active' : 'inactive',
          balance: wallet.availableBalance,
          accountNumber: wallet.virtualAccount.accountNumber,
          bankName: wallet.virtualAccount.bankName,
          needsFix: !isActive,
        };
      } catch (error: any) {
        result.wallet = {
          id: targetProfile.embedly_wallet_id,
          status: 'error',
          error: error.message,
          needsFix: true,
        };
      }
    } else {
      result.wallet = {
        status: 'none',
        needsFix: true,
      };
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Admin] Wallet status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check wallet status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
