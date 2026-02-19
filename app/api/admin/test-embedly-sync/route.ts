import { NextRequest, NextResponse } from 'next/server'
import { syncNewCustomer } from '@/lib/integrations'
import { createWallet, isEmbedlyConfigured } from '@/lib/integrations/embedly'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/test-embedly-sync - Test Embedly configuration and last syncs
export async function GET(request: NextRequest) {
  // Verify admin authentication first
  const auth = await requireAdmin()
  if (auth.success !== true) return auth.error

  const { admin } = auth

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

    // Get recent customer signups (last 50)
    const { data: recentCustomers, error: customersError } = await admin
      .from('profiles')
      .select('id, email, full_name, phone, date_of_birth, created_at, embedly_customer_id, embedly_wallet_id')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .limit(50)

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
          phone: unsyncedCustomer.phone || undefined,
          dateOfBirth: unsyncedCustomer.date_of_birth || undefined,
        })

        results.test_sync = {
          customer_email: unsyncedCustomer.email,
          customer_id: unsyncedCustomer.id,
          result: testResult,
          success: !!(testResult.embedly || testResult.zoho)
        }

        // Update the profile with the sync result
        if (testResult.embedly) {
          const updatePayload: any = {
            embedly_customer_id: testResult.embedly.customer_id,
            updated_at: new Date().toISOString()
          };
          if (testResult.embedly.wallet_id) {
            updatePayload.embedly_wallet_id = testResult.embedly.wallet_id;
            if (testResult.embedly.bank_account) updatePayload.bank_account = testResult.embedly.bank_account;
            if (testResult.embedly.bank_name) updatePayload.bank_name = testResult.embedly.bank_name;
            if (testResult.embedly.bank_code) updatePayload.bank_code = testResult.embedly.bank_code;
            updatePayload.is_wallet_active = true;
            updatePayload.last_wallet_sync = new Date().toISOString();
          }
          await admin
            .from('profiles')
            .update(updatePayload)
            .eq('id', unsyncedCustomer.id)
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error)
    console.error('Embedly sync test error:', error)
    return NextResponse.json(results, { status: 500 })
  }
}

// POST /api/admin/test-embedly-sync
// body: { customer_id }              → full sync (create customer + wallet)
// body: { customer_id, action: 'add_wallet' } → wallet only (customer already exists)
// body: { action: 'bulk_fix' }       → fix all unsynced + customer-only in last 50
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin()
  if (auth.success !== true) return auth.error

  const { admin } = auth

  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { customer_id, action } = body

    // ── BULK FIX ────────────────────────────────────────────────────────────────
    if (action === 'bulk_fix') {
      if (!isEmbedlyConfigured()) {
        return NextResponse.json({ error: 'Embedly is not configured' }, { status: 500 })
      }

      // Fetch all customers needing attention (last 50)
      const { data: customers } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .limit(50)

      const needsCustomer = (customers || []).filter(c => !c.embedly_customer_id)
      const needsWallet   = (customers || []).filter(c => c.embedly_customer_id && !c.embedly_wallet_id)

      const fixedCustomer: string[] = []
      const fixedWallet:   string[] = []
      const failed:        Array<{ email: string; error: string }> = []

      // Fix fully unsynced — sequential to avoid rate limiting
      for (const c of needsCustomer) {
        try {
          const syncResult = await syncNewCustomer({
            id: c.id,
            email: c.email,
            full_name: c.full_name || '',
            phone: c.phone || undefined,
            dateOfBirth: c.date_of_birth || undefined,
          })

          if (syncResult.embedly) {
            const payload: any = {
              embedly_customer_id: syncResult.embedly.customer_id,
              updated_at: new Date().toISOString(),
            }
            if (syncResult.embedly.wallet_id) {
              payload.embedly_wallet_id = syncResult.embedly.wallet_id
              if (syncResult.embedly.bank_account) payload.bank_account = syncResult.embedly.bank_account
              if (syncResult.embedly.bank_name)    payload.bank_name    = syncResult.embedly.bank_name
              if (syncResult.embedly.bank_code)    payload.bank_code    = syncResult.embedly.bank_code
              payload.is_wallet_active  = true
              payload.last_wallet_sync  = new Date().toISOString()
            }
            await admin.from('profiles').update(payload).eq('id', c.id)
            fixedCustomer.push(c.email)
          } else {
            failed.push({ email: c.email, error: 'Sync returned no Embedly data' })
          }
        } catch (err: any) {
          failed.push({ email: c.email, error: err?.message || String(err) })
        }
      }

      // Fix wallet-only — customer already exists in Embedly, just create wallet
      for (const c of needsWallet) {
        try {
          const walletResult = await createWallet(c.embedly_customer_id, c.full_name || 'Wallet')

          if (!walletResult.walletId) throw new Error('No wallet ID returned')

          const payload: any = {
            embedly_wallet_id: walletResult.walletId,
            is_wallet_active:  true,
            last_wallet_sync:  new Date().toISOString(),
            updated_at:        new Date().toISOString(),
          }
          if (walletResult.bankAccount) payload.bank_account = walletResult.bankAccount
          if (walletResult.bankName)    payload.bank_name    = walletResult.bankName
          if (walletResult.bankCode)    payload.bank_code    = walletResult.bankCode

          await admin.from('profiles').update(payload).eq('id', c.id)
          fixedWallet.push(c.email)
        } catch (err: any) {
          failed.push({ email: c.email, error: err?.message || String(err) })
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          fully_synced:  fixedCustomer.length,
          wallet_added:  fixedWallet.length,
          failed:        failed.length,
        },
        fixed_customer: fixedCustomer,
        fixed_wallet:   fixedWallet,
        failed,
      })
    }

    // ── SINGLE CUSTOMER ACTIONS ─────────────────────────────────────────────────
    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    const { data: customer } = await admin
      .from('profiles')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // ── ADD WALLET ONLY (customer already in Embedly, just missing wallet) ──────
    if (action === 'add_wallet') {
      if (!customer.embedly_customer_id) {
        return NextResponse.json(
          { error: 'Customer has no Embedly customer ID — use full sync instead' },
          { status: 400 }
        )
      }

      const walletResult = await createWallet(
        customer.embedly_customer_id,
        customer.full_name || 'Wallet'
      )

      if (!walletResult.walletId) {
        return NextResponse.json({ error: 'Wallet creation returned no ID' }, { status: 500 })
      }

      const payload: any = {
        embedly_wallet_id: walletResult.walletId,
        is_wallet_active:  true,
        last_wallet_sync:  new Date().toISOString(),
        updated_at:        new Date().toISOString(),
      }
      if (walletResult.bankAccount) payload.bank_account = walletResult.bankAccount
      if (walletResult.bankName)    payload.bank_name    = walletResult.bankName
      if (walletResult.bankCode)    payload.bank_code    = walletResult.bankCode

      await admin.from('profiles').update(payload).eq('id', customer.id)

      return NextResponse.json({
        success: true,
        wallet_id: walletResult.walletId,
        bank_account: walletResult.bankAccount,
        bank_name: walletResult.bankName,
      })
    }

    // ── FULL SYNC (default) ─────────────────────────────────────────────────────
    const syncResult = await syncNewCustomer({
      id: customer.id,
      email: customer.email,
      full_name: customer.full_name || '',
      phone: customer.phone,
      dateOfBirth: customer.date_of_birth || undefined,
    })

    if (syncResult.embedly) {
      const payload: any = {
        embedly_customer_id: syncResult.embedly.customer_id,
        updated_at: new Date().toISOString(),
      }
      if (syncResult.embedly.wallet_id) {
        payload.embedly_wallet_id = syncResult.embedly.wallet_id
        if (syncResult.embedly.bank_account) payload.bank_account = syncResult.embedly.bank_account
        if (syncResult.embedly.bank_name)    payload.bank_name    = syncResult.embedly.bank_name
        if (syncResult.embedly.bank_code)    payload.bank_code    = syncResult.embedly.bank_code
        payload.is_wallet_active = true
        payload.last_wallet_sync = new Date().toISOString()
      }
      await admin.from('profiles').update(payload).eq('id', customer.id)
    }

    return NextResponse.json({ success: true, customer, sync_result: syncResult })

  } catch (error) {
    console.error('Embedly sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync customer' },
      { status: 500 }
    )
  }
}

// ── PATCH /api/admin/test-embedly-sync ──────────────────────────────────────
// Manually link Embedly IDs when the API GET endpoints are unavailable.
// body: { customer_id, embedly_customer_id? }  → save customer ID, then try wallet creation
// body: { customer_id, embedly_wallet_id? }    → save wallet ID directly
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.success !== true) return auth.error
  const { admin } = auth

  try {
    let body: any;
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { customer_id, embedly_customer_id, embedly_wallet_id } = body
    if (!customer_id) return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })

    const { data: customer } = await admin.from('profiles').select('*').eq('id', customer_id).single()
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const update: any = { updated_at: new Date().toISOString() }
    const responseExtra: any = {}

    // ── Save customer ID, then try to auto-create wallet ──────────────────
    if (embedly_customer_id) {
      update.embedly_customer_id = embedly_customer_id

      // Attempt wallet creation now that we have the customer ID
      try {
        const walletResult = await createWallet(embedly_customer_id, customer.full_name || 'Wallet')
        if (walletResult.walletId) {
          update.embedly_wallet_id    = walletResult.walletId
          update.is_wallet_active     = true
          update.last_wallet_sync     = new Date().toISOString()
          if (walletResult.bankAccount) update.bank_account = walletResult.bankAccount
          if (walletResult.bankName)    update.bank_name    = walletResult.bankName
          if (walletResult.bankCode)    update.bank_code    = walletResult.bankCode
          responseExtra.wallet_created = true
          responseExtra.wallet_id      = walletResult.walletId
          responseExtra.bank_account   = walletResult.bankAccount
        }
      } catch (walletErr: any) {
        // Wallet creation failed — save the customer ID anyway
        responseExtra.wallet_error = walletErr?.message || String(walletErr)
        console.warn(`Manual link: customer ID saved for ${customer.email} but wallet creation failed:`, responseExtra.wallet_error)
      }
    }

    // ── Save wallet ID directly (admin looked it up in Embedly portal) ────
    if (embedly_wallet_id) {
      update.embedly_wallet_id  = embedly_wallet_id
      update.is_wallet_active   = true
      update.last_wallet_sync   = new Date().toISOString()
    }

    await admin.from('profiles').update(update).eq('id', customer_id)

    return NextResponse.json({ success: true, updated: update, ...responseExtra })

  } catch (error) {
    console.error('Manual Embedly link error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
