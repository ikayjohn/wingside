import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient, {
  WalletTransferRequest,
  InterBankTransferRequest
} from '@/lib/embedly/client';

// POST /api/embedly/transfers/wallet - Transfer between wallets
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

    const body = await request.json();
    const { type, amount, toAccount, remarks, bankCode, accountName } = body;

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('embedly_wallet_id, bank_account, full_name')
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
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      );
    }

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Transfer type and amount are required' },
        { status: 400 }
      );
    }

    // Generate transaction reference
    const transactionReference = `W2W${Date.now()}${Math.floor(Math.random() * 1000)}`;

    if (type === 'wallet') {
      // Wallet to wallet transfer
      if (!toAccount) {
        return NextResponse.json(
          { error: 'Recipient account number is required for wallet transfer' },
          { status: 400 }
        );
      }

      const transferData: WalletTransferRequest = {
        fromAccount: profile.bank_account!, // User's virtual account number
        toAccount,
        amount,
        transactionReference,
        remarks: remarks || `Transfer from ${profile.full_name || user.email}`,
      };

      try {
        await embedlyClient.walletToWalletTransfer(transferData);

        // Log transfer for tracking
        await supabase
          .from('transfer_logs')
          .insert({
            user_id: user.id,
            type: 'wallet',
            from_account: transferData.fromAccount,
            to_account: toAccount,
            amount,
            reference: transactionReference,
            remarks: transferData.remarks,
            status: 'pending',
            created_at: new Date().toISOString()
          });

        return NextResponse.json({
          success: true,
          message: 'Wallet transfer initiated successfully',
          transactionReference,
          amount,
          toAccount
        });

      } catch (error) {
        console.error('Wallet transfer error:', error);

        // Log failed transfer
        await supabase
          .from('transfer_logs')
          .insert({
            user_id: user.id,
            type: 'wallet',
            from_account: transferData.fromAccount,
            to_account: toAccount,
            amount,
            reference: transactionReference,
            remarks: transferData.remarks,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            created_at: new Date().toISOString()
          });

        return NextResponse.json(
          {
            error: 'Failed to process wallet transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }

    } else if (type === 'interbank') {
      // Interbank transfer
      if (!bankCode || !toAccount || !accountName) {
        return NextResponse.json(
          { error: 'Bank code, recipient account number, and account name are required for interbank transfer' },
          { status: 400 }
        );
      }

      // Verify account name
      try {
        const nameEnquiry = await embedlyClient.nameEnquiry(bankCode, toAccount);
        if (nameEnquiry.accountName.toLowerCase() !== accountName.toLowerCase()) {
          return NextResponse.json(
            { error: 'Account name does not match. Please verify the account details.' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to verify account name. Please check the account details.' },
          { status: 400 }
        );
      }

      const transferData: InterBankTransferRequest = {
        destinationBankCode: bankCode,
        destinationAccountNumber: toAccount,
        destinationAccountName: accountName,
        sourceAccountNumber: profile.bank_account!,
        sourceAccountName: profile.full_name || user.email,
        remarks: remarks || `Transfer from ${profile.full_name || user.email}`,
        amount,
        currencyId: 'fd5e474d-bb42-4db1-ab74-e8d2a01047e9', // NGN currency ID (you might want to get this dynamically)
        customerTransactionReference: transactionReference,
      };

      try {
        const providerReference = await embedlyClient.interBankTransfer(transferData);

        // Log transfer for tracking
        await supabase
          .from('transfer_logs')
          .insert({
            user_id: user.id,
            type: 'interbank',
            from_account: transferData.sourceAccountNumber,
            to_account: toAccount,
            bank_code: bankCode,
            amount,
            reference: transactionReference,
            provider_reference: providerReference,
            remarks: transferData.remarks,
            status: 'pending',
            created_at: new Date().toISOString()
          });

        return NextResponse.json({
          success: true,
          message: 'Interbank transfer initiated successfully',
          transactionReference,
          providerReference,
          amount,
          destinationAccount: toAccount,
          destinationBank: bankCode
        });

      } catch (error) {
        console.error('Interbank transfer error:', error);

        // Log failed transfer
        await supabase
          .from('transfer_logs')
          .insert({
            user_id: user.id,
            type: 'interbank',
            from_account: transferData.sourceAccountNumber,
            to_account: toAccount,
            bank_code: bankCode,
            amount,
            reference: transactionReference,
            remarks: transferData.remarks,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            created_at: new Date().toISOString()
          });

        return NextResponse.json(
          {
            error: 'Failed to process interbank transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid transfer type. Must be "wallet" or "interbank"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Transfer processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}

// GET /api/embedly/transfers/status - Get transfer status
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

    const { searchParams } = new URL(request.url);
    const transactionReference = searchParams.get('reference');
    const transferType = searchParams.get('type');

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    try {
      let status;

      if (transferType === 'interbank') {
        status = await embedlyClient.getInterBankTransferStatus(transactionReference);
      } else {
        status = await embedlyClient.getTransferStatus(transactionReference);
      }

      // Update transfer log if it exists
      if (status.status !== 'pending') {
        await supabase
          .from('transfer_logs')
          .update({
            status: status.status.toLowerCase(),
            updated_at: new Date().toISOString()
          })
          .eq('reference', transactionReference)
          .eq('user_id', user.id);
      }

      return NextResponse.json({
        success: true,
        status,
        transactionReference
      });

    } catch (error) {
      console.error('Transfer status check error:', error);
      return NextResponse.json(
        {
          error: 'Failed to check transfer status',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Transfer status error:', error);
    return NextResponse.json(
      { error: 'Failed to check transfer status' },
      { status: 500 }
    );
  }
}