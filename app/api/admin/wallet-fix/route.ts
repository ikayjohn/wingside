import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission, UserRole } from '@/lib/permissions';
import embedlyClient from '@/lib/embedly/client';
import { createWallet } from '@/lib/integrations/embedly';

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

    if (!hasPermission(profile?.role as UserRole, 'wallet_transactions', 'full')) {
      return NextResponse.json(
        { error: 'Forbidden' },
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

    // Get target user's profile (use admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, embedly_customer_id, embedly_wallet_id, full_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: `User not found (${profileError?.message || 'no rows'})` },
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
        let currentWallet: any;
        try {
          currentWallet = await embedlyClient.getWalletById(targetProfile.embedly_wallet_id);
        } catch (byIdError: any) {
          // Stored value may be a bank account number, not a wallet UUID — try account number lookup
          if (byIdError.message?.includes('Invalid Wallet ID') || byIdError.message?.includes('invalid')) {
            console.log(`[Admin] Wallet ID "${targetProfile.embedly_wallet_id}" rejected — trying account number lookup`);
            currentWallet = await embedlyClient.getWalletByAccountNumber(targetProfile.embedly_wallet_id);
            // Auto-correct the profile so the real UUID is stored
            await adminClient.from('profiles').update({ embedly_wallet_id: currentWallet.id }).eq('id', userId);
            console.log(`[Admin] Auto-corrected wallet ID: ${targetProfile.embedly_wallet_id} → ${currentWallet.id}`);
          } else {
            throw byIdError;
          }
        }

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
              success: true,
              message: 'Wallet is already active (profile has been corrected with real wallet ID)',
              walletInfo: currentWalletInfo
            },
            { status: 200 }
          );
        }
      } catch (error) {
        console.error('Error checking current wallet:', error);
        currentWalletStatus = 'error';
        // Continue with creating new wallet if current one can't be checked
      }
    }

    // Create (or recover existing) wallet — createWallet handles "Allowed number of wallets reached"
    // by scanning for the customer's existing wallet via multiple fallback strategies
    console.log(`[Admin] Creating/recovering wallet for user ${targetProfile.email} (ID: ${userId})`);
    console.log(`[Admin] Old wallet status: ${currentWalletStatus}`);

    const walletResult = await createWallet(targetProfile.embedly_customer_id, targetProfile.full_name);

    if (!walletResult.walletId) {
      return NextResponse.json(
        { error: 'Wallet creation returned no ID' },
        { status: 500 }
      );
    }

    // Update user's profile with wallet ID and virtual account details
    const updatePayload: any = {
      embedly_wallet_id: walletResult.walletId,
      is_wallet_active: true,
      last_wallet_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (walletResult.bankAccount) updatePayload.bank_account = walletResult.bankAccount;
    if (walletResult.bankName)    updatePayload.bank_name    = walletResult.bankName;
    if (walletResult.bankCode)    updatePayload.bank_code    = walletResult.bankCode;

    const { error: updateError } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with wallet:', updateError);
      return NextResponse.json(
        {
          error: 'Wallet found but failed to update profile',
          details: updateError.message,
          walletId: walletResult.walletId,
        },
        { status: 500 }
      );
    }

    console.log(`[Admin] ✅ Wallet ready for ${targetProfile.email}: ${walletResult.walletId}`);

    return NextResponse.json({
      success: true,
      message: `Wallet ready for ${targetProfile.email}`,
      user: {
        id: targetProfile.id,
        email: targetProfile.email,
        name: targetProfile.full_name,
      },
      oldWallet: currentWalletInfo,
      newWallet: {
        id: walletResult.walletId,
        accountNumber: walletResult.bankAccount,
        bankName: walletResult.bankName,
      },
    });

  } catch (error: any) {
    console.error('[Admin] Wallet fix error:', error);
    const msg: string = error.message || '';
    if (msg.includes('Allowed number of wallets reached')) {
      return NextResponse.json(
        { error: 'Customer already has a wallet in Embedly but it could not be fetched automatically. Find their wallet UUID in the Embedly dashboard and use "Set Wallet ID" on the sync page to save it manually.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Failed to fix wallet: ${msg}` },
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

    if (!hasPermission(profile?.role as UserRole, 'wallet_transactions', 'full')) {
      return NextResponse.json(
        { error: 'Forbidden' },
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

    // Get user's profile (use admin client to bypass RLS)
    const adminClient = createAdminClient();
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, embedly_customer_id, embedly_wallet_id, full_name, email, wallet_balance')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: `User not found (${profileError?.message || 'no rows'})` },
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
        let wallet: any;
        let corrected = false;
        try {
          wallet = await embedlyClient.getWalletById(targetProfile.embedly_wallet_id);
        } catch (byIdError: any) {
          // Stored value may be a bank account number — try account number lookup
          if (byIdError.message?.includes('Invalid Wallet ID') || byIdError.message?.includes('invalid')) {
            console.log(`[Admin] GET: Wallet ID "${targetProfile.embedly_wallet_id}" invalid — trying account number lookup`);
            wallet = await embedlyClient.getWalletByAccountNumber(targetProfile.embedly_wallet_id);
            // Auto-correct the profile with the real UUID
            await adminClient.from('profiles').update({ embedly_wallet_id: wallet.id }).eq('id', userId);
            corrected = true;
            console.log(`[Admin] GET: Auto-corrected wallet ID → ${wallet.id}`);
          } else {
            throw byIdError;
          }
        }

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
          ...(corrected && { note: 'Wallet ID was a bank account number — profile has been auto-corrected with the real wallet UUID' }),
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

// PUT /api/admin/wallet-fix - Link wallet by account number (NUBAN visible in Embedly dashboard)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!hasPermission(profile?.role as UserRole, 'wallet_transactions', 'full')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { userId, accountNumber } = body;
    if (!userId || !accountNumber) {
      return NextResponse.json({ error: 'userId and accountNumber are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify user exists
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, embedly_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Look up wallet by account number to get the real UUID
    let wallet;
    try {
      wallet = await embedlyClient.getWalletByAccountNumber(accountNumber.trim());
    } catch (lookupError: any) {
      return NextResponse.json(
        { error: `Account number not found in Embedly: ${lookupError.message}` },
        { status: 404 }
      );
    }

    if (!wallet?.id) {
      return NextResponse.json({ error: 'Embedly returned no wallet ID for that account number' }, { status: 404 });
    }

    // Optionally verify the wallet belongs to this customer
    if (wallet.customerId && targetProfile.embedly_customer_id && wallet.customerId !== targetProfile.embedly_customer_id) {
      return NextResponse.json(
        { error: `That account number belongs to a different customer (wallet customerId: ${wallet.customerId})` },
        { status: 409 }
      );
    }

    const isActive =
      wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active');

    const { error: updateError } = await adminClient.from('profiles').update({
      embedly_wallet_id: wallet.id,
      bank_account: wallet.virtualAccount?.accountNumber,
      bank_name: wallet.virtualAccount?.bankName,
      bank_code: wallet.virtualAccount?.bankCode,
      is_wallet_active: isActive,
      last_wallet_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update profile: ${updateError.message}` }, { status: 500 });
    }

    console.log(`[Admin] ✅ Wallet linked for ${targetProfile.email}: accountNumber ${accountNumber} → walletId ${wallet.id}`);

    return NextResponse.json({
      success: true,
      message: `Wallet linked for ${targetProfile.email}`,
      walletId: wallet.id,
      accountNumber: wallet.virtualAccount?.accountNumber,
      bankName: wallet.virtualAccount?.bankName,
      balance: wallet.availableBalance,
      status: isActive ? 'active' : 'inactive',
    });

  } catch (error: any) {
    console.error('[Admin] Wallet link error:', error);
    return NextResponse.json({ error: `Failed to link wallet: ${error.message}` }, { status: 500 });
  }
}
