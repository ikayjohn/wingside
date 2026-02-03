import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import embedlyClient from '@/lib/embedly/client';

// GET /api/admin/wallet-transactions/cleanup - Get cleanup candidates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Build query - try with join first
    let query = admin
      .from('wallet_transactions')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          embedly_wallet_id,
          wallet_balance
        )
      `)
      .in('status', ['pending', 'failed'])
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    let { data: transactions, error } = await query;

    // If join fails, fallback to query without profiles
    if (error) {
      console.error('Error with profiles join, trying without:', error);
      
      const fallbackQuery = admin
        .from('wallet_transactions')
        .select('*')
        .in('status', ['pending', 'failed'])
        .order('created_at', { ascending: false });

      if (userId) {
        fallbackQuery.eq('user_id', userId);
      }

      const fallbackResult = await fallbackQuery;
      transactions = fallbackResult.data;
      error = fallbackResult.error;
    }

    // For transactions without proper profile join, fetch order details
    if (transactions && transactions.length > 0) {
      const orderIds = transactions
        .filter((t: any) => t.metadata?.order_id)
        .map((t: any) => t.metadata?.order_id)
        .filter(Boolean);

      if (orderIds.length > 0) {
        // Fetch orders with user_id to get actual account information
        const { data: orders } = await admin
          .from('orders')
          .select('id, customer_name, customer_email, user_id')
          .in('id', orderIds);

        // Create maps for quick lookup
        const orderMap = (orders || []).reduce((acc: any, order: any) => {
          acc[order.id] = order;
          return acc;
        }, {});

        // Get user_ids from orders to fetch profiles
        const userIds = orders
          ?.map((o: any) => o.user_id)
          .filter(Boolean);

        let profileMap: any = {};
        if (userIds && userIds.length > 0) {
          const { data: profiles } = await admin
            .from('profiles')
            .select('id, full_name, email, embedly_wallet_id, wallet_balance')
            .in('id', userIds);

          profileMap = (profiles || []).reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }

        // Enhance transactions with actual user/profile info
        transactions = transactions.map((txn: any) => {
          // If no profile from join but has order_id, try to get user info
          if ((!txn.profiles || Object.keys(txn.profiles).length === 0) && txn.metadata?.order_id) {
            const order = orderMap[txn.metadata.order_id];
            
            if (order) {
              // If order has user_id, get their profile
              if (order.user_id && profileMap[order.user_id]) {
                const profile = profileMap[order.user_id];
                return {
                  ...txn,
                  user_id: order.user_id, // Update with actual user_id
                  profiles: {
                    full_name: profile.full_name,
                    email: profile.email,
                    embedly_wallet_id: profile.embedly_wallet_id,
                    wallet_balance: profile.wallet_balance
                  }
                };
              }
              
              // Otherwise use order customer info as guest
              return {
                ...txn,
                profiles: {
                  full_name: order.customer_name,
                  email: order.customer_email
                }
              };
            }
          }
          return txn;
        });
      }
    }

    if (error) {
      console.error('Error fetching cleanup candidates:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json(
          { 
            error: 'Wallet transactions table not found',
            details: 'The wallet_transactions table does not exist in the database'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch transactions', details: error.message },
        { status: 500 }
      );
    }

    // Group transactions by user for easier analysis
    const userGroups = transactions?.reduce((acc: any, txn: any) => {
      const uid = txn.user_id;
      if (!acc[uid]) {
        // If profile exists, use it; otherwise use "Unknown"
        const hasProfile = txn.profiles && Object.keys(txn.profiles).length > 0;
        
        acc[uid] = {
          user_id: uid,
          full_name: hasProfile ? (txn.profiles.full_name || 'Unknown') : 'Guest Customer',
          email: hasProfile ? (txn.profiles.email || 'No email') : 'Guest (no account)',
          embedly_wallet_id: txn.profiles?.embedly_wallet_id || 'N/A',
          wallet_balance: txn.profiles?.wallet_balance || 0,
          is_guest: !hasProfile,
          transactions: []
        };
      }
      acc[uid].transactions.push(txn);
      return acc;
    }, {}) || {};

    // Analyze for potential issues
    const analysis = {
      totalTransactions: transactions?.length || 0,
      pendingTransactions: transactions?.filter((t: any) => t.status === 'pending').length || 0,
      failedTransactions: transactions?.filter((t: any) => t.status === 'failed').length || 0,
      usersWithIssues: Object.keys(userGroups).length,
      userGroups: Object.values(userGroups)
    };

    // Detect potential duplicate transactions
    const duplicates: any[] = [];
    const transactionGroups = transactions?.reduce((acc: any, t: any) => {
      const key = `${t.user_id}-${t.amount}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});

    Object.values(transactionGroups || {}).forEach((group: any) => {
      if (Array.isArray(group) && group.length > 1) {
        // Find the oldest completed one (likely legitimate)
        const completed = group.filter((t: any) => t.status === 'completed').sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Mark pending ones as potential duplicates
        const pending = group.filter((t: any) => t.status === 'pending');
        if (completed.length > 0 && pending.length > 0) {
          pending.forEach((p: any) => {
            duplicates.push({
              ...p,
              is_duplicate: true,
              likely_legitimate_transaction_id: completed[0].id
            });
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      analysis,
      transactions: transactions || [],
      duplicates
    });

  } catch (error) {
    console.error('Error in wallet cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/wallet-transactions/cleanup - Perform cleanup actions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { action, transaction_id, user_id, amount } = body;

    const admin = createAdminClient();

    if (action === 'delete_transaction') {
      // Delete a specific transaction
      const { error } = await admin
        .from('wallet_transactions')
        .delete()
        .eq('id', transaction_id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete transaction' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    }

    if (action === 'refund_to_wallet') {
      // Create a credit transaction to refund user
      if (!user_id || !amount) {
        return NextResponse.json(
          { error: 'user_id and amount are required for refund' },
          { status: 400 }
        );
      }

      // Get user's profile
      const { data: userProfile } = await admin
        .from('profiles')
        .select('full_name, embedly_wallet_id, email')
        .eq('id', user_id)
        .single();

      if (!userProfile?.embedly_wallet_id) {
        return NextResponse.json(
          { error: 'User does not have an Embedly wallet' },
          { status: 400 }
        );
      }

      // Get current wallet balance
      const wallet = await embedlyClient.getWalletById(userProfile.embedly_wallet_id);
      const currentBalance = wallet.availableBalance;

      // Create credit transaction
      const { data: creditTransaction, error: creditError } = await admin
        .from('wallet_transactions')
        .insert({
          user_id: user_id,
          type: 'credit',
          amount: amount,
          currency: 'NGN',
          reference: `REFUND-${Date.now()}`,
          description: `Refund for duplicate payment - Admin correction`,
          status: 'completed',
          balance_before: currentBalance,
          balance_after: currentBalance + amount,
          metadata: {
            refund_type: 'admin_correction',
            refunded_by: user.id
          }
        })
        .select()
        .single();

      if (creditError || !creditTransaction) {
        console.error('Error creating refund transaction:', creditError);
        return NextResponse.json(
          { error: 'Failed to create refund transaction' },
          { status: 500 }
        );
      }

      // Update profile wallet balance
      await admin
        .from('profiles')
        .update({
          wallet_balance: currentBalance + amount
        })
        .eq('id', user_id);

      return NextResponse.json({
        success: true,
        message: `Refunded ₦${amount.toLocaleString()} to ${userProfile.full_name || userProfile.email}`,
        transaction: creditTransaction
      });
    }

    if (action === 'refund_and_delete_pending') {
      // Refund AND delete a specific pending transaction (for duplicates)
      if (!transaction_id) {
        return NextResponse.json(
          { error: 'transaction_id is required' },
          { status: 400 }
        );
      }

      // Get the transaction details
      const { data: transaction } = await admin
        .from('wallet_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Get user's profile
      const { data: userProfile } = await admin
        .from('profiles')
        .select('full_name, embedly_wallet_id, email')
        .eq('id', transaction.user_id)
        .single();

      if (userProfile?.embedly_wallet_id) {
        // Get current wallet balance
        const wallet = await embedlyClient.getWalletById(userProfile.embedly_wallet_id);
        const currentBalance = wallet.availableBalance;

        // Create credit transaction
        const { data: creditTransaction, error: creditError } = await admin
          .from('wallet_transactions')
          .insert({
            user_id: transaction.user_id,
            type: 'credit',
            amount: transaction.amount,
            currency: 'NGN',
            reference: `REFUND-DUPLICATE-${Date.now()}`,
            description: `Refund for duplicate payment - Deleted pending transaction ${transaction.reference}`,
            status: 'completed',
            balance_before: currentBalance,
            balance_after: currentBalance + transaction.amount,
            metadata: {
              refund_type: 'duplicate_payment_correction',
              refunded_by: user.id,
              deleted_transaction_id: transaction_id
            }
          })
          .select()
          .single();

        if (creditError || !creditTransaction) {
          console.error('Error creating refund transaction:', creditError);
          return NextResponse.json(
            { error: 'Failed to create refund transaction' },
            { status: 500 }
          );
        }

        // Update profile wallet balance
        await admin
          .from('profiles')
          .update({
            wallet_balance: currentBalance + transaction.amount
          })
          .eq('id', transaction.user_id);
      }

      // Delete the pending transaction
      await admin
        .from('wallet_transactions')
        .delete()
        .eq('id', transaction_id);

      return NextResponse.json({
        success: true,
        message: `Refunded ₦${transaction.amount.toLocaleString()} and deleted duplicate pending transaction`
      });
    }

    if (action === 'delete_user_pending_transactions') {
      // Delete all pending transactions for a user
      if (!user_id) {
        return NextResponse.json(
          { error: 'user_id is required' },
          { status: 400 }
        );
      }

      const { data: deletedTxns, error } = await admin
        .from('wallet_transactions')
        .delete()
        .eq('user_id', user_id)
        .in('status', ['pending', 'failed'])
        .select();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete transactions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedTxns?.length || 0} transactions`,
        deletedTransactions: deletedTxns
      });
    }

    if (action === 'mark_completed') {
      // Mark a pending transaction as completed (if it actually succeeded)
      const { data: txn, error: fetchError } = await admin
        .from('wallet_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();

      if (fetchError || !txn) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      const { error: updateError } = await admin
        .from('wallet_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction_id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction marked as completed'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in wallet cleanup POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
