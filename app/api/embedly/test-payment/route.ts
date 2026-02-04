import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import embedlyClient from '@/lib/embedly/client'

// POST /api/embedly/test-payment - Test wallet payment flow without actually processing
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const { order_id, amount } = body;

    if (!order_id || !amount) {
      return NextResponse.json(
        { error: 'order_id and amount are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.embedly_wallet_id) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }

    // Fetch wallet from Embedly
    const wallet = await embedlyClient.getWalletById(profile.embedly_wallet_id);

    const isWalletActive = wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active');

    // Get order details
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, total, status, payment_status')
      .eq('id', order_id)
      .single();

    const diagnostics = {
      user: {
        id: user.id,
        email: profile.email
      },
      wallet: {
        id: wallet.id,
        name: wallet.name,
        embedlyIsActive: wallet.isActive,
        embedlyStatus: wallet.status,
        calculatedIsActive: isWalletActive,
        databaseIsActive: profile.is_wallet_active,
        availableBalance: wallet.availableBalance,
        ledgerBalance: wallet.ledgerBalance,
        accountNumber: wallet.virtualAccount.accountNumber
      },
      order: {
        id: order?.id,
        orderNumber: order?.order_number,
        total: order?.total,
        status: order?.status,
        paymentStatus: order?.payment_status
      },
      paymentTest: {
        requestedAmount: amount,
        walletBalance: wallet.availableBalance,
        sufficientFunds: wallet.availableBalance >= amount,
        difference: wallet.availableBalance - amount,
        canPay: isWalletActive && (wallet.availableBalance >= amount)
      },
      checks: {
        walletActive: isWalletActive ? '✅ PASS' : '❌ FAIL',
        sufficientBalance: wallet.availableBalance >= amount ? '✅ PASS' : '❌ FAIL',
        orderExists: !!order ? '✅ PASS' : '❌ FAIL',
        orderNotPaid: order?.payment_status !== 'paid' ? '✅ PASS' : '❌ ALREADY PAID'
      },
      recommendation: '',
      nextSteps: [] as string[]
    };

    // Build recommendation
    if (!diagnostics.paymentTest.canPay) {
      if (!isWalletActive) {
        diagnostics.recommendation = 'Wallet is inactive in Embedly';
        diagnostics.nextSteps.push('1. Contact Embedly support');
        diagnostics.nextSteps.push('2. Or create a new wallet');
      } else if (wallet.availableBalance < amount) {
        diagnostics.recommendation = 'Insufficient wallet balance';
        diagnostics.nextSteps.push(`1. You need ₦${amount - wallet.availableBalance} more`);
        diagnostics.nextSteps.push(`2. Current balance: ₦${wallet.availableBalance}`);
        diagnostics.nextSteps.push(`3. Fund your wallet at: ${wallet.virtualAccount.accountNumber}`);
      }
    } else {
      diagnostics.recommendation = 'Payment should succeed!';
      diagnostics.nextSteps.push('1. All checks passed');
      diagnostics.nextSteps.push('2. Try wallet payment again');
      diagnostics.nextSteps.push('3. If still fails, check server logs');
    }

    return NextResponse.json({
      success: true,
      diagnostics
    });

  } catch (error: any) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
