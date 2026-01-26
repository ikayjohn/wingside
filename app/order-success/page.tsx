"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

interface OrderItem {
  id: string;
  product_name: string;
  product_size: string;
  flavors: string[] | null;
  addons: any;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  created_at: string;
  delivery_address_text: string;
  items: OrderItem[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Try orderId first, then order_number
        const response = await fetch(`/api/orders?orderId=${orderId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();

        if (data.orders && data.orders.length > 0) {
          // Get the first order with its items
          const fetchedOrder = data.orders[0];
          setOrder(fetchedOrder);
        } else {
          setError('Order not found');
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'We couldn\'t find your order details.'}</p>
          <Link href="/order" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
            Place New Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      <div className="bg-green-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-green-100 text-lg">Thank you for your order</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Number & Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-gray-900">{order.order_number}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>

          {/* Order Items */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                  {item.product_size && (
                    <p className="text-sm text-gray-500">Size: {item.product_size}</p>
                  )}
                  {item.flavors && item.flavors.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Flavors: {Array.isArray(item.flavors) ? item.flavors.join(', ') : item.flavors}
                    </p>
                  )}
                  {item.addons && (
                    <p className="text-sm text-gray-500">
                      Add-ons: {Object.entries(item.addons).map(([key, value]) =>
                        Array.isArray(value) ? value.join(', ') : value
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.unit_price)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">Address:</span> {order.delivery_address_text}
            </p>
            <p className="text-sm text-gray-500">
              Order placed on {new Date(order.created_at).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">What's Next?</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-blue-600">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>You'll receive an email confirmation with your order details</span>
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-blue-600">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>We'll start preparing your order immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-blue-600">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Track your order status in your dashboard</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/my-account/orders/${order.id}`}
            className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors text-center"
          >
            Track Order
          </Link>
          <Link
            href="/order"
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Order Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your order...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
