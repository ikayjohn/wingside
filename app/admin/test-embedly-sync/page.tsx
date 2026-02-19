"use client";

import { useEffect, useState } from 'react';

interface SignupRow {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  embedly_customer_id?: string;
  embedly_wallet_id?: string;
  has_embedly_customer: boolean;
  has_embedly_wallet: boolean;
  sync_status: string;
}

interface TestResult {
  env_configured: boolean;
  env_vars: Record<string, string>;
  recent_signups: SignupRow[];
  test_sync?: {
    customer_email: string;
    customer_id: string;
    result: any;
    success: boolean;
  };
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

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    setBulkResult(null);
    setActionMessage('');

    try {
      const response = await fetch('/api/admin/test-embedly-sync');
      const data = await response.json();
      setResult(response.ok ? data : { error: data.error || 'Test failed' } as TestResult);
    } catch (error: any) {
      setResult({ error: error.message } as TestResult);
    } finally {
      setLoading(false);
    }
  };

  // Full sync for unsynced customers
  const syncCustomer = async (customerId: string) => {
    setActionLoading(customerId);
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage(`✅ Synced successfully`);
        setTimeout(runTest, 1500);
      } else {
        setActionMessage(`❌ Failed: ${data.error}`);
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
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, action: 'add_wallet' }),
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage(`✅ Wallet created${data.bank_account ? ` — Account: ${data.bank_account}` : ''}`);
        setTimeout(runTest, 1500);
      } else {
        setActionMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      setActionMessage(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk fix all unsynced + customer-only
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
        setTimeout(runTest, 2000);
      } else {
        setActionMessage(`❌ Bulk fix failed: ${data.error}`);
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
            onClick={runTest}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
          >
            {loading ? 'Running…' : 'Run Diagnostic'}
          </button>
        </div>
      </div>

      {/* Action feedback */}
      {actionMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${actionMessage.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {actionMessage}
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
              <p className="text-sm font-semibold text-red-700 mb-2">Failed customers:</p>
              <div className="space-y-1">
                {bulkResult.failed.map((f, i) => (
                  <div key={i} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded font-mono">
                    {f.email} — {f.error}
                  </div>
                ))}
              </div>
            </div>
          )}
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

          {/* Test Sync Result */}
          {result.test_sync && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Auto-Test Result (most recent unsynced)</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Customer:</strong> {result.test_sync.customer_email}</p>
                <p><strong>Success:</strong> {result.test_sync.success ? '✅ Yes' : '❌ No'}</p>
                {result.test_sync.result.embedly && (
                  <>
                    <p><strong>Embedly Customer:</strong> {result.test_sync.result.embedly.customer_id}</p>
                    <p><strong>Embedly Wallet:</strong> {result.test_sync.result.embedly.wallet_id || 'Not created'}</p>
                    <p><strong>New Customer:</strong> {result.test_sync.result.embedly.isNewCustomer ? 'Yes' : 'No'}</p>
                  </>
                )}
                {!result.test_sync.success && (
                  <div className="mt-2 p-3 bg-red-50 rounded text-red-700 text-xs font-mono">
                    {JSON.stringify(result.test_sync.result, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Signups */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Customer Signups (Last 50)</h2>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✅ Fully synced: {result.recent_signups.filter(c => c.sync_status === '✅ Fully synced').length}</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">⚠️ Customer only: {result.recent_signups.filter(c => c.sync_status === '⚠️  Customer only').length}</span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">❌ Not synced: {result.recent_signups.filter(c => c.sync_status === '❌ Not synced').length}</span>
              </div>
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
                  {result.recent_signups.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
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
                        {customer.sync_status === '❌ Not synced' && (
                          <button
                            onClick={() => syncCustomer(customer.id)}
                            disabled={actionLoading === customer.id}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50 text-xs font-medium"
                          >
                            {actionLoading === customer.id ? 'Syncing…' : 'Full Sync'}
                          </button>
                        )}
                        {customer.sync_status === '⚠️  Customer only' && (
                          <button
                            onClick={() => addWallet(customer.id)}
                            disabled={actionLoading === customer.id + '_wallet'}
                            className="text-orange-600 hover:text-orange-800 disabled:opacity-50 text-xs font-medium"
                          >
                            {actionLoading === customer.id + '_wallet' ? 'Creating…' : 'Add Wallet'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Display */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700 font-mono text-sm">{result.error}</p>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Click <strong>Run Diagnostic</strong> to load recent signups and test configuration</li>
          <li>If all env vars show ✅ but syncs fail, check the auto-test result for the actual API error</li>
          <li>Use <strong>Fix All</strong> to bulk-fix all ❌ and ⚠️ customers in one go</li>
          <li><strong>Full Sync</strong> — creates Embedly customer + wallet from scratch</li>
          <li><strong>Add Wallet</strong> — customer already exists in Embedly, only creates the wallet</li>
        </ol>
      </div>
    </div>
  );
}
