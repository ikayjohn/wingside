import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { syncNewCustomer } from '@/lib/integrations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/test-embedly-sync - Test Embedly configuration and last syncs
export async function GET(request: NextRequest) {
  const results = {
    env_configured: false,
    env_vars: {} as Record<string, string>,
    recent_signups: [] as any[],
    sync_results: [] as any[],
    test_sync: null as any,
    error: null as string | null
  }

  try {
    // Check environment configuration
    results.env_vars = {
      EMBEDLY_API_KEY: process.env.EMBEDLY_API_KEY ? '✅ Set (' + process.env.EMBEDLY_API_KEY.substring(0, 10) + '...)' : '❌ Missing',
      EMBEDLY_ORG_ID: process.env.EMBEDLY_ORG_ID ? '✅ Set' : '❌ Missing',
      EMBEDLY_BASE_URL: process.env.EMBEDLY_BASE_URL || '(using default)',
    }

    results.env_configured = !!(process.env.EMBEDLY_API_KEY && process.env.EMBEDLY_ORG_ID)

    // Get recent customer signups (last 10)
    const { data: recentCustomers, error: customersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, embedly_customer_id, embedly_wallet_id')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!customersError && recentCustomers) {
      results.recent_signups = recentCustomers.map(c => ({
        ...c,
        has_embedly_customer: !!c.embedly_customer_id,
        has_embedly_wallet: !!c.embedly_wallet_id,
        sync_status: !c.embedly_customer_id ? '❌ Not synced' : c.embedly_wallet_id ? '✅ Fully synced' : '⚠️  Customer only'
      }))

      // Test sync for the most recent customer that hasn't been synced
      const unsyncedCustomer = recentCustomers.find(c => !c.embedly_customer_id)

      if (unsyncedCustomer) {
        const testResult = await syncNewCustomer({
          id: unsyncedCustomer.id,
          email: unsyncedCustomer.email,
          full_name: unsyncedCustomer.full_name || '',
          phone: undefined
        })

        results.test_sync = {
          customer_email: unsyncedCustomer.email,
          customer_id: unsyncedCustomer.id,
          result: testResult,
          success: !!(testResult.embedly || testResult.zoho)
        }

        // Update the profile with the sync result
        if (testResult.embedly) {
          await supabase
            .from('profiles')
            .update({
              embedly_customer_id: testResult.embedly.customer_id,
              embedly_wallet_id: testResult.embedly.wallet_id || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', unsyncedCustomer.id)
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    results.error = error.message || String(error)
    console.error('Embedly sync test error:', error)
    return NextResponse.json(results, { status: 500 })
  }
}

// POST /api/admin/test-embedly-sync - Manually trigger sync for a customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    // Get customer details
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Trigger sync
    const syncResult = await syncNewCustomer({
      id: customer.id,
      email: customer.email,
      full_name: customer.full_name || '',
      phone: customer.phone
    })

    // Update profile if sync succeeded
    if (syncResult.embedly) {
      await supabase
        .from('profiles')
        .update({
          embedly_customer_id: syncResult.embedly.customer_id,
          embedly_wallet_id: syncResult.embedly.wallet_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)
    }

    return NextResponse.json({
      success: true,
      customer,
      sync_result: syncResult
    })
  } catch (error: any) {
    console.error('Manual sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync customer' },
      { status: 500 }
    )
  }
}
