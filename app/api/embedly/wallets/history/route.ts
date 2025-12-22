import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient from '@/lib/embedly/client';

// GET /api/embedly/wallets/history - Get wallet transaction history
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
      .select('embedly_wallet_id, bank_account')
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get wallet history
    try {
      const transactions = await embedlyClient.getWalletHistory(profile.embedly_wallet_id);

      // Apply pagination and filtering
      const paginatedTransactions = transactions
        .slice(offset, offset + limit)
        .map(transaction => ({
          id: transaction.id,
          type: transaction.debitCreditIndicator === 'D' ? 'debit' : 'credit',
          amount: transaction.amount,
          balance: transaction.balance,
          description: transaction.remarks,
          reference: transaction.transactionReference,
          date: transaction.dateCreated,
          accountNumber: transaction.accountNumber,
          name: transaction.name,
        }));

      // Group transactions by date for better UI display
      const groupedTransactions = paginatedTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString('en-GB');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
      }, {} as Record<string, typeof paginatedTransactions>);

      return NextResponse.json({
        success: true,
        transactions: groupedTransactions,
        totalCount: transactions.length,
        hasMore: offset + limit < transactions.length,
        pagination: {
          limit,
          offset,
          currentCount: paginatedTransactions.length
        }
      });

    } catch (error) {
      console.error('Error fetching wallet history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wallet history' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Wallet history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet history' },
      { status: 500 }
    );
  }
}