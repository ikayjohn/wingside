"use client"

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { EmbedlyCheckout } from '@/components/EmbedlyCheckout'

function EmbedlyCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const orderNumber = searchParams.get('orderNumber')
  const amount = searchParams.get('amount')
  const customerEmail = searchParams.get('customerEmail')
  const customerName = searchParams.get('customerName')

  const [showCheckout, setShowCheckout] = React.useState(false)

  React.useEffect(() => {
    if (orderId) {
      setShowCheckout(true)
    }
  }, [orderId])

  const handleSuccess = () => {
    // Redirect handled by EmbedlyCheckout component
  }

  const handleError = (error: string) => {
    console.error('[Embedly Callback] Payment error:', error)
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-3">Invalid Request</h1>
          <p className="text-gray-700 mb-6">Order information is missing. Please try again.</p>
          <button
            onClick={() => router.push('/order')}
            className="bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#552627] mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Order {orderNumber || orderId}</p>
        </div>

        {/* Checkout Component */}
        {showCheckout && (
          <EmbedlyCheckout
            orderId={orderId}
            orderNumber={orderNumber || ''}
            amount={parseFloat(amount || '0')}
            customerEmail={customerEmail || ''}
            customerName={customerName || ''}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}

        {/* Support Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Need help? Contact us at:</p>
          <p className="font-semibold">support@wingside.ng</p>
        </div>
      </div>
    </div>
  )
}

export default function EmbedlyCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F7C400] mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <EmbedlyCallbackContent />
    </Suspense>
  )
}
