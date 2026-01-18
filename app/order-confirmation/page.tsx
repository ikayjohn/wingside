"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OrderItem {
  product_name: string;
  product_size: string;
  flavors: string[] | null;
  addons: any;
  quantity: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_text: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    } else {
      setError('No order number provided');
      setLoading(false);
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/by-number/${orderNumber}`);
      const data = await response.json();

      if (response.ok && data.orders && data.orders.length > 0) {
        setOrder(data.orders[0]);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7C400] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/order" className="inline-block bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#552627] mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">Thank you for your order. We've sent a confirmation email to <span className="font-medium">{order.customer_email}</span></p>
          <div className="inline-block bg-[#FDF5E5] px-6 py-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-[#552627]">{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Payment Pending Warning */}
      {order.payment_status === 'pending' && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-yellow-800">Payment Pending</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your order has been created but payment has not been completed. Please complete your payment to confirm your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Order Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Status</h3>
            <p className="text-lg font-bold text-[#F7C400] capitalize">{order.status}</p>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Payment Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              order.payment_status === 'paid'
                ? 'bg-green-100 text-green-800'
                : order.payment_status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status === 'pending' ? '⏳ Pending Payment' : '✗ ' + order.payment_status}
            </span>
          </div>

          {/* Order Date */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Date</h3>
            <p className="text-lg font-medium text-gray-900">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-[#552627] mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600">{item.product_size}</p>
                        {item.flavors && item.flavors.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">Flavors: {item.flavors.join(', ')}</p>
                        )}
                        {item.addons && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.addons.rice && <p>Rice: {Array.isArray(item.addons.rice) ? item.addons.rice.join(', ') : item.addons.rice}</p>}
                            {item.addons.drink && <p>Drink: {Array.isArray(item.addons.drink) ? item.addons.drink.join(', ') : item.addons.drink}</p>}
                            {item.addons.milkshake && <p>Milkshake: {item.addons.milkshake}</p>}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-gray-900">{formatPrice(item.total_price)}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No items found</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{formatPrice(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (7.5%)</span>
                <span className="font-medium">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-[#552627] mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{order.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address / Pickup Location */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {order.delivery_fee === 0 || order.delivery_address_text?.toLowerCase().includes('pickup') ? (
                <>
                  <h2 className="text-xl font-bold text-[#552627] mb-4">Pickup Location</h2>
                  <p className="text-gray-900">{order.delivery_address_text}</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#552627] mb-4">Delivery Address</h2>
                  <p className="text-gray-900">{order.delivery_address_text}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/order-tracking?orderNumber=${order.order_number}`}
            className="inline-flex items-center justify-center bg-[#F7C400] text-[#552627] px-8 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Track Order
          </Link>
          <Link
            href="/order"
            className="inline-flex items-center justify-center border-2 border-[#F7C400] text-[#552627] px-8 py-3 rounded-lg font-semibold hover:bg-[#FDF5E5] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-[#FDF5E5] rounded-lg p-6 text-center">
          <h3 className="font-bold text-[#552627] mb-2">Need Help?</h3>
          <p className="text-gray-700 mb-4">If you have any questions about your order, please contact us.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="tel:+2348090191999" className="text-[#552627] hover:underline font-medium">
              📞 +234 809 019 1999
            </a>
            <a href="mailto:reachus@wingside.ng" className="text-[#552627] hover:underline font-medium">
              ✉️ reachus@wingside.ng
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7C400] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
