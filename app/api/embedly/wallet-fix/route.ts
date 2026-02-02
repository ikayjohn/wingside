import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient from '@/lib/embedly/client';

// POST /api/embedly/wallet-fix - Fix inactive wallet by creating a new one
export async function POST(request: NextRequest) {
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
      .select('embedly_customer_id, embedly_wallet_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.embedly_customer_id) {
      return NextResponse.json(
        { error: 'No Embedly customer account found. Please create a wallet first.' },
        { status: 400 }
      );
    }

    // Check if current wallet exists and is inactive
    let currentWalletStatus = 'unknown';
    if (profile.embedly_wallet_id) {
      try {
        const currentWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        const isActive =
          currentWallet.isActive !== false &&
          (!currentWallet.status || currentWallet.status.toLowerCase() === 'active');
        currentWalletStatus = isActive ? 'active' : 'inactive';

        if (isActive) {
          return NextResponse.json(
            {
              error: 'Current wallet is already active',
              walletId: profile.embedly_wallet_id
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error checking current wallet:', error);
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
    console.log(`Creating new wallet for customer ${profile.embedly_customer_id} (old wallet: ${currentWalletStatus})`);

    const newWallet = await embedlyClient.createWallet({
      customerId: profile.embedly_customer_id,
      currencyId: ngn.id,
      name: `${profile.first_name} ${profile.last_name}`,
    });

    // Update profile with new wallet ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_wallet_id: newWallet.id,
        wallet_balance: newWallet.availableBalance || 0,
      })
      .eq('id', user.id);

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

    console.log(`✅ New wallet created: ${newWallet.id} (replaced ${profile.embedly_wallet_id || 'none'})`);

    return NextResponse.json({
      success: true,
      message: 'New active wallet created successfully',
      oldWalletId: profile.embedly_wallet_id,
      newWalletId: newWallet.id,
      accountNumber: newWallet.virtualAccount.accountNumber,
      bankName: newWallet.virtualAccount.bankName,
    });

  } catch (error: any) {
    console.error('Wallet fix error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix wallet',
        details: error.message
      },
      { status: 500 }
    );
  }
}
