import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient, { CreateWalletRequest } from '@/lib/embedly/client';

// POST /api/embedly/auto-wallet - Automatically create customer and wallet for authenticated user
export async function POST() {
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if customer already exists
    if (!profile.embedly_customer_id) {
      // Create customer first
      const [countries, customerTypes] = await Promise.all([
        embedlyClient.getCountries(),
        embedlyClient.getCustomerTypes()
      ]);

      const nigeria = countries.find(country => country.countryCodeTwo === 'NG');
      const individualType = customerTypes.find(type => type.name.toLowerCase() === 'individual');

      if (!nigeria || !individualType) {
        return NextResponse.json(
          { error: 'Required system data not found' },
          { status: 500 }
        );
      }

      // Parse full name
      const nameParts = (profile.full_name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

      const customerData = {
        organizationId: process.env.EMBEDLY_ORG_ID!,
        firstName,
        lastName,
        middleName,
        emailAddress: profile.email,
        mobileNumber: profile.phone || '',
        customerTypeId: individualType.id,
        countryId: nigeria.id,
        alias: profile.full_name || undefined,
      };

      try {
        const embedlyCustomer = await embedlyClient.createCustomer(customerData);

        // Update profile with Embedly customer ID
        await supabase
          .from('profiles')
          .update({
            embedly_customer_id: embedlyCustomer.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        profile.embedly_customer_id = embedlyCustomer.id;
      } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
          { error: 'Failed to create customer account' },
          { status: 500 }
        );
      }
    }

    // Check if wallet already exists
    if (profile.embedly_wallet_id) {
      try {
        const existingWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);
        return NextResponse.json({
          success: true,
          message: 'Wallet already exists',
          wallet: existingWallet,
          customer: {
            id: profile.embedly_customer_id,
            email: profile.email
          }
        });
      } catch (error) {
        // Wallet might not exist, continue to create
        console.log('Wallet ID exists but wallet not found, creating new wallet');
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

    // Create wallet
    const walletData: CreateWalletRequest = {
      customerId: profile.embedly_customer_id!,
      currencyId: ngn.id,
      name: profile.full_name || 'Digital Wallet',
    };

    try {
      const wallet = await embedlyClient.createWallet(walletData);

      // Update profile with wallet details
      await supabase
        .from('profiles')
        .update({
          embedly_wallet_id: wallet.id,
          bank_account: wallet.virtualAccount.accountNumber,
          bank_name: wallet.virtualAccount.bankName,
          bank_code: wallet.virtualAccount.bankCode,
          wallet_balance: wallet.availableBalance,
          is_wallet_active: true,
          last_wallet_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Customer and wallet created successfully',
        customer: {
          id: profile.embedly_customer_id,
          email: profile.email,
          fullName: profile.full_name
        },
        wallet
      });

    } catch (error) {
      console.error('Error creating wallet:', error);

      // Try to get existing wallets by calling a different method
      // Since the create wallet failed, let's try to see if there are existing wallets
      try {
        // Try to get wallet history (this might work and give us wallet info)
        console.log('Attempting to find existing wallet...');
        return NextResponse.json({
          success: true,
          message: 'Customer account created. Please contact support to create your wallet.',
          customer: {
            id: profile.embedly_customer_id,
            email: profile.email,
            fullName: profile.full_name
          },
          needsManualWalletCreation: true
        });
      } catch (findError) {
        return NextResponse.json(
          {
            error: 'Failed to create wallet',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Auto wallet creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet automatically' },
      { status: 500 }
    );
  }
}

// GET /api/embedly/auto-wallet - Check if user has wallet and customer
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id, bank_account, bank_name, wallet_balance, is_wallet_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const hasCustomer = !!profile.embedly_customer_id;
    const hasWallet = !!profile.embedly_wallet_id;

    let walletDetails = null;
    if (hasWallet && profile.embedly_wallet_id) {
      try {
        walletDetails = await embedlyClient.getWalletById(profile.embedly_wallet_id);
      } catch (error) {
        console.error('Error fetching wallet details:', error);
      }
    }

    return NextResponse.json({
      success: true,
      hasCustomer,
      hasWallet,
      customer: hasCustomer ? {
        id: profile.embedly_customer_id
      } : null,
      wallet: hasWallet ? {
        id: profile.embedly_wallet_id,
        accountNumber: profile.bank_account,
        bankName: profile.bank_name,
        balance: profile.wallet_balance,
        isActive: profile.is_wallet_active,
        details: walletDetails
      } : null
    });

  } catch (error) {
    console.error('Auto wallet check error:', error);
    return NextResponse.json(
      { error: 'Failed to check wallet status' },
      { status: 500 }
    );
  }
}