import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import embedlyClient from '@/lib/embedly/client'

// GET /api/embedly/wallet-details - Get full wallet details from Embedly
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

    // Get user's wallet ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('embedly_wallet_id, embedly_customer_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'Wallet not found in profile' },
        { status: 404 }
      );
    }

    console.log(`Fetching wallet details for: ${profile.embedly_wallet_id}`);

    // Fetch full wallet details from Embedly
    const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

    // Analyze wallet status
    const isActive = wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active');

    const analysis: any = {
      wallet: {
        id: wallet.id,
        name: wallet.name,
        availableBalance: wallet.availableBalance,
        ledgerBalance: wallet.ledgerBalance,
        currency: wallet.currencyId,
        isActive: wallet.isActive,
        status: wallet.status,
        isDefault: wallet.isDefault
      },
      virtualAccount: {
        accountNumber: wallet.virtualAccount?.accountNumber || null,
        bankCode: wallet.virtualAccount?.bankCode || null,
        bankName: wallet.virtualAccount?.bankName || null,
        hasVirtualAccount: !!wallet.virtualAccount?.accountNumber
      },
      analysis: {
        canMakePayments: isActive,
        issue: !isActive ? 'WALLET_INACTIVE' : null,
        hasVirtualAccount: !!wallet.virtualAccount?.accountNumber,
        recommendations: [] as string[]
      }
    };

    // Provide recommendations based on status
    if (!isActive) {
      if (wallet.status) {
        analysis.analysis.recommendations.push(`Wallet status is: "${wallet.status}"`);
      }
      if (!wallet.isActive) {
        analysis.analysis.recommendations.push('Wallet isActive flag is false');
      }
      if (!wallet.virtualAccount?.accountNumber) {
        analysis.analysis.recommendations.push('No virtual account assigned');
      }

      analysis.analysis.recommendations.push('Contact Embedly support to activate wallet');
      analysis.analysis.recommendations.push('Or create a new wallet if this one cannot be activated');
    }

    // Check wallet history to see recent activity
    try {
      const history = await embedlyClient.getWalletHistory(profile.embedly_wallet_id);
      analysis.analysis.recentTransactions = {
        count: history.length,
        lastTransaction: history.length > 0 ? {
          date: history[0].dateCreated,
          amount: history[0].amount,
          type: history[0].debitCreditIndicator,
          reference: history[0].transactionReference
        } : null
      };
    } catch (historyError) {
      analysis.analysis.recentTransactions = {
        error: 'Could not fetch history'
      };
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Wallet details error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch wallet details',
        details: error.message,
        suggestion: 'Your wallet may have been deleted or the ID is invalid'
      },
      { status: 500 }
    );
  }
}
