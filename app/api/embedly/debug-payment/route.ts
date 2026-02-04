import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/debug-payment - Debug wallet payment with detailed logs
export async function POST(request: NextRequest) {
  const diagnosticLog: any = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
    error: null,
    finalResult: null
  }

  try {
    const supabase = await createClient();

    diagnosticLog.steps.push({ step: 1, action: 'Get authenticated user' })

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      diagnosticLog.steps.push({ step: 1, status: 'FAIL', error: 'Unauthorized' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    diagnosticLog.steps.push({ step: 1, status: 'PASS', userId: user.id })

    let body;
    try {
      body = await request.json();
      diagnosticLog.steps.push({ step: 2, status: 'PASS', body: { order_id: body.order_id, amount: body.amount } })
    } catch (error) {
      diagnosticLog.steps.push({ step: 2, status: 'FAIL', error: 'Invalid JSON' })
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { order_id, amount, remarks } = body;

    diagnosticLog.steps.push({
      step: 3,
      action: 'Get user profile',
      userId: user.id
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.embedly_wallet_id) {
      diagnosticLog.steps.push({ step: 3, status: 'FAIL', error: 'No wallet found' })
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    diagnosticLog.steps.push({ step: 3, status: 'PASS', walletId: profile.embedly_wallet_id })

    diagnosticLog.steps.push({ step: 4, action: 'Fetch wallet from Embedly' })

    const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

    diagnosticLog.steps.push({
      step: 4,
      status: 'PASS',
      walletId: wallet.id,
      balance: wallet.availableBalance,
      isActive: wallet.isActive
    })

    // Sync wallet status
    diagnosticLog.steps.push({ step: 5, action: 'Sync wallet status' })

    const admin = createAdminClient();
    const isWalletActive = wallet.isActive !== false && (!wallet.status || wallet.status.toLowerCase() === 'active')

    try {
      const syncData: any = {
        wallet_balance: wallet.availableBalance,
        is_wallet_active: isWalletActive,
        last_wallet_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (wallet.virtualAccount?.accountNumber) {
        syncData.bank_account = wallet.virtualAccount.accountNumber
        syncData.bank_code = wallet.virtualAccount.bankCode
        syncData.bank_name = wallet.virtualAccount.bankName
      }

      await admin.from('profiles').update(syncData).eq('id', user.id)

      diagnosticLog.steps.push({ step: 5, status: 'PASS', synced: true })
    } catch (syncError: any) {
      diagnosticLog.steps.push({ step: 5, status: 'WARN', error: syncError.message })
    }

    // Check balance
    diagnosticLog.steps.push({ step: 6, action: 'Check sufficient balance' })

    if (wallet.availableBalance < amount) {
      diagnosticLog.steps.push({ step: 6, status: 'FAIL', error: 'Insufficient balance', walletBalance: wallet.availableBalance, requestedAmount: amount })
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
    }

    diagnosticLog.steps.push({ step: 6, status: 'PASS', sufficient: true })

    // Try to create transaction
    diagnosticLog.steps.push({ step: 7, action: 'Create wallet transaction record' })

    const transactionReference = `ORDER-${order_id}-${Date.now()}`
    const initialBalance = wallet.availableBalance

    diagnosticLog.steps.push({
      step: 7,
      action: 'Insert into wallet_transactions',
      transactionData: {
        user_id: user.id,
        type: 'debit',
        amount: amount,
        currency: 'NGN',
        reference: transactionReference,
        description: remarks || `Payment for order ${order_id}`,
        status: 'pending',
        balance_before: initialBalance,
        balance_after: initialBalance - amount,
        metadata: {
          order_id,
          wallet_id: profile.embedly_wallet_id,
          payment_method: 'wallet'
        }
      }
    })

    try {
      const { data: transaction, error: transactionError } = await admin
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          amount: amount,
          currency: 'NGN',
          reference: transactionReference,
          description: remarks || `Payment for order ${order_id}`,
          status: 'pending',
          balance_before: initialBalance,
          balance_after: initialBalance - amount,
          metadata: {
            order_id,
            wallet_id: profile.embedly_wallet_id,
            payment_method: 'wallet'
          }
        })
        .select()
        .single()

      if (transactionError || !transaction) {
        diagnosticLog.steps.push({
          step: 7,
          status: 'FAIL',
          error: transactionError,
          transaction: transaction
        })

        return NextResponse.json({
          error: 'Failed to record wallet transaction',
          details: transactionError?.message || 'Unknown error',
          diagnostic: diagnosticLog
        }, { status: 500 })
      }

      diagnosticLog.steps.push({ step: 7, status: 'PASS', transactionId: transaction.id })

      // Clean up - delete the test transaction
      await admin.from('wallet_transactions').delete().eq('id', transaction.id)

      diagnosticLog.steps.push({ step: 8, action: 'Cleanup test transaction', status: 'DONE' })

      diagnosticLog.finalResult = {
        success: true,
        message: 'All checks passed! Payment should work.',
        wallet: {
          id: wallet.id,
          balance: wallet.availableBalance,
          isActive: isWalletActive
        },
        transaction: {
          reference: transactionReference,
          amount: amount
        }
      }

      return NextResponse.json({
        success: true,
        diagnostic: diagnosticLog
      })

    } catch (insertError: any) {
      diagnosticLog.error = insertError
      diagnosticLog.steps.push({
        step: 7,
        status: 'EXCEPTION',
        error: insertError.message,
        stack: insertError.stack
      })

      return NextResponse.json({
        error: 'Exception during transaction insert',
        details: insertError.message,
        diagnostic: diagnosticLog
      }, { status: 500 })
    }

  } catch (error: any) {
    diagnosticLog.error = error
    diagnosticLog.steps.push({
      step: 'FATAL',
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json({
      error: 'Fatal error in payment debug',
      details: error.message,
      diagnostic: diagnosticLog
    }, { status: 500 })
  }
}
