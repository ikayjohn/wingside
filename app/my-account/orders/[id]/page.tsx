"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount_amount: number;
  total: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_text: string;
  items: OrderItem[];
  notes?: string;
}

interface TimelineEvent {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        // Fetch order by ID using orderId query parameter
        const response = await fetch(`/api/orders?orderId=${orderId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        const orders = data.orders || [];

        if (orders.length > 0) {
          setOrder(orders[0]);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getTimelineEvents = (orderStatus: string): TimelineEvent[] => {
    const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statusFlow.indexOf(orderStatus);

    const events: TimelineEvent[] = [
      {
        status: 'pending',
        label: 'Order Placed',
        description: 'Your order has been received',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        ),
        completed: currentIndex >= 0,
        current: currentIndex === 0,
      },
      {
        status: 'confirmed',
        label: 'Order Confirmed',
        description: 'Your order has been confirmed',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        ),
        completed: currentIndex >= 1,
        current: currentIndex === 1,
      },
      {
        status: 'preparing',
        label: 'Preparing',
        description: 'Your order is being prepared',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
          </svg>
        ),
        completed: currentIndex >= 2,
        current: currentIndex === 2,
      },
      {
        status: 'ready',
        label: 'Ready for Pickup/Delivery',
        description: 'Your order is ready',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        ),
        completed: currentIndex >= 3,
        current: currentIndex === 3,
      },
      {
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'Your order is on the way',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        ),
        completed: currentIndex >= 4,
        current: currentIndex === 4,
      },
      {
        status: 'delivered',
        label: 'Delivered',
        description: 'Your order has been delivered',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        ),
        completed: currentIndex >= 5,
        current: currentIndex === 5,
      },
    ];

    // If cancelled, just return pending as completed and cancelled as current
    if (orderStatus === 'cancelled') {
      return [
        { ...events[0], completed: true, current: false },
        {
          status: 'cancelled',
          label: 'Order Cancelled',
          description: 'Your order has been cancelled',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          ),
          completed: false,
          current: true,
        },
      ];
    }

    return events;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
            <Link href="/my-account/dashboard" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timelineEvents = getTimelineEvents(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print-only Header */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wingside</h1>
        <p className="text-sm text-gray-600">Order Receipt</p>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="wallet-history-back inline-flex items-center gap-2 mb-6 print:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
              <p className="text-gray-600">Order #{order.order_number}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors print:hidden"
                title="Print order"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print
              </button>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline & Order Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Status Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={event.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                        ${event.current ? 'bg-[#F7C400] text-white ring-4 ring-yellow-100' :
                          event.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
                      `}>
                        {event.icon}
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className={`
                          w-0.5 h-16 my-2
                          ${event.completed ? 'bg-green-500' : 'bg-gray-200'}
                        `}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <h3 className={`font-semibold text-lg ${event.current ? 'text-[#F7C400]' : event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {event.label}
                      </h3>
                      <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
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
          </div>

          {/* Right Column - Order Info */}
          <div className="space-y-6">

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="text-gray-900 font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{order.customer_email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900 font-medium">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
              <p className="text-gray-700">{order.delivery_address_text}</p>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="text-gray-900 font-medium capitalize">{order.payment_method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {order.payment_status === 'paid' ? 'Total Paid' : 'Order Total'}
                  </span>
                  <span className="text-gray-900 font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number</span>
                  <span className="text-gray-900 font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date Placed</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 rounded-xl p-6 print:hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h2>
              <p className="text-gray-600 text-sm mb-4">
                Have questions about your order? Contact our support team.
              </p>
              <Link href="/contact" className="inline-block bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Contact Support
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
