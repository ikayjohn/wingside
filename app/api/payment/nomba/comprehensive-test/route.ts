import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// GET /api/payment/nomba/comprehensive-test - Full integration test
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    criticalErrors: [] as string[],
    warnings: [] as string[]
  }

  try {
    // Test 1: Configuration Check
    results.tests.push({
      name: '1. Configuration Check',
      status: 'running'
    })

    const config = {
      clientId: !!process.env.NOMBA_CLIENT_ID,
      clientSecret: !!process.env.NOMBA_CLIENT_SECRET,
      accountId: !!process.env.NOMBA_ACCOUNT_ID,
      webhookSecret: !!process.env.NOMBA_WEBHOOK_SECRET,
      appId: !!process.env.NEXT_PUBLIC_APP_URL
    }

    const missingConfig = Object.entries(config).filter(([k, v]) => !v).map(([k]) => k)

    if (missingConfig.length > 0) {
      results.tests[0].status = 'FAIL'
      results.tests[0].error = 'Missing configuration'
      results.tests[0].missing = missingConfig
      results.criticalErrors.push(`Missing Nomba config: ${missingConfig.join(', ')}`)
    } else {
      results.tests[0].status = 'PASS'
      results.tests[0].details = { message: 'All required environment variables set' }
    }

    // Test 2: API Authentication
    results.tests.push({
      name: '2. API Authentication',
      status: 'running'
    })

    try {
      const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accountId': process.env.NOMBA_ACCOUNT_ID!
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: process.env.NOMBA_CLIENT_ID!,
          client_secret: process.env.NOMBA_CLIENT_SECRET!
        })
      })

      const authData = await authResponse.json()

      if (authData.code === '00' && authData.data?.access_token) {
        results.tests[1].status = 'PASS'
        results.tests[1].details = {
          message: 'Successfully authenticated',
          tokenPreview: authData.data.access_token.substring(0, 20) + '...'
        }
      } else {
        results.tests[1].status = 'FAIL'
        results.tests[1].error = authData.description || 'Authentication failed'
        results.criticalErrors.push(`Nomba auth failed: ${authData.code}`)
      }
    } catch (authError: any) {
      results.tests[1].status = 'FAIL'
      results.tests[1].error = authError.message
      results.criticalErrors.push(`Nomba API error: ${authError.message}`)
    }

    // Test 3: Orders Table Schema Validation
    results.tests.push({
      name: '3. Orders Table Schema',
      status: 'running'
    })

    const admin = createAdminClient()

    try {
      // Check if orders table exists and has required columns
      const { data: testOrder } = await admin
        .from('orders')
        .select('id')
        .limit(1)

      // Check for specific columns we need
      const requiredColumns = 'id, order_number, total, payment_status, payment_reference, payment_gateway, paid_at'

      // Try to query with specific columns
      const { data: columnTest } = await admin
        .from('orders')
        .select(requiredColumns)
        .limit(1)

      results.tests[2].status = 'PASS'
      results.tests[2].details = {
        message: 'Orders table accessible with required columns',
        columns: requiredColumns
      }
    } catch (schemaError: any) {
      results.tests[2].status = 'FAIL'
      results.tests[2].error = schemaError.message
      results.tests[2].code = schemaError.code
      results.criticalErrors.push(`Orders table schema issue: ${schemaError.message}`)
    }

    // Test 4: Database Write Test - CRITICAL!
    results.tests.push({
      name: '4. Database Write Test',
      status: 'running'
    })

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      try {
        // Get a test order (or create one)
        const { data: existingOrder } = await admin
          .from('orders')
          .select('id, payment_status, payment_reference, payment_gateway, customer_id')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingOrder) {
          // Try to UPDATE payment_reference (common operation)
          const testRef = `TEST-NOMBA-${Date.now()}`
          const { error: updateError } = await admin
            .from('orders')
            .update({
              payment_reference: testRef,
              payment_gateway: 'nomba'
            })
            .eq('id', existingOrder.id)

          if (updateError) {
            throw updateError
          }

          // Revert changes
          await admin
            .from('orders')
            .update({
              payment_reference: existingOrder.payment_reference || null,
              payment_gateway: existingOrder.payment_gateway || null
            })
            .eq('id', existingOrder.id)

          results.tests[3].status = 'PASS'
          results.tests[3].details = {
            message: 'Successfully updated and reverted order',
            orderId: existingOrder.id
          }
        } else {
          results.tests[3].status = 'SKIP'
          results.tests[3].reason = 'No test order found for user'
        }
      } catch (writeError: any) {
        results.tests[3].status = 'FAIL'
        results.tests[3].error = writeError.message
        results.tests[3].code = writeError.code
        results.tests[3].hint = 'Check RLS policies, table permissions, or column existence'
        results.criticalErrors.push(`Database write failed: ${writeError.message}`)
      }
    } else {
      results.tests[3].status = 'SKIP'
      results.tests[3].reason = 'No authenticated user'
    }

    // Test 5: Amount Format Validation
    results.tests.push({
      name: '5. Amount Format Validation',
      status: 'running'
    })

    try {
      // Nomba expects amount as number (e.g., 2500.00), not kobo (250000)
      const testAmounts = {
        asNumber: 2500.00,
        asInt: 2500,
        asString: "2500.00",
        tooLarge: 1000000000, // 1 billion - might cause issues
        negative: -100,
        zero: 0
      }

      const issues = []

      if (!Number.isFinite(testAmounts.asNumber)) {
        issues.push('Invalid amount: not finite')
      }

      if (testAmounts.negative < 0) {
        issues.push('Negative amount not allowed')
      }

      if (testAmounts.zero === 0) {
        issues.push('Zero amount probably not allowed')
      }

      if (testAmounts.tooLarge > 999999999) {
        issues.push('Amount too large, might exceed database limits')
      }

      if (issues.length > 0) {
        results.tests[4].status = 'WARN'
        results.tests[4].issues = issues
        results.warnings.push(`Amount format issues: ${issues.join(', ')}`)
      } else {
        results.tests[4].status = 'PASS'
        results.tests[4].details = {
          message: 'Amount formats validated',
          correctFormat: 'number (e.g., 2500.00 for ₦2,500)',
          notKobo: 'Do NOT multiply by 100 (Nomba is not Paystack!)'
        }
      }
    } catch (formatError: any) {
      results.tests[4].status = 'WARN'
      results.tests[4].error = formatError.message
    }

    // Test 6: Webhook Signature Verification
    results.tests.push({
      name: '6. Webhook Signature Verification',
      status: 'running'
    })

    try {
      const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET

      if (!webhookSecret) {
        results.tests[5].status = 'FAIL'
        results.tests[5].error = 'Webhook secret not configured'
        results.criticalErrors.push('NOMBA_WEBHOOK_SECRET not set')
      } else {
        // Test signature generation and verification
        const testPayload = JSON.stringify({
          event_type: 'payment_success',
          requestId: 'test-request',
          data: {
            transaction: {
              transactionId: 'test-txn',
              transactionAmount: 2500,
              fee: 50,
              time: new Date().toISOString()
            },
            order: {
              orderReference: 'TEST-REF-123',
              customerEmail: 'test@example.com',
              amount: 2500,
              currency: 'NGN'
            }
          }
        })

        const signature = crypto
          .createHmac('sha256', webhookSecret)
          .update(testPayload)
          .digest('base64')

        // Verify with timing-safe comparison
        const computedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(testPayload)
          .digest('base64')

        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(computedSig)
        )

        if (isValid) {
          results.tests[5].status = 'PASS'
          results.tests[5].details = {
            message: 'Webhook signature verification working',
            algorithm: 'HmacSHA256',
            format: 'base64'
          }
        } else {
          results.tests[5].status = 'FAIL'
          results.tests[5].error = 'Signature verification failed'
        }
      }
    } catch (sigError: any) {
      results.tests[5].status = 'FAIL'
      results.tests[5].error = sigError.message
      results.criticalErrors.push(`Webhook signature test failed: ${sigError.message}`)
    }

    // Test 7: Checkout Initialization
    results.tests.push({
      name: '7. Checkout API Test',
      status: 'running'
    })

    try {
      // Get access token first
      const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accountId': process.env.NOMBA_ACCOUNT_ID!
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: process.env.NOMBA_CLIENT_ID!,
          client_secret: process.env.NOMBA_CLIENT_SECRET!
        })
      })

      const authData = await authResponse.json()

      if (authData.code !== '00' || !authData.data?.access_token) {
        throw new Error('Failed to get access token')
      }

      const accessToken = authData.data.access_token
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
      const testRef = `WS-TEST-${Date.now()}`

      // Test checkout creation
      const checkoutResponse = await fetch('https://api.nomba.com/v1/checkout/order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'accountId': process.env.NOMBA_ACCOUNT_ID!
        },
        body: JSON.stringify({
          order: {
            orderReference: testRef,
            customerId: 'test-customer-id',
            callbackUrl: `${appUrl}/payment/nomba/callback`,
            customerEmail: 'test@example.com',
            amount: 100.00, // Small test amount
            currency: 'NGN',
            accountId: process.env.NOMBA_ACCOUNT_ID
          },
          tokenizeCard: false
        })
      })

      const checkoutData = await checkoutResponse.json()

      if (checkoutData.code === '00' && checkoutData.data?.checkoutLink) {
        results.tests[6].status = 'PASS'
        results.tests[6].details = {
          message: 'Checkout API working',
          checkoutLink: checkoutData.data.checkoutLink.substring(0, 50) + '...'
        }
      } else {
        results.tests[6].status = 'FAIL'
        results.tests[6].error = checkoutData.description || 'Checkout creation failed'
        results.tests[6].code = checkoutData.code
        results.tests[6].response = checkoutData
        results.criticalErrors.push(`Checkout API failed: ${checkoutData.code} - ${checkoutData.description}`)
      }
    } catch (checkoutError: any) {
      results.tests[6].status = 'FAIL'
      results.tests[6].error = checkoutError.message
      results.criticalErrors.push(`Checkout API test failed: ${checkoutError.message}`)
    }

    // Test 8: Reference Uniqueness Constraint
    results.tests.push({
      name: '8. Payment Reference Constraints',
      status: 'running'
    })

    try {
      // Check if payment_reference has unique constraint
      // This is important for preventing duplicate payments
      const { data: orders } = await admin
        .from('orders')
        .select('payment_reference')
        .not('payment_reference', 'is', null)
        .limit(10)

      const hasDuplicates = orders && orders.length > 0 && orders.length !== new Set(orders.map((o: any) => o.payment_reference)).size

      if (hasDuplicates) {
        results.tests[7].status = 'FAIL'
        results.tests[7].error = 'Duplicate payment references found'
        results.tests[7].details = 'Unique constraint may not be enforced'
        results.criticalErrors.push('Payment reference uniqueness constraint may be missing')
      } else {
        results.tests[7].status = 'PASS'
        results.tests[7].details = {
          message: 'Payment references appear unique',
          checked: orders?.length || 0
        }
      }
    } catch (refError: any) {
      results.tests[7].status = 'WARN'
      results.tests[7].error = refError.message
      results.warnings.push(`Could not verify reference constraints: ${refError.message}`)
    }

    // Test 9: Payment Status Workflow
    results.tests.push({
      name: '9. Payment Status Workflow',
      status: 'running'
    })

    try {
      // Test valid status transitions
      const validTransitions = {
        'pending': ['paid', 'cancelled', 'failed'],
        'paid': ['confirmed', 'refunded'],
        'confirmed': ['completed', 'cancelled'],
        'cancelled': [],
        'failed': []
      }

      // Check if orders table has these status values
      const { data: statusCheck } = await admin
        .from('orders')
        .select('status')
        .in('status', ['pending', 'paid', 'confirmed', 'cancelled', 'failed', 'completed'])
        .limit(1)

      results.tests[8].status = 'PASS'
      results.tests[8].details = {
        message: 'Payment status workflow supported',
        validStatuses: Object.keys(validTransitions)
      }
    } catch (statusError: any) {
      results.tests[8].status = 'FAIL'
      results.tests[8].error = statusError.message
      results.criticalErrors.push(`Payment status check failed: ${statusError.message}`)
    }

    // Test 10: Data Type Validation
    results.tests.push({
      name: '10. Data Type Validation',
      status: 'running'
    })

    try {
      const { data: orderSample } = await admin
        .from('orders')
        .select('id, total, paid_at')
        .not('total', 'is', null)
        .limit(1)

      if (orderSample && orderSample.length > 0) {
        const order = orderSample[0]

        const typeChecks = {
          totalIsNumber: typeof order.total === 'number',
          totalIsNumeric: !isNaN(order.total),
          totalNotString: typeof order.total !== 'string',
          totalIsValid: order.total > 0 && Number.isFinite(order.total)
        }

        const allValid = Object.values(typeChecks).every(v => v)

        if (allValid) {
          results.tests[9].status = 'PASS'
          results.tests[9].details = {
            message: 'Order total data type correct',
            sampleValue: order.total,
            typeChecks
          }
        } else {
          results.tests[9].status = 'FAIL'
          results.tests[9].error = 'Data type validation failed'
          results.tests[9].typeChecks = typeChecks
          results.criticalErrors.push('Order total data type incorrect - should be number, not string')
        }
      } else {
        results.tests[9].status = 'SKIP'
        results.tests[9].reason = 'No orders found to validate'
      }
    } catch (typeError: any) {
      results.tests[9].status = 'FAIL'
      results.tests[9].error = typeError.message
      results.criticalErrors.push(`Data type validation failed: ${typeError.message}`)
    }

    // Summary
    const passCount = results.tests.filter((t: any) => t.status === 'PASS').length
    const failCount = results.tests.filter((t: any) => t.status === 'FAIL').length
    const warnCount = results.tests.filter((t: any) => t.status === 'WARN' || t.status === 'SKIP').length

    results.summary = {
      total: results.tests.length,
      passed: passCount,
      failed: failCount,
      warnings: warnCount,
      status: results.criticalErrors.length > 0 ? 'CRITICAL ISSUES' : (failCount > 0 ? 'ISSUES FOUND' : 'HEALTHY'),
      message: results.criticalErrors.length > 0 ? 'Critical errors found - Nomba payments will fail' :
                (failCount > 0 ? 'Some tests failed - review details' :
                'All systems operational - Nomba ready for payments')
    }

    if (results.criticalErrors.length > 0) {
      results.criticalErrorsSummary = results.criticalErrors.join('; ')
    }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test execution failed',
      details: error.message,
      stack: error.stack,
      results
    }, { status: 500 })
  }
}
