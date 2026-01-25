"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items?: any[];
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const orderNumberFromUrl = searchParams.get('orderNumber') || searchParams.get('id');

  const [orderNumber, setOrderNumber] = useState(orderNumberFromUrl || '');
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!orderNumberFromUrl);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch order data from API
  useEffect(() => {
    if (orderNumber) {
      fetchOrderData(orderNumber);
    }
  }, [orderNumber]);

  const fetchOrderData = async (orderNum: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/by-number/${orderNum}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Order not found');
        setOrderData(null);
        return;
      }

      if (data.orders && data.orders.length > 0) {
        setOrderData(data.orders[0]);
      } else {
        setError('Order not found');
        setOrderData(null);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to fetch order details. Please try again.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setOrderNumber(searchInput.trim());
    }
  };

  // Map order status to tracking stage index
  const getTrackingStage = (status: string): number => {
    const statusMap: Record<string, number> = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 1,
      'ready': 2,
      'out_for_delivery': 3,
      'delivered': 4,
      'completed': 4,
    };
    return statusMap[status.toLowerCase()] ?? 0;
  };

  // Get estimated time based on status
  const getEstimatedTime = (status: string): string => {
    const timeMap: Record<string, string> = {
      'pending': '5-10 mins',
      'confirmed': '15-20 mins',
      'preparing': '10-15 mins',
      'ready': '5-10 mins',
      'out_for_delivery': '15-30 mins',
      'delivered': 'Completed',
      'completed': 'Completed',
    };
    return timeMap[status.toLowerCase()] ?? 'N/A';
  };

  // Get status display text
  const getStatusText = (status: string): { title: string; subtitle: string } => {
    const textMap: Record<string, { title: string; subtitle: string }> = {
      'pending': { title: 'Order Received', subtitle: 'Waiting for confirmation' },
      'confirmed': { title: 'Order Confirmed!', subtitle: 'Your order has been confirmed' },
      'preparing': { title: 'Preparing Order', subtitle: 'Your delicious wings are being prepared' },
      'ready': { title: 'Ready for Delivery', subtitle: 'Your order is ready' },
      'out_for_delivery': { title: 'Out for Delivery', subtitle: 'On the way to you' },
      'delivered': { title: 'Delivered!', subtitle: 'Enjoy your meal!' },
      'completed': { title: 'Order Complete', subtitle: 'Thank you for your order!' },
      'cancelled': { title: 'Order Cancelled', subtitle: 'This order has been cancelled' },
    };
    return textMap[status.toLowerCase()] ?? { title: 'Order Status', subtitle: status };
  };

  const trackingStages = [
    { title: 'Order Confirmed', subtitle: 'Confirmed' },
    { title: 'Preparing Order', subtitle: 'Pending' },
    { title: 'Ready for Delivery', subtitle: 'Pending' },
    { title: 'Out for Delivery', subtitle: 'Pending' },
    { title: 'Delivered', subtitle: 'Pending' },
  ];

  // Update subtitles based on order data
  if (orderData) {
    const currentStage = getTrackingStage(orderData.status);
    trackingStages.forEach((stage, index) => {
      if (index < currentStage) {
        stage.subtitle = 'Completed';
      } else if (index === currentStage) {
        stage.subtitle = 'In Progress';
      } else {
        stage.subtitle = 'Pending';
      }
    });
  }

  const currentStage = orderData ? getTrackingStage(orderData.status) : 0;
  const estimatedTime = orderData ? getEstimatedTime(orderData.status) : 'N/A';
  const statusInfo = orderData ? getStatusText(orderData.status) : { title: 'Order Tracking', subtitle: '' };

  // Show search form if no order number in URL
  if (!orderNumberFromUrl && !orderNumber) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
              Track Your Order
            </h1>
            <p className="text-gray-600 text-lg">Enter your order number to track your delivery</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12">
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <label htmlFor="orderNumber" className="block text-sm font-semibold text-black mb-2">
                Order Number
              </label>
              <div className="flex gap-3">
                <input
                  id="orderNumber"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g., WS-12345"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#F7C400] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#e5b500] transition-colors"
                >
                  Track
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Find your order number in your confirmation email or SMS
              </p>
            </form>
          </div>

          <div className="text-center mt-8">
            <Link href="/my-account/orders" className="text-[#F7C400] hover:text-[#e5b500] font-medium">
              View all your orders →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-600 text-lg mb-2">Order #{orderNumber}</p>
            {error && <p className="text-red-600">{error}</p>}
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find an order with number <strong>{orderNumber}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Please check your order number and try again, or contact support if you need assistance.
            </p>
            <button
              onClick={() => {
                setOrderNumber('');
                setSearchInput('');
                setError('');
              }}
              className="bg-[#F7C400] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#e5b500] transition-colors"
            >
              Try Another Order Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-8 lg:px-16">
      {/* Back to Orders */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/my-account/orders" className="inline-flex items-center gap-2 text-black hover:text-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-medium">Back to Orders</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-2">
            Order Tracking
          </h1>
          <p className="text-gray-500 text-lg">Order #{orderData.order_number}</p>
          <p className="text-sm text-gray-400 mt-1">
            Placed on {new Date(orderData.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 mb-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 ${
              orderData.status === 'cancelled' ? 'bg-red-100' :
              orderData.status === 'delivered' || orderData.status === 'completed' ? 'bg-green-100' :
              'bg-yellow-100'
            } rounded-full flex items-center justify-center`}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                {orderData.status === 'cancelled' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                ) : orderData.status === 'delivered' || orderData.status === 'completed' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              {statusInfo.title}
            </h2>
            <p className="text-gray-600">
              {statusInfo.subtitle}
            </p>
          </div>

          {/* Progress Bar - Hide if cancelled */}
          {orderData.status !== 'cancelled' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-black">Order Progress</span>
                <span className="text-sm text-gray-500">Estimated time: {estimatedTime}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F7C400] transition-all duration-500"
                  style={{ width: `${((currentStage + 1) / trackingStages.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Order Tracking Timeline - Hide if cancelled */}
          {orderData.status !== 'cancelled' && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-6">Order Tracking</h3>
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200"></div>

                {/* Timeline Items */}
                <div className="space-y-6">
                  {trackingStages.map((stage, index) => {
                    const isActive = index === currentStage;
                    const isCompleted = index < currentStage;

                    return (
                      <div key={index} className="relative flex items-start gap-4">
                        {/* Circle Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive || isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isActive || isCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : null}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 pt-0.5">
                          <h4 className={`font-semibold ${
                            isActive || isCompleted ? 'text-black' : 'text-gray-400'
                          }`}>
                            {stage.title}
                          </h4>
                          <p className={`text-sm ${
                            isActive || isCompleted ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {stage.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Call Restaurant */}
          <a href="tel:+2341234567890" className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-[#F7C400] transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-black mb-1">Call Restaurant</h4>
              <p className="text-sm text-gray-600">Need help? Contact us</p>
            </div>
          </a>

          {/* Email Support */}
          <a href="mailto:reachus@wingside.ng" className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-[#F7C400] transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-black mb-1">Email Support</h4>
              <p className="text-sm text-gray-600">Get help via email</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
