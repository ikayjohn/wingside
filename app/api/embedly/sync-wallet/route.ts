import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/sync-wallet - Sync wallet status from Embedly to database
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

    // Get user's wallet ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('embedly_wallet_id, embedly_customer_id, is_wallet_active, wallet_balance, bank_account, bank_name')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'Wallet not found in profile' },
        { status: 404 }
      );
    }

    console.log(`Syncing wallet ${profile.embedly_wallet_id} from Embedly...`);

    // Fetch current wallet status from Embedly
    const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

    // Determine if wallet is actually active in Embedly
    const embedlyIsActive = wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active');

    // Prepare update data
    const updateData: any = {
      wallet_balance: wallet.availableBalance,
      last_wallet_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update virtual account info if available
    if (wallet.virtualAccount?.accountNumber) {
      updateData.bank_account = wallet.virtualAccount.accountNumber;
      updateData.bank_code = wallet.virtualAccount.bankCode;
      updateData.bank_name = wallet.virtualAccount.bankName;
    }

    // Update active status based on Embedly's actual status
    updateData.is_wallet_active = embedlyIsActive;

    // Log what we're syncing
    console.log('Syncing wallet data:', {
      walletId: wallet.id,
      isActive: embedlyIsActive,
      balance: wallet.availableBalance,
      hasVirtualAccount: !!wallet.virtualAccount?.accountNumber
    });

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // Update profile with fresh data from Embedly
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to sync wallet data');
    }

    console.log('✅ Wallet synced successfully');

    // Return synced data
    return NextResponse.json({
      success: true,
      message: 'Wallet synced successfully',
      before: {
        isActive: profile.is_wallet_active,
        balance: profile.wallet_balance,
        bankAccount: profile.bank_account
      },
      after: {
        isActive: embedlyIsActive,
        balance: wallet.availableBalance,
        bankAccount: wallet.virtualAccount?.accountNumber || null,
        bankName: wallet.virtualAccount?.bankName || null
      },
      wallet: {
        id: wallet.id,
        name: wallet.name,
        availableBalance: wallet.availableBalance,
        ledgerBalance: wallet.ledgerBalance,
        isActive: embedlyIsActive,
        status: wallet.status,
        virtualAccount: wallet.virtualAccount
      },
      canPayWithWallet: embedlyIsActive
    });

  } catch (error: any) {
    console.error('Wallet sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync wallet',
        details: error.message
      },
      { status: 500 }
    );
  }
}
