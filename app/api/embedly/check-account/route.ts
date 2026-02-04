import { NextRequest, NextResponse } from 'next/server'
import embedlyClient from '@/lib/embedly/client'

// GET /api/embedly/check-account?accountNumber=xxx - Check wallet by account number
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountNumber = searchParams.get('accountNumber')

    if (!accountNumber) {
      return NextResponse.json(
        { error: 'accountNumber parameter is required' },
        { status: 400 }
      )
    }

    console.log(`Checking wallet for account: ${accountNumber}`)

    // Fetch wallet by account number from Embedly
    const wallet = await embedlyClient.getWalletByAccountNumber(accountNumber)

    // Check if wallet is active
    const isActive = wallet.isActive !== false &&
      (!wallet.status || wallet.status.toLowerCase() === 'active')

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        customerId: wallet.customerId,
        walletGroupId: wallet.walletGroupId,
        availableBalance: wallet.availableBalance,
        ledgerBalance: wallet.ledgerBalance,
        currency: wallet.currencyId,
        isActive: isActive,
        status: wallet.status,
        isDefault: wallet.isDefault,
        virtualAccount: {
          accountNumber: wallet.virtualAccount.accountNumber,
          bankCode: wallet.virtualAccount.bankCode,
          bankName: wallet.virtualAccount.bankName
        },
        canMakePayments: isActive
      },
      summary: {
        account: wallet.virtualAccount.accountNumber,
        bank: wallet.virtualAccount.bankName,
        balance: `₦${wallet.availableBalance.toLocaleString()}`,
        status: isActive ? '✅ ACTIVE' : '❌ INACTIVE',
        canPay: isActive ? 'Yes' : 'No'
      }
    })

  } catch (error: any) {
    console.error('Check account error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check account',
        details: error.message,
        suggestion: 'The account number may not exist or there might be a connection issue'
      },
      { status: 500 }
    )
  }
}
