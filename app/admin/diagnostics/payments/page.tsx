"use client"

import { useState, useEffect } from 'react'

interface FailedPayment {
  id: string
  order_number: string
  total: number
  payment_method: string
  payment_status: string
  payment_reference: string | null
  created_at: string
  customer_email: string
  customer_name: string
}

interface NombaTestResult {
  timestamp: string
  credentials: {
    clientId: string
    clientSecret: string
    accountId: string
    webhookSecret: string
  }
  authTest: {
    statusCode: number
    responseCode: string
    responseDescription: string
    success: boolean
  }
  errors: string[]
}

export default function PaymentDiagnostics() {
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([])
  const [nombaTest, setNombaTest] = useState<NombaTestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    fetchFailedPayments()
    testNombaCredentials()
  }, [])

  const fetchFailedPayments = async () => {
    try {
      const response = await fetch('/api/admin/diagnostics/failed-payments')
      const data = await response.json()
      setFailedPayments(data.payments || [])
    } catch (error) {
      console.error('Error fetching failed payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const testNombaCredentials = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/payment/nomba/test')
      const data = await response.json()
      setNombaTest(data)
    } catch (error) {
      console.error('Error testing Nomba:', error)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">💳 Payment Gateway Diagnostics</h1>

        {/* Nomba Credentials Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Nomba Gateway Test</h2>
            <button
              onClick={testNombaCredentials}
              disabled={testLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testLoading ? 'Testing...' : 'Run Test'}
            </button>
          </div>

          {testLoading && <p className="text-gray-600">Testing Nomba credentials...</p>}

          {nombaTest && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Credentials Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>{nombaTest.credentials.clientId}</div>
                  <div>{nombaTest.credentials.clientSecret}</div>
                  <div>{nombaTest.credentials.accountId}</div>
                  <div>{nombaTest.credentials.webhookSecret}</div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Authentication Test</h3>
                <div className="text-sm space-y-1">
                  <div>Status Code: <span className="font-mono">{nombaTest.authTest.statusCode}</span></div>
                  <div>Response Code: <span className="font-mono">{nombaTest.authTest.responseCode}</span></div>
                  <div>Description: {nombaTest.authTest.responseDescription}</div>
                  <div>Success: <span className={nombaTest.authTest.success ? 'text-green-600' : 'text-red-600'}>
                    {nombaTest.authTest.success ? '✅ Yes' : '❌ No'}
                  </span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Errors/Warnings</h3>
                <div className="text-sm space-y-1">
                  {nombaTest.errors.map((error, i) => (
                    <div key={i} className={error.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Test Timestamp: {new Date(nombaTest.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Failed Payments List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Failed Payments</h2>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : failedPayments.length === 0 ? (
            <p className="text-green-600">✅ No failed payments in the last 24 hours</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {failedPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-2 text-sm font-mono">{payment.order_number}</td>
                      <td className="px-4 py-2 text-sm">
                        <div>{payment.customer_name}</div>
                        <div className="text-gray-500 text-xs">{payment.customer_email}</div>
                      </td>
                      <td className="px-4 py-2 text-sm">₦{payment.total.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          {payment.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-xs">
                        {payment.payment_reference || 'None'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Common Nomba Issues & Fixes</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• <strong>Amount in wrong format:</strong> Must be in kobo (integer), not naira with decimals. Fixed: amount × 100</li>
            <li>• <strong>Missing credentials:</strong> Check .env.production for NOMBA_CLIENT_ID, NOMBA_CLIENT_SECRET, NOMBA_ACCOUNT_ID</li>
            <li>• <strong>Webhook not verifying:</strong> Set NOMBA_WEBHOOK_SECRET for security</li>
            <li>• <strong>Callback URL blocked:</strong> Ensure https://www.wingside.ng/payment/nomba/callback is accessible</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
