import { NextRequest, NextResponse } from 'next/server'
import embedlyClient from '@/lib/embedly/client'
import { createClient } from '@/lib/supabase/server'

// GET /api/embedly/test - Comprehensive Embedly wallet system test
export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    configuration: {} as any,
    apiTests: {} as any,
    customerTests: {} as any,
    walletTests: {} as any,
    errors: [] as string[]
  }

  try {
    // Test 1: Configuration Check
    results.configuration = {
      apiKey: process.env.EMBEDLY_API_KEY ? '✅ Set' : '❌ Missing',
      merchantWalletId: process.env.EMBEDLY_MERCHANT_WALLET_ID || 'Not set',
      hasValidMerchantWallet: process.env.EMBEDLY_MERCHANT_WALLET_ID &&
        process.env.EMBEDLY_MERCHANT_WALLET_ID !== 'placeholder-merchant-wallet-id',
      environment: process.env.NODE_ENV,
      baseUrl: process.env.EMBEDLY_BASE_URL || 'Using default (production)',
    }

    if (!process.env.EMBEDLY_API_KEY) {
      results.errors.push('❌ EMBEDLY_API_KEY not configured')
      return NextResponse.json(results, { status: 500 })
    }

    // Test 2: API Connection - Get Countries
    try {
      console.log('[Embedly Test] Testing API connection...')
      const countries = await embedlyClient.getCountries()
      results.apiTests.countries = {
        statusCode: 'success',
        count: countries.length,
        sample: countries.slice(0, 3).map((c: any) => c.name)
      }
      console.log(`✅ API connection working - Found ${countries.length} countries`)
    } catch (error: any) {
      results.apiTests.countries = {
        statusCode: 'failed',
        error: error.message
      }
      results.errors.push(`❌ API connection failed: ${error.message}`)
    }

    // Test 3: Get Currencies
    try {
      const currencies = await embedlyClient.getCurrencies()
      results.apiTests.currencies = {
        statusCode: 'success',
        count: currencies.length,
        ngn: currencies.find((c: any) => c.shortName === 'NGN')?.name || 'Not found'
      }
    } catch (error: any) {
      results.apiTests.currencies = {
        statusCode: 'failed',
        error: error.message
      }
    }

    // Test 4: Get Banks
    try {
      const banks = await embedlyClient.getBanks()
      results.apiTests.banks = {
        statusCode: 'success',
        count: banks.length,
        sample: banks.slice(0, 5).map((b: any) => `${b.bankcode} - ${b.bankname}`)
      }
    } catch (error: any) {
      results.apiTests.banks = {
        statusCode: 'failed',
        error: error.message
      }
    }

    // Test 5: Merchant Wallet Check
    if (process.env.EMBEDLY_MERCHANT_WALLET_ID &&
        process.env.EMBEDLY_MERCHANT_WALLET_ID !== 'placeholder-merchant-wallet-id') {
      try {
        console.log('[Embedly Test] Checking merchant wallet...')
        const merchantWallet = await embedlyClient.getWalletById(process.env.EMBEDLY_MERCHANT_WALLET_ID)
        results.walletTests.merchantWallet = {
          statusCode: 'success',
          walletId: merchantWallet.id,
          accountNumber: merchantWallet.virtualAccount.accountNumber,
          bankName: merchantWallet.virtualAccount.bankName,
          availableBalance: merchantWallet.availableBalance,
          ledgerBalance: merchantWallet.ledgerBalance,
          isActive: merchantWallet.isActive !== false && (!merchantWallet.status || merchantWallet.status.toLowerCase() === 'active')
        }
        console.log(`✅ Merchant wallet working - Balance: ₦${merchantWallet.availableBalance}`)
      } catch (error: any) {
        results.walletTests.merchantWallet = {
          statusCode: 'failed',
          error: error.message
        }
        results.errors.push(`⚠️  Merchant wallet check failed: ${error.message}`)
      }
    } else {
      results.walletTests.merchantWallet = {
        statusCode: 'skipped',
        message: 'Merchant wallet not configured (EMBEDLY_MERCHANT_WALLET_ID)'
      }
      results.errors.push('⚠️  EMBEDLY_MERCHANT_WALLET_ID not set - wallet payments will not work')
    }

    // Test 6: Check authenticated user's wallet (if logged in)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        console.log(`[Embedly Test] Checking wallet for authenticated user: ${user.id}`)

        const { data: profile } = await supabase
          .from('profiles')
          .select('embedly_customer_id, embedly_wallet_id, wallet_balance, email')
          .eq('id', user.id)
          .single()

        if (profile) {
          results.customerTests.userProfile = {
            authenticated: true,
            email: profile.email,
            hasCustomerId: !!profile.embedly_customer_id,
            hasWalletId: !!profile.embedly_wallet_id,
            customerId: profile.embedly_customer_id,
            walletId: profile.embedly_wallet_id,
            cachedBalance: profile.wallet_balance
          }

          // If user has wallet, check it
          if (profile.embedly_wallet_id) {
            try {
              const userWallet = await embedlyClient.getWalletById(profile.embedly_wallet_id)
              results.walletTests.userWallet = {
                statusCode: 'success',
                walletId: userWallet.id,
                accountNumber: userWallet.virtualAccount.accountNumber,
                bankName: userWallet.virtualAccount.bankName,
                availableBalance: userWallet.availableBalance,
                ledgerBalance: userWallet.ledgerBalance,
                isActive: userWallet.isActive !== false && (!userWallet.status || userWallet.status.toLowerCase() === 'active'),
                balanceMatch: userWallet.availableBalance === profile.wallet_balance
              }
              console.log(`✅ User wallet found - Balance: ₦${userWallet.availableBalance}`)

              // Test 7: Get Wallet History
              try {
                const history = await embedlyClient.getWalletHistory(profile.embedly_wallet_id)
                results.walletTests.userWallet.history = {
                  statusCode: 'success',
                  transactionCount: history.length,
                  recentTransactions: history.slice(0, 5).map((t: any) => ({
                    type: t.debitCreditIndicator,
                    amount: t.amount,
                    reference: t.transactionReference,
                    date: t.dateCreated
                  }))
                }
              } catch (historyError: any) {
                results.walletTests.userWallet.history = {
                  statusCode: 'failed',
                  error: historyError.message
                }
              }
            } catch (walletError: any) {
              results.walletTests.userWallet = {
                statusCode: 'failed',
                error: walletError.message
              }
              results.errors.push(`⚠️  User wallet check failed: ${walletError.message}`)
            }
          } else {
            results.walletTests.userWallet = {
              statusCode: 'skipped',
              message: 'User does not have a wallet yet'
            }
          }
        } else {
          results.customerTests.userProfile = {
            authenticated: true,
            error: 'Profile not found'
          }
        }
      } else {
        results.customerTests.userProfile = {
          authenticated: false,
          message: 'No authenticated user - cannot test user wallet'
        }
      }
    } catch (authError: any) {
      results.customerTests.userProfile = {
        authenticated: false,
        error: authError.message
      }
    }

    // Summary
    if (results.errors.length === 0) {
      results.errors.push('✅ All tests passed! Embedly integration is working correctly.')
    } else {
      const criticalErrors = results.errors.filter(e => e.includes('❌'))
      if (criticalErrors.length > 0) {
        results.errors.unshift(`⚠️  ${criticalErrors.length} critical error(s) found`)
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('[Embedly Test] Error:', error)
    results.errors.push(`❌ Exception: ${error.message}`)
    return NextResponse.json(results, { status: 500 })
  }
}
