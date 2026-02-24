"use client";

import { useState } from 'react';

interface SignupRow {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  embedly_customer_id?: string | null;
  embedly_wallet_id?: string | null;
  has_embedly_customer: boolean;
  has_embedly_wallet: boolean;
  sync_status: string;
}

interface FailedIntegration {
  id: string;
  integration_type: string;
  user_email: string;
  error_message: string;
  status: string;
  retry_count: number;
  created_at: string;
}

interface TestResult {
  env_configured: boolean;
  env_vars: Record<string, string>;
  recent_signups: SignupRow[];
  failed_integrations: FailedIntegration[];
  error?: string;
}

interface BulkResult {
  success: boolean;
  summary: { fully_synced: number; wallet_added: number; failed: number };
  fixed_customer: string[];
  fixed_wallet: string[];
  failed: Array<{ email: string; error: string }>;
}

export default function TestEmbedlySyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<Array<{ email: string; has_phone: boolean; error: string }> | null>(null);
  const [diagnoseLoading, setDiagnoseLoading] = useState(false);

  const runTest = async (emailSearch?: string) => {
    setLoading(true);
    setResult(null);
    setBulkResult(null);
    setActionMessage('');

    try {
      const params = emailSearch ? `?email=${encodeURIComponent(emailSearch)}` : '';
      const response = await fetch(`/api/admin/test-embedly-sync${params}`);
      const data = await response.json();
      setResult(response.ok ? data : { error: data.error || 'Test failed' } as TestResult);
    } catch (error: any) {
      setResult({ error: error.message } as TestResult);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runTest(searchEmail.trim());
  };

  // Re-query actual DB status for a single customer to confirm sync result
  const refreshCustomerStatus = async (customerId: string) => {
    const params = new URLSearchParams();
    params.set('email', result?.recent_signups.find(c => c.id === customerId)?.email || '');
    const r = await fetch(`/api/admin/test-embedly-sync?${params}`);
    const d = await r.json();
    if (r.ok && d.recent_signups?.length) {
      const updated = d.recent_signups[0];
      setResult(prev => prev ? {
        ...prev,
        recent_signups: prev.recent_signups.map(c => c.id === customerId ? { ...c, ...updated } : c)
      } : prev);
      return updated;
    }
    return null;
  };

  // Full sync for unsynced customers
  const syncCustomer = async (customerId: string) => {
    setActionLoading(customerId);
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionMessage(`❌ Failed: ${data.error || JSON.stringify(data)}`);
        return;
      }

      // Check if Embedly actually succeeded — API returns 200 even on Embedly failure
      const embedlyOk = !!data.sync_result?.embedly?.customer_id;
      if (embedlyOk) {
        setActionMessage(`✅ Embedly synced — Customer: ${data.sync_result.embedly.customer_id.slice(0, 8)}… · Wallet: ${data.sync_result.embedly.wallet_id ? '✅' : '⚠️ not created'}`);
        await refreshCustomerStatus(customerId);
      } else {
        const reason = data.sync_result?.error || 'no data returned';
        setActionMessage(`⚠️ Embedly sync failed: ${reason} — Try again or use "Set Customer ID" manually if this persists.`);
        // Don't update local state — let the row stay red to reflect reality
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Wallet-only for "Customer only" customers
  const addWallet = async (customerId: string) => {
    setActionLoading(customerId + '_wallet');
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, action: 'add_wallet' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionMessage(`❌ Failed: ${data.error || JSON.stringify(data)}`);
        return;
      }
      if (data.wallet_id) {
        setActionMessage(`✅ Wallet created${data.bank_account ? ` — Account: ${data.bank_account}` : ''}`);
        await refreshCustomerStatus(customerId);
      } else {
        setActionMessage(`⚠️ API call succeeded but no wallet ID returned — wallet creation may have failed. Check server logs.`);
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Debug: fetch raw Embedly API response to diagnose lookup failures
  const debugEmbedlyLookup = async (email: string) => {
    setDebugLoading(true);
    setDebugResult(null);
    try {
      const r = await fetch(`/api/admin/test-embedly-sync?debug_email=${encodeURIComponent(email)}`);
      const d = await r.json();
      setDebugResult(d);
    } catch (err: any) {
      setDebugResult({ error: err.message });
    } finally {
      setDebugLoading(false);
    }
  };

  // Manual link — paste Embedly IDs from the Embedly portal
  const manualLink = async (customerId: string, field: 'embedly_customer_id' | 'embedly_wallet_id', label: string) => {
    const value = window.prompt(`Paste the ${label} from the Embedly dashboard:`);
    if (!value?.trim()) return;
    setActionLoading(customerId + '_manual');
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, [field]: value.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        const extra = data.wallet_created ? ` + wallet ${data.wallet_id} created` : data.wallet_error ? ` (wallet failed: ${data.wallet_error})` : '';
        setActionMessage(`✅ Saved${extra} — refresh the list to confirm`);
      } else {
        setActionMessage(`❌ Failed: ${data.error || JSON.stringify(data)}`);
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Diagnose a specific list of emails — attempt sync and report the real error per customer
  const diagnoseFailed = async (emails: string[]) => {
    setDiagnoseLoading(true);
    setDiagnoseResult(null);
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'diagnose', emails }),
      });
      const data = await response.json();
      if (response.ok) {
        setDiagnoseResult(data.report);
        await runTest(); // Refresh list — successful ones will now show as synced
      } else {
        setActionMessage(`❌ Diagnose failed: ${data.error || JSON.stringify(data)}`);
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setDiagnoseLoading(false);
    }
  };

  // Bulk fix ALL unsynced + customer-only (no limit)
  const bulkFix = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_fix' }),
      });
      const data = await response.json();
      if (response.ok) {
        setBulkResult(data);
      } else {
        setActionMessage(`❌ Bulk fix failed: ${data.error || JSON.stringify(data)}`);
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const needsAction = result?.recent_signups.filter(
    c => c.sync_status !== '✅ Fully synced'
  ).length ?? 0;

  const notSyncedCount   = result?.recent_signups.filter(c => c.sync_status === '❌ Not synced').length ?? 0;
  const customerOnlyCount = result?.recent_signups.filter(c => c.sync_status === '⚠️  Customer only').length ?? 0;
  const syncedCount      = result?.recent_signups.filter(c => c.sync_status === '✅ Fully synced').length ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Embedly Sync Diagnostic</h1>
          <p className="text-gray-600 mt-1">Troubleshoot Embedly customer and wallet sync issues</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {needsAction > 0 && (
            <button
              onClick={bulkFix}
              disabled={bulkLoading}
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
            >
              {bulkLoading ? 'Fixing…' : `Fix All (${needsAction} issues)`}
            </button>
          )}
          <button
            onClick={() => runTest()}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
          >
            {loading ? 'Running…' : 'Run Diagnostic'}
          </button>
        </div>
      </div>

      {/* Action feedback */}
      {actionMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-start justify-between gap-3 ${actionMessage.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span className="break-all">{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-lg leading-none opacity-60 hover:opacity-100 shrink-0" title="Dismiss">×</button>
        </div>
      )}

      {/* Bulk fix result */}
      {bulkResult && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Bulk Fix Result</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{bulkResult.summary.fully_synced}</div>
              <div className="text-xs text-green-600 mt-1">Fully Synced</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{bulkResult.summary.wallet_added}</div>
              <div className="text-xs text-blue-600 mt-1">Wallets Added</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{bulkResult.summary.failed}</div>
              <div className="text-xs text-red-600 mt-1">Failed</div>
            </div>
          </div>
          {bulkResult.failed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-red-700">Failed customers ({bulkResult.failed.length}):</p>
                <button
                  onClick={() => diagnoseFailed(bulkResult.failed.map((f: any) => f.email))}
                  disabled={diagnoseLoading}
                  className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50 font-medium"
                >
                  {diagnoseLoading ? 'Diagnosing…' : 'Re-attempt + Show Real Errors'}
                </button>
              </div>
              <div className="space-y-1">
                {bulkResult.failed.map((f: any, i: number) => (
                  <div key={i} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded font-mono">
                    {f.email} — {f.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => runTest()}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh list →
          </button>
        </div>
      )}

      {/* Diagnose result */}
      {diagnoseResult && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Diagnose Result</h2>
            <button onClick={() => setDiagnoseResult(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <div className="space-y-2">
            {diagnoseResult.map((r, i) => (
              <div key={i} className={`text-xs px-3 py-2 rounded font-mono ${r.error.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="font-semibold">{r.email} {!r.has_phone && <span className="text-orange-600 ml-2">[NO PHONE]</span>}</div>
                <div className="mt-0.5">{r.error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <>
          {/* Environment Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Configuration</h2>
            <div className="space-y-2">
              {Object.entries(result.env_vars).map(([key, value]) => (
                <div key={key} className="font-mono text-sm bg-gray-50 p-2 rounded">
                  <span className="font-semibold">{key}:</span> {value}
                </div>
              ))}
            </div>
            <div className={`mt-4 p-4 rounded-lg ${result.env_configured ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.env_configured ? '✅ Embedly is configured' : '❌ Embedly is NOT properly configured'}
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customers</h2>
                <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded">❌ Not synced: {notSyncedCount}</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">⚠️ Customer only: {customerOnlyCount}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✅ Fully synced: {syncedCount}{syncedCount === 20 ? ' (showing last 20)' : ''}</span>
                </div>
              </div>

              {/* Email search */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  placeholder="Search by email…"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 disabled:opacity-50"
                >
                  Search
                </button>
                {searchEmail && (
                  <button
                    type="button"
                    onClick={() => { setSearchEmail(''); runTest(); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Signup Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sync Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.recent_signups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        {searchEmail ? `No customers found matching "${searchEmail}"` : 'No customers found'}
                      </td>
                    </tr>
                  ) : (
                    result.recent_signups.map((customer) => (
                      <tr key={customer.id} className={`hover:bg-gray-50 ${customer.sync_status === '❌ Not synced' ? 'bg-red-50' : customer.sync_status === '⚠️  Customer only' ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-2 text-sm text-gray-900">{customer.full_name || 'No name'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            customer.sync_status === '✅ Fully synced' ? 'bg-green-100 text-green-800' :
                            customer.sync_status === '⚠️  Customer only' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {customer.sync_status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex flex-col gap-1">
                            {customer.sync_status === '❌ Not synced' && (
                              <>
                                <button
                                  onClick={() => syncCustomer(customer.id)}
                                  disabled={!!actionLoading}
                                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 text-xs font-medium text-left"
                                >
                                  {actionLoading === customer.id ? 'Syncing…' : 'Auto Sync'}
                                </button>
                                <button
                                  onClick={() => manualLink(customer.id, 'embedly_customer_id', 'Embedly Customer ID')}
                                  disabled={!!actionLoading}
                                  className="text-purple-600 hover:text-purple-800 disabled:opacity-50 text-xs font-medium text-left"
                                  title="Paste customer ID from Embedly dashboard"
                                >
                                  Set Customer ID ✏️
                                </button>
                                <button
                                  onClick={() => debugEmbedlyLookup(customer.email)}
                                  disabled={debugLoading}
                                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-xs font-medium text-left"
                                  title="See raw Embedly API response to diagnose lookup failure"
                                >
                                  {debugLoading ? 'Checking…' : 'Debug lookup 🔍'}
                                </button>
                              </>
                            )}
                            {customer.sync_status === '⚠️  Customer only' && (
                              <>
                                <button
                                  onClick={() => addWallet(customer.id)}
                                  disabled={!!actionLoading}
                                  className="text-orange-600 hover:text-orange-800 disabled:opacity-50 text-xs font-medium text-left"
                                >
                                  {actionLoading === customer.id + '_wallet' ? 'Creating…' : 'Add Wallet'}
                                </button>
                                <button
                                  onClick={() => manualLink(customer.id, 'embedly_wallet_id', 'Embedly Wallet ID')}
                                  disabled={!!actionLoading}
                                  className="text-purple-600 hover:text-purple-800 disabled:opacity-50 text-xs font-medium text-left"
                                  title="Paste wallet ID from Embedly dashboard (for 'wallet limit reached' errors)"
                                >
                                  Set Wallet ID ✏️
                                </button>
                                <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]" title={customer.embedly_customer_id ?? undefined}>
                                  {customer.embedly_customer_id?.slice(0, 8)}…
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failure Log */}
          {result.failed_integrations && result.failed_integrations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Failure Log</h2>
              <p className="text-xs text-gray-500 mb-4">Recent pending_retry entries from the failed_integrations table — shows the actual error for each failure</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Error</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">Retries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.failed_integrations.map(f => (
                      <tr key={f.id} className="hover:bg-red-50">
                        <td className="px-3 py-2 text-gray-700 font-medium">{f.user_email}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${f.integration_type.includes('wallet') ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                            {f.integration_type.replace('embedly_', '').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-red-700 font-mono max-w-xs truncate" title={f.error_message}>{f.error_message}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-gray-500 text-center">{f.retry_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Display */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700 font-mono text-sm">{result.error}</p>
            </div>
          )}
        </>
      )}

      {/* Debug result */}
      {debugResult && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-xs overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold text-sm">Embedly API Debug Response</h3>
            <button onClick={() => setDebugResult(null)} className="text-gray-400 hover:text-white text-lg">×</button>
          </div>
          {debugResult.error ? (
            <p className="text-red-400">{debugResult.error}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-yellow-400 font-bold">📋 Customer list response (page 1 of /customers/get/all):</p>
                <p>HTTP status: <span className="text-white">{debugResult.list_response?.status}</span></p>
                <p>Top-level keys: <span className="text-white">[{debugResult.list_response?.top_level_keys?.join(', ')}]</span></p>
                <p>data type: <span className="text-white">{debugResult.list_response?.data_type}</span></p>
                {debugResult.list_response?.data_keys && (
                  <p>data sub-keys: <span className="text-white">[{debugResult.list_response.data_keys.join(', ')}]</span></p>
                )}
                <p>items in page: <span className="text-white">{debugResult.list_response?.total_in_page}</span></p>
                {debugResult.list_response?.sample_item && (
                  <div>
                    <p className="text-yellow-400 mt-2">Sample item keys: <span className="text-white">[{Object.keys(debugResult.list_response.sample_item).join(', ')}]</span></p>
                    <pre className="text-white mt-1 whitespace-pre-wrap">{JSON.stringify(debugResult.list_response.sample_item, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div>
                <p className="text-yellow-400 font-bold">🔎 Filter by email (?email=...):</p>
                <p>HTTP status: <span className="text-white">{debugResult.filter_by_email?.status}</span></p>
                <p>data type: <span className="text-white">{debugResult.filter_by_email?.data_type}</span></p>
                <p>sample: <span className="text-white">{debugResult.filter_by_email?.sample_item ? JSON.stringify(debugResult.filter_by_email.sample_item).slice(0, 200) : 'null'}</span></p>
              </div>
              <div>
                <p className="text-yellow-400 font-bold">🔎 Filter by emailAddress (?emailAddress=...):</p>
                <p>HTTP status: <span className="text-white">{debugResult.filter_by_emailAddress?.status}</span></p>
                <p>data type: <span className="text-white">{debugResult.filter_by_emailAddress?.data_type}</span></p>
                <p>sample: <span className="text-white">{debugResult.filter_by_emailAddress?.sample_item ? JSON.stringify(debugResult.filter_by_emailAddress.sample_item).slice(0, 200) : 'null'}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Click <strong>Run Diagnostic</strong> — shows ALL customers with issues (not just recent ones), plus last 20 synced</li>
          <li>Use <strong>Search by email</strong> to find a specific customer who reported a problem</li>
          <li>Use <strong>Fix All</strong> to bulk-fix every ❌ and ⚠️ customer at once — covers all customers, no limit</li>
          <li><strong>Auto Sync</strong> — creates Embedly customer + wallet from scratch</li>
          <li><strong>Add Wallet</strong> — customer already exists in Embedly, only creates the wallet</li>
          <li><strong>Set ID manually</strong> — paste IDs from Embedly dashboard when auto-sync fails</li>
        </ol>
      </div>
    </div>
  );
}
