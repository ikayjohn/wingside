"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function NombaPaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status'); // Nomba may pass status
  const orderRef = searchParams.get('orderRef');

  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'error'>('error');
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else {
      // No order ID means invalid callback
      setVerifying(false);
      setPaymentStatus('failed');
      setMessage('Payment was cancelled or order not found.');
    }
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      // Step 1: Check order status immediately by ID
      const orderResponse = await fetch(`/api/orders/get-by-id?orderId=${orderId}`);
      const orderData = await orderResponse.json();

      if (!orderData.order) {
        throw new Error('Order not found');
      }

      let order = orderData.order;

      // Step 2: If already paid, show success immediately
      if (order.payment_status === 'paid' || order.status === 'confirmed') {
        setPaymentStatus('success');
        setMessage('Payment successful! Your order has been confirmed.');
        setOrderNumber(order.order_number);
        setVerifying(false);

        // Redirect to order confirmation after 3 seconds
        setTimeout(() => {
          router.push(`/order-confirmation?orderNumber=${order.order_number}`);
        }, 3000);
        return;
      }

      // Step 3: Not paid yet - poll for webhook processing (2 minutes max)
      console.log('[Callback] Order not paid yet, waiting for webhook...');
      const maxAttempts = 60; // 60 attempts × 2 seconds = 2 minutes
      let attempts = 0;

      while (attempts < maxAttempts) {
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check order status
        const checkResponse = await fetch(`/api/orders/get-by-id?orderId=${orderId}`);
        const checkData = await checkResponse.json();

        if (checkData.order?.payment_status === 'paid' || checkData.order?.status === 'confirmed') {
          console.log('[Callback] Webhook processed payment!');
          setPaymentStatus('success');
          setMessage('Payment successful! Your order has been confirmed.');
          setOrderNumber(checkData.order.order_number);
          setVerifying(false);

          // Redirect to confirmation
          setTimeout(() => {
            router.push(`/order-confirmation?orderNumber=${checkData.order.order_number}`);
          }, 2000);
          return;
        }

        attempts++;
        console.log(`[Callback] Attempt ${attempts}/${maxAttempts} - still waiting...`);
      }

      // Step 4: After 2 minutes, check if webhook actually was called
      console.log('[Callback] Timeout waiting for webhook');
      
      // Final check - maybe webhook processed right at the end
      const finalResponse = await fetch(`/api/orders/get-by-id?orderId=${orderId}`);
      const finalData = await finalResponse.json();

      if (finalData.order?.payment_status === 'paid' || finalData.order?.status === 'confirmed') {
        console.log('[Callback] Webhook processed at the last moment!');
        setPaymentStatus('success');
        setMessage('Payment successful! Your order has been confirmed.');
        setOrderNumber(finalData.order.order_number);
        setVerifying(false);

        setTimeout(() => {
          router.push(`/order-confirmation?orderNumber=${finalData.order.order_number}`);
        }, 2000);
        return;
      }

      // If still not paid, show helpful error
      setPaymentStatus('error');
      setOrderNumber(finalData.order?.order_number);
      
      // Provide more specific error message
      if (finalData.order?.payment_reference && finalData.order?.payment_gateway === 'nomba') {
        // Payment was initiated with Nomba but webhook hasn't processed it
        setMessage('Payment is being processed. Your order has been received! Please check your email for confirmation or view your order history in a few minutes. Order: ' + (finalData.order.order_number || orderId));
      } else {
        setMessage('Unable to verify payment status immediately. Please check your email for confirmation or contact support with your order number: ' + (finalData.order?.order_number || orderId));
      }
      
      setVerifying(false);

      // DON'T cancel the order - the webhook might still process it!

    } catch (error) {
      console.error('Error checking payment status:', error);

      setPaymentStatus('error');
      setMessage('Unable to verify payment status. Please check your email for confirmation or contact support with your order number.');
      setVerifying(false);

      // DON'T cancel the order on errors - could be a network issue
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F7C400] mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {paymentStatus === 'success' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-3">Payment Successful!</h1>
            <p className="text-gray-700 mb-6">{message}</p>
            {orderNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">Redirecting to order confirmation...</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/order-confirmation?orderNumber=${orderNumber}`)}
                className="flex-1 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
              >
                View Order
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-orange-600 mb-3">Payment Failed</h1>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Restore cart from failed order
                  if (orderId) {
                    try {
                      const orderResponse = await fetch(`/api/orders/${orderId}`);
                      const orderData = await orderResponse.json();
                      if (orderData.order && orderData.order.items) {
                        // Reconstruct cart from order items
                        const cart = orderData.order.items.map((item: any) => ({
                          id: item.product_id,
                          name: item.product_name,
                          flavor: item.flavor,
                          size: item.size,
                          quantity: item.quantity,
                          price: item.unit_price,
                        }));
                        localStorage.setItem('wingside-cart', JSON.stringify(cart));
                      }
                    } catch (error) {
                      console.error('Error restoring cart:', error);
                    }
                  }
                  router.push('/checkout');
                }}
                className="flex-1 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/order')}
                className="flex-1 border-2 border-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#FDF5E5] transition-colors"
              >
                Start a New Order
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-3">Verification Error</h1>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NombaPaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F7C400] mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    }>
      <NombaPaymentCallbackContent />
    </Suspense>
  );
}
