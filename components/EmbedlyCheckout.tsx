"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface EmbedlyCheckoutProps {
  orderId: string
  orderNumber: string
  amount: number
  customerEmail: string
  customerName: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function EmbedlyCheckout({
  orderId,
  orderNumber,
  amount,
  customerEmail,
  customerName,
  onSuccess,
  onError,
}: EmbedlyCheckoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending')
  const [error, setError] = useState<string>('')
  const [pollAttempts, setPollAttempts] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  // Initialize checkout wallet
  const initializeWallet = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/payment/embedly/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          customer_email: customerEmail,
          customer_name: customerName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      if (data.alreadyPaid) {
        setPaymentStatus('success')
        onSuccess?.()
        return
      }

      setWallet(data.wallet)

      // Calculate expiry time
      const expiresAt = new Date(data.wallet.expiresAt)
      const now = new Date()
      const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
      setTimeLeft(timeUntilExpiry)

      setShowInstructions(true)

      // Start polling for payment
      startPolling(data.wallet.id)
    } catch (err: any) {
      console.error('[Embedly Checkout] Error:', err)
      setError(err.message || 'Failed to initialize payment')
      setPaymentStatus('failed')
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }, [orderId, customerEmail, customerName, onSuccess, onError])

  // Poll for payment status
  const startPolling = useCallback((walletId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/embedly/check-wallet?walletId=${walletId}`)
        const data = await response.json()

        if (data.hasPayment) {
          clearInterval(pollInterval)
          setPaymentStatus('success')
          setTimeLeft(0)
          onSuccess?.()

          // Redirect after 3 seconds
          setTimeout(() => {
            router.push(`/order-confirmation?orderNumber=${orderNumber}`)
          }, 3000)
          return
        }

        setPollAttempts(prev => prev + 1)

        // Stop polling after 30 minutes (wallet expires)
        if (data.status === 'Expired' || pollAttempts >= 180) {
          clearInterval(pollInterval)
          setPaymentStatus('failed')
          setError('Payment window has expired. Please try again.')
        }
      } catch (err) {
        console.error('[Embedly Checkout] Poll error:', err)
      }
    }, 5000) // Poll every 5 seconds

    // Cleanup on unmount
    return () => clearInterval(pollInterval)
  }, [orderNumber, onSuccess, router, pollAttempts])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setPaymentStatus('failed')
          setError('Payment window has expired. Please try again.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Initialize on mount
  useEffect(() => {
    initializeWallet()
  }, [initializeWallet])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F7C400] mb-4"></div>
        <p className="text-gray-600">Initializing payment...</p>
      </div>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">Your order has been confirmed</p>
        <p className="text-sm text-gray-500">Redirecting to order confirmation...</p>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h3>
        <p className="text-gray-600 mb-6">{error || 'Unable to process payment'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={initializeWallet}
            className="bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/order')}
            className="border-2 border-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#FDF5E5] transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Payment Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <p className="font-semibold text-blue-900">Waiting for Payment</p>
              <p className="text-sm text-blue-700">Transfer the amount below to complete your order</p>
            </div>
          </div>
          {timeLeft > 0 && (
            <div className="text-right">
              <p className="text-sm text-blue-700">Expires in</p>
              <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-900'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Transfer Details */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Transfer Details</h3>

        <div className="space-y-4">
          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={wallet?.accountNumber || ''}
                className="flex-1 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(wallet?.accountNumber || '')
                  alert('Account number copied!')
                }}
                className="bg-[#F7C400] text-[#552627] px-4 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <div className="text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3">
              {wallet?.bankName || 'Embedly'}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="text-2xl font-bold text-[#F7C400] bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3">
              ₦{amount.toLocaleString()}
            </div>
            <p className="text-sm text-red-600 mt-1">⚠️ Transfer EXACT amount to avoid delays</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="bg-[#FDF5E5] border border-[#F7C400] rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#552627] mb-3">How to Pay</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-[#F7C400]">1.</span>
              <span>Copy the account number above</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#F7C400]">2.</span>
              <span>Open your banking app (or use USSD)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#F7C400]">3.</span>
              <span>Transfer <strong>₦{amount.toLocaleString()}</strong> to the account</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#F7C400]">4.</span>
              <span>Payment will be detected automatically (within 1-2 minutes)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#F7C400]">5.</span>
              <span>You'll receive confirmation via email</span>
            </li>
          </ol>
        </div>
      )}

      {/* Auto-check notification */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Checking for payment... <span className="font-semibold">Do not close this page</span>
      </div>
    </div>
  )
}
