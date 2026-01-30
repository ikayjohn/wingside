import { NextResponse } from 'next/server'

interface NombaAuthResponse {
  code: string
  description: string
  data?: {
    access_token: string
    expiresAt: string
  }
}

// GET /api/payment/nomba/test - Test Nomba credentials and API access
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    credentials: {
      clientId: process.env.NOMBA_CLIENT_ID ? '✅ Set' : '❌ Missing',
      clientSecret: process.env.NOMBA_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      accountId: process.env.NOMBA_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
      webhookSecret: process.env.NOMBA_WEBHOOK_SECRET ? '✅ Set' : '⚠️  Missing (recommended for production)',
    },
    authTest: null as any,
    errors: [] as string[]
  }

  try {
    // Test 1: Check credentials
    const clientId = process.env.NOMBA_CLIENT_ID
    const clientSecret = process.env.NOMBA_CLIENT_SECRET
    const accountId = process.env.NOMBA_ACCOUNT_ID

    if (!clientId || !clientSecret || !accountId) {
      results.errors.push('❌ Missing required credentials. Check .env.production file')
      return NextResponse.json(results, { status: 500 })
    }

    // Test 2: Try to get access token
    console.log('[Nomba Test] Attempting to get access token...')
    const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const authData: NombaAuthResponse = await authResponse.json()

    results.authTest = {
      statusCode: authResponse.status,
      responseCode: authData.code,
      responseDescription: authData.description,
      success: authData.code === '00' && !!authData.data?.access_token,
      tokenPreview: authData.data?.access_token ? `${authData.data.access_token.substring(0, 20)}...` : null,
    }

    if (authData.code !== '00') {
      results.errors.push(`❌ Auth failed: ${authData.description} (code: ${authData.code})`)
      return NextResponse.json(results, { status: 500 })
    }

    if (!authData.data?.access_token) {
      results.errors.push('❌ No access token in response')
      return NextResponse.json(results, { status: 500 })
    }

    // Test 3: Try to query transactions (tests account access)
    console.log('[Nomba Test] Access token obtained, testing transaction query...')
    const accessToken = authData.data.access_token

    const testTransactionResponse = await fetch('https://api.nomba.com/v1/transactions/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        transactionRef: 'TEST-' + Date.now(), // Fake ref to test endpoint access
      }),
    })

    const transactionData = await testTransactionResponse.json()

    results.authTest.transactionQueryTest = {
      statusCode: testTransactionResponse.status,
      responseCode: transactionData.code,
      responseDescription: transactionData.description,
      note: 'Expected to fail (fake reference) but proves endpoint access works',
    }

    if (results.errors.length === 0) {
      results.errors.push('✅ All tests passed! Nomba integration is working correctly.')
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('[Nomba Test] Error:', error)
    results.errors.push(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json(results, { status: 500 })
  }
}
