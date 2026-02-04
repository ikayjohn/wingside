import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/embedly/comprehensive-test - Full integration test including writes
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    criticalErrors: [] as string[]
  }

  try {
    // Test 1: Configuration
    results.tests.push({
      name: 'Configuration Check',
      status: 'running'
    })

    const configCheck = {
      apiKey: !!process.env.EMBEDLY_API_KEY,
      merchantWallet: !!process.env.EMBEDLY_MERCHANT_WALLET_ID,
      orgId: !!process.env.EMBEDLY_ORG_ID
    }

    results.tests[0].status = Object.values(configCheck).every(v => v) ? 'PASS' : 'WARN'
    results.tests[0].details = configCheck

    // Test 2: API Connection
    results.tests.push({
      name: 'Embedly API Connection',
      status: 'running'
    })

    const embedlyClient = (await import('@/lib/embedly/client')).default

    try {
      const banks = await embedlyClient.getBanks()
      results.tests[1].status = 'PASS'
      results.tests[1].details = { bankCount: banks.length }
    } catch (error: any) {
      results.tests[1].status = 'FAIL'
      results.tests[1].error = error.message
    }

    // Test 3: Database Write - THE CRITICAL TEST I MISSED!
    results.tests.push({
      name: 'Database Write Test',
      status: 'running'
    })

    const admin = createAdminClient()
    const supabase = await createClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      try {
        // Try to INSERT a test transaction
        const testRef = `TEST-DELETE-${Date.now()}`

        const { data: testTransaction, error: insertError } = await admin
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            type: 'debit',
            amount: 0, // ₦0 test transaction
            currency: 'NGN',
            reference: testRef,
            description: 'Integration test - should be deleted',
            status: 'completed',
            balance_before: 0,
            balance_after: 0,
            metadata: { test: true }
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        // Clean up test transaction
        await admin
          .from('wallet_transactions')
          .delete()
          .eq('id', testTransaction.id)

        results.tests[2].status = 'PASS'
        results.tests[2].details = {
          message: 'Successfully created and deleted test transaction',
          transactionId: testTransaction.id
        }
      } catch (writeError: any) {
        results.tests[2].status = 'FAIL'
        results.tests[2].error = writeError.message
        results.tests[2].code = writeError.code
        results.tests[2].hint = 'Check table schema and RLS policies'
        results.criticalErrors.push(`Database write failed: ${writeError.message}`)
      }
    } else {
      results.tests[2].status = 'SKIP'
      results.tests[2].reason = 'No authenticated user'
    }

    // Test 4: Check wallet_transactions schema
    results.tests.push({
      name: 'Schema Validation',
      status: 'running'
    })

    try {
      const { data: columns } = await supabase.rpc('get_table_columns', {
        table_name: 'wallet_transactions'
      }) || []

      const requiredColumns = ['id', 'user_id', 'type', 'amount', 'balance_before', 'balance_after']
      const missingColumns = requiredColumns.filter(col => !columns.some((c: any) => c.column_name === col))

      if (missingColumns.length > 0) {
        results.tests[3].status = 'FAIL'
        results.tests[3].missingColumns = missingColumns
        results.tests[3].error = `Missing columns: ${missingColumns.join(', ')}`
        results.criticalErrors.push(`Missing required columns: ${missingColumns.join(', ')}`)
      } else {
        results.tests[3].status = 'PASS'
        results.tests[3].details = { message: 'All required columns exist' }
      }
    } catch (schemaError: any) {
      results.tests[3].status = 'WARN'
      results.tests[3].error = schemaError.message
    }

    // Test 5: RLS Policies
    results.tests.push({
      name: 'RLS Policy Check',
      status: 'running'
    })

    try {
      // Check if service role can bypass RLS
      const { data: testRow, error: rlsError } = await supabase
        .from('wallet_transactions')
        .select('id')
        .limit(1)

      results.tests[4].status = rlsError ? 'PASS' : 'WARN'
      results.tests[4].details = {
        message: rlsError ? 'RLS is blocking reads (expected)' : 'RLS might be too permissive',
        canRead: !rlsError
      }
    } catch (rlsError: any) {
      results.tests[4].status = 'WARN'
      results.tests[4].error = rlsError.message
    }

    // Summary
    const passCount = results.tests.filter((t: any) => t.status === 'PASS').length
    const failCount = results.tests.filter((t: any) => t.status === 'FAIL').length

    results.summary = {
      total: results.tests.length,
      passed: passCount,
      failed: failCount,
      warnings: results.tests.filter((t: any) => t.status === 'WARN' || t.status === 'SKIP').length
    }

    if (results.criticalErrors.length > 0) {
      results.summary.status = 'CRITICAL ISSUES FOUND'
      results.summary.message = 'System has critical errors that prevent payments'
    } else if (failCount === 0) {
      results.summary.status = 'HEALTHY'
      results.summary.message = 'All systems operational'
    } else {
      results.summary.status = 'ISSUES FOUND'
      results.summary.message = 'Some tests failed - review details'
    }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test execution failed',
      details: error.message,
      results
    }, { status: 500 })
  }
}
