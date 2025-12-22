import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient, { CreateWalletRequest, Currency } from '@/lib/embedly/client';

// GET /api/embedly/wallets - Get user's wallet details
export async function GET() {
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

    // Get user's profile with Embedly customer ID
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

    if (!profile.embedly_customer_id) {
      return NextResponse.json(
        { error: 'Customer account not created. Please create customer account first.' },
        { status: 400 }
      );
    }

    // Check if wallet already exists
    if (profile.embedly_wallet_id) {
      try {
        const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        return NextResponse.json({
          success: true,
          wallet,
          hasWallet: true
        });
      } catch (error) {
        console.error('Error fetching existing wallet:', error);
        // Continue to return no wallet status
      }
    }

    // No wallet found, but customer account exists
    return NextResponse.json({
      success: true,
      wallet: null,
      hasWallet: false,
      customerId: profile.embedly_customer_id
    });

  } catch (error) {
    console.error('Embedly wallet fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet details' },
      { status: 500 }
    );
  }
}

// POST /api/embedly/wallets - Create new wallet for user
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
      .select('embedly_customer_id, embedly_wallet_id, full_name')
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
        { error: 'Customer account not created. Please create customer account first.' },
        { status: 400 }
      );
    }

    if (profile.embedly_wallet_id) {
      try {
        const existingWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        return NextResponse.json({
          success: true,
          message: 'Wallet already exists',
          wallet: existingWallet
        });
      } catch (error) {
        // Wallet ID exists but wallet might not be accessible, continue to create new one
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

    // Prepare wallet data
    const walletData: CreateWalletRequest = {
      customerId: profile.embedly_customer_id,
      currencyId: ngn.id,
      name: profile.full_name || 'User Wallet',
    };

    // Create wallet in Embedly
    try {
      const wallet = await embedlyClient.createWallet(walletData);

      // Update profile with Embedly wallet ID and virtual account details
      await supabase
        .from('profiles')
        .update({
          embedly_wallet_id: wallet.id,
          bank_account: wallet.virtualAccount.accountNumber,
          bank_name: wallet.virtualAccount.bankName,
          bank_code: wallet.virtualAccount.bankCode,
          wallet_balance: wallet.availableBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Wallet created successfully',
        wallet
      });

    } catch (embedlyError) {
      console.error('Embedly wallet creation error:', embedlyError);
      return NextResponse.json(
        {
          error: 'Failed to create wallet in Embedly',
          details: embedlyError instanceof Error ? embedlyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Embedly wallet creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}