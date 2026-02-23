import { NextRequest, NextResponse } from 'next/server'
import { syncNewCustomer } from '@/lib/integrations'
import { createWallet, isEmbedlyConfigured } from '@/lib/integrations/embedly'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/test-embedly-sync
// Returns env config + ALL customers needing attention + recent synced customers (for context)
// Optional query param: ?email=xxx to search by email
// Optional query param: ?debug_email=xxx to return raw Embedly API response for diagnosis
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.success !== true) return auth.error

  const { admin } = auth

  // Debug mode: dump raw wallet API responses for a given Embedly customer ID
  const debugCustomerId = request.nextUrl.searchParams.get('debug_wallet_customer')?.trim()
  if (debugCustomerId) {
    const baseUrl = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1'
    const orgId   = process.env.EMBEDLY_ORG_ID
    const apiKey  = process.env.EMBEDLY_API_KEY
    if (!apiKey || !orgId) return NextResponse.json({ error: 'Embedly not configured' }, { status: 400 })

    const hit = async (url: string) => {
      try {
        const r = await fetch(url, { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } })
        const body = await r.json().catch(() => null)
        return { status: r.status, keys: body ? Object.keys(body) : [], raw: JSON.stringify(body).slice(0, 2000) }
      } catch (e: any) { return { status: 'fetch_error', error: e.message } }
    }

    return NextResponse.json({
      debug_wallet_customer: debugCustomerId,
      endpoints: {
        by_customer_1:   await hit(`${baseUrl}/wallet/customer/${debugCustomerId}`),
        by_customer_2:   await hit(`${baseUrl}/wallets/customer/${debugCustomerId}`),
        all_by_customer: await hit(`${baseUrl}/wallets/get/all?customerId=${debugCustomerId}&organizationId=${orgId}`),
        all_wallets:     await hit(`${baseUrl}/wallets/get/all?organizationId=${orgId}`),
        all_wallets_2:   await hit(`${baseUrl}/wallet/get/all?organizationId=${orgId}`),
        customer_detail: await hit(`${baseUrl}/customers/get/${debugCustomerId}`),
        customer_2:      await hit(`${baseUrl}/customers/${debugCustomerId}`),
      }
    })
  }

  // Debug mode: return raw Embedly API response for a given email
  const debugEmail = request.nextUrl.searchParams.get('debug_email')?.trim()
  if (debugEmail) {
    try {
      const baseUrl = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1'
      const orgId   = process.env.EMBEDLY_ORG_ID
      const apiKey  = process.env.EMBEDLY_API_KEY

      if (!apiKey || !orgId) {
        return NextResponse.json({ error: 'Embedly not configured' }, { status: 400 })
      }

      // Fetch first page of customer list to see raw response shape
      const endpoint = `${baseUrl}/customers/get/all?organizationId=${orgId}&page=1&pageSize=20`
      const res = await fetch(endpoint, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      })
      const raw = await res.json()

      // Also try filter by email
      const filterEndpoint = `${baseUrl}/customers/get/all?organizationId=${orgId}&email=${encodeURIComponent(debugEmail)}&page=1&pageSize=10`
      const filterRes = await fetch(filterEndpoint, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      })
      const filterRaw = await filterRes.json()

      // Try emailAddress param too
      const filterEndpoint2 = `${baseUrl}/customers/get/all?organizationId=${orgId}&emailAddress=${encodeURIComponent(debugEmail)}&page=1&pageSize=10`
      const filterRes2 = await fetch(filterEndpoint2, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      })
      const filterRaw2 = await filterRes2.json()

      return NextResponse.json({
        debug_email: debugEmail,
        list_response: {
          status: res.status,
          top_level_keys: Object.keys(raw),
          data_type: Array.isArray(raw.data) ? 'array' : typeof raw.data,
          data_keys: raw.data && !Array.isArray(raw.data) ? Object.keys(raw.data) : null,
          sample_item: Array.isArray(raw.data) ? raw.data[0] : (raw.data?.items?.[0] || raw.data?.content?.[0] || raw.data?.records?.[0] || null),
          total_in_page: Array.isArray(raw.data) ? raw.data.length : (raw.data?.items?.length ?? raw.data?.content?.length ?? raw.data?.records?.length ?? 'unknown'),
          raw_truncated: JSON.stringify(raw).slice(0, 2000),
        },
        filter_by_email: {
          status: filterRes.status,
          top_level_keys: Object.keys(filterRaw),
          data_type: Array.isArray(filterRaw.data) ? 'array' : typeof filterRaw.data,
          sample_item: Array.isArray(filterRaw.data) ? filterRaw.data[0] : null,
          raw_truncated: JSON.stringify(filterRaw).slice(0, 1000),
        },
        filter_by_emailAddress: {
          status: filterRes2.status,
          top_level_keys: Object.keys(filterRaw2),
          data_type: Array.isArray(filterRaw2.data) ? 'array' : typeof filterRaw2.data,
          sample_item: Array.isArray(filterRaw2.data) ? filterRaw2.data[0] : null,
          raw_truncated: JSON.stringify(filterRaw2).slice(0, 1000),
        },
      })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  const emailFilter = request.nextUrl.searchParams.get('email')?.toLowerCase().trim() || ''

  const results = {
    env_configured: false,
    env_vars: {} as Record<string, string>,
    recent_signups: [] as any[],
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

    if (emailFilter) {
      // Email search: query all customers matching the filter regardless of sync status
      const { data: found, error } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, created_at, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .ilike('email', `%${emailFilter}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      results.recent_signups = (found || []).map(c => ({
        ...c,
        has_embedly_customer: !!c.embedly_customer_id,
        has_embedly_wallet: !!c.embedly_wallet_id,
        sync_status: !c.embedly_customer_id ? '❌ Not synced' : c.embedly_wallet_id ? '✅ Fully synced' : '⚠️  Customer only'
      }))
    } else {
      // Default view: ALL customers needing attention (no limit), plus last 20 synced for context

      // 1. All unsynced (no embedly_customer_id)
      const { data: unsynced } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, created_at, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .is('embedly_customer_id', null)
        .order('created_at', { ascending: false })

      // 2. All customer-only (has customer_id but no wallet)
      const { data: walletOnly } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, created_at, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .not('embedly_customer_id', 'is', null)
        .is('embedly_wallet_id', null)
        .order('created_at', { ascending: false })

      // 3. Last 20 fully synced (just for context — admins can confirm recent signups are OK)
      const { data: recentSynced } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, created_at, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .not('embedly_customer_id', 'is', null)
        .not('embedly_wallet_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)

      results.recent_signups = [
        ...(unsynced || []).map(c => ({ ...c, has_embedly_customer: false, has_embedly_wallet: false, sync_status: '❌ Not synced' })),
        ...(walletOnly || []).map(c => ({ ...c, has_embedly_customer: true, has_embedly_wallet: false, sync_status: '⚠️  Customer only' })),
        ...(recentSynced || []).map(c => ({ ...c, has_embedly_customer: true, has_embedly_wallet: true, sync_status: '✅ Fully synced' })),
      ]
    }

    return NextResponse.json(results)
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error)
    console.error('Embedly sync test error:', error)
    return NextResponse.json(results, { status: 500 })
  }
}

// POST /api/admin/test-embedly-sync
// body: { customer_id }                          → full sync (create customer + wallet)
// body: { customer_id, action: 'add_wallet' }    → wallet only (customer already exists in Embedly)
// body: { action: 'bulk_fix' }                   → fix ALL unsynced + customer-only (no limit)
export async function POST(request: NextRequest) {
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

    // ── DIAGNOSE: attempt sync for a list of emails and report real error per customer ──
    if (action === 'diagnose') {
      const emails: string[] = body.emails || []
      if (!emails.length) {
        return NextResponse.json({ error: 'emails array is required' }, { status: 400 })
      }

      const { data: customers } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth')
        .in('email', emails)

      const report: Array<{ email: string; has_phone: boolean; error: string }> = []

      for (const c of customers || []) {
        try {
          const syncResult = await syncNewCustomer({
            id: c.id,
            email: c.email,
            full_name: c.full_name || '',
            phone: c.phone || undefined,
            dateOfBirth: c.date_of_birth || undefined,
          })
          if (syncResult.embedly) {
            report.push({ email: c.email, has_phone: !!c.phone, error: '✅ Now synced successfully' })
          } else {
            report.push({ email: c.email, has_phone: !!c.phone, error: syncResult.error || 'no embedly data returned' })
          }
        } catch (err: any) {
          report.push({ email: c.email, has_phone: !!c.phone, error: err?.message || String(err) })
        }
      }

      const missing = emails.filter(e => !(customers || []).find(c => c.email === e))
      return NextResponse.json({ report, missing_from_db: missing })
    }

    // ── BULK FIX ────────────────────────────────────────────────────────────────
    if (action === 'bulk_fix') {
      if (!isEmbedlyConfigured()) {
        return NextResponse.json({ error: 'Embedly is not configured' }, { status: 500 })
      }

      // Fetch ALL customers needing attention — no limit
      const { data: unsyncedCustomers } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .is('embedly_customer_id', null)
        .order('created_at', { ascending: false })

      const { data: walletOnlyCustomers } = await admin
        .from('profiles')
        .select('id, email, full_name, phone, date_of_birth, embedly_customer_id, embedly_wallet_id')
        .eq('role', 'customer')
        .not('embedly_customer_id', 'is', null)
        .is('embedly_wallet_id', null)
        .order('created_at', { ascending: false })

      const needsCustomer = unsyncedCustomers || []
      const needsWallet   = walletOnlyCustomers || []

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
            failed.push({ email: c.email, error: syncResult.error || 'Sync returned no Embedly data' })
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
