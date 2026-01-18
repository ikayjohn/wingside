"use client";

import { useEffect, useState } from 'react';

interface TestResult {
  env_configured: boolean;
  env_vars: Record<string, string>;
  recent_signups: Array<{
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
    embedly_customer_id?: string;
    embedly_wallet_id?: string;
    has_embedly_customer: boolean;
    has_embedly_wallet: boolean;
    sync_status: string;
  }>;
  test_sync?: {
    customer_email: string;
    customer_id: string;
    result: any;
    success: boolean;
  };
  error?: string;
}

export default function TestEmbedlySyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-embedly-sync');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setResult({ error: data.error || 'Test failed' } as TestResult);
      }
    } catch (error: any) {
      setResult({ error: error.message } as TestResult);
    } finally {
      setLoading(false);
    }
  };

  const manualSync = async (customerId: string) => {
    setSyncing(true);
    setSyncMessage('Syncing...');

    try {
      const response = await fetch('/api/admin/test-embedly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId })
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage('✅ Sync successful! Running test again...');
        setTimeout(() => runTest(), 2000);
      } else {
        setSyncMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      setSyncMessage(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Embedly Sync Diagnostic</h1>
        <p className="text-gray-600 mt-1">Troubleshoot Embedly customer and wallet sync issues</p>
      </div>

      {/* Run Test Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Diagnostic...' : 'Run Embedly Sync Test'}
        </button>
      </div>

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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Test Sync Result</h2>
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
                {result.test_sync.result.zoho && (
                  <p><strong>Zoho Contact:</strong> {result.test_sync.result.zoho.contact_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Recent Signups */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Customer Signups (Last 10)</h2>
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
                        {!customer.embedly_customer_id && (
                          <button
                            onClick={() => manualSync(customer.id)}
                            disabled={syncing}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            {syncing ? 'Syncing...' : 'Sync Now'}
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
              <p className="text-red-700">{result.error}</p>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use This Tool</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Click "Run Embedly Sync Test" to check your configuration</li>
          <li>Review the environment variables - all should show "✅ Set"</li>
          <li>Check recent signups for sync status (❌ = not synced)</li>
          <li>If test sync succeeds, all ❌ customers should automatically fix</li>
          <li>If it fails, check the error message and your Embedly API credentials</li>
        </ol>
      </div>
    </div>
  );
}
