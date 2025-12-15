"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get('id');

  // Mock order data - in production, this would come from API based on order ID
  const [orderNumber, setOrderNumber] = useState('WS-09847');
  const [currentStage] = useState(0); // 0 = Order Confirmed, 1 = Preparing, etc.
  const [estimatedTime] = useState('10 mins');

  useEffect(() => {
    if (orderIdFromUrl) {
      setOrderNumber(orderIdFromUrl);
    }
  }, [orderIdFromUrl]);

  const trackingStages = [
    { title: 'Order Confirmed', subtitle: 'Just now' },
    { title: 'Preparing Order', subtitle: 'Pending' },
    { title: 'Ready for Delivery', subtitle: 'Pending' },
    { title: 'Out for Delivery', subtitle: 'Pending' },
    { title: 'Delivered', subtitle: 'Pending' },
  ];

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
          <p className="text-gray-500 text-lg">Order #{orderNumber}</p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 mb-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              Order Confirmed!
            </h2>
            <p className="text-gray-600">
              Your order has been received and confirmed
            </p>
          </div>

          {/* Progress Bar */}
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

          {/* Order Tracking Timeline */}
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
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Call Restaurant */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-[#F7C400] transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-black mb-1">Call Restaurant</h4>
              <p className="text-sm text-gray-600">Need help? Contact us</p>
            </div>
          </div>

          {/* Live Chat */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-[#F7C400] transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-black mb-1">Live Chat</h4>
              <p className="text-sm text-gray-600">Chat with support</p>
            </div>
          </div>
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
          <div className="text-center">
            <p className="text-gray-500">Loading order details...</p>
          </div>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
