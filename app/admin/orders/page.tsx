"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_text?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  notes?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_size?: string;
  flavors?: string[];
  addons?: any;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  delivery_date?: string;
  delivery_time?: string;
}

interface OrderDetails extends Order {
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedOrderNumber, setHighlightedOrderNumber] = useState<string | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Handle ?order= query parameter
  useEffect(() => {
    const orderNumber = searchParams.get('order');
    if (orderNumber) {
      setSearchTerm(orderNumber);
      setHighlightedOrderNumber(orderNumber);
      // Clear filter to show all orders when searching
      setFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // Auto-open order details when orders load and we have a highlighted order
  useEffect(() => {
    if (highlightedOrderNumber && orders.length > 0) {
      const order = orders.find(o => o.order_number === highlightedOrderNumber);
      if (order) {
        fetchOrderDetails(order.id);
        // Clear highlight after opening
        setTimeout(() => setHighlightedOrderNumber(null), 2000);
      }
    }
  }, [orders, highlightedOrderNumber]);

  async function fetchOrders() {
    try {
      const response = await fetch(`/api/admin/orders/list?filter=${filter}`);

      if (!response.ok) {
        console.error('Error fetching orders:', response.status);
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderDetails(orderId: string) {
    setLoadingDetails(true);
    try {
      // Fetch order details via API
      const response = await fetch(`/api/admin/orders/${orderId}`);

      if (!response.ok) {
        console.error('Error fetching order:', response.status);
        alert('Failed to load order details');
        return;
      }

      const data = await response.json();
      const order = data.order;

      // Order already includes items from API
      setSelectedOrder(order);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        console.error('Error updating order:', response.status);
        alert('Failed to update order');
        return;
      }

      // Refresh orders
      fetchOrders();

      // Update selected order if it's open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦');
  };

  const formatAddons = (addons: any) => {
    if (!addons) return null;

    const items: string[] = [];

    // Handle different addon formats
    if (typeof addons === 'object') {
      // Handle rice selection
      if (addons.rice) {
        items.push(`Rice: ${addons.rice}`);
      }
      // Handle drink selection
      if (addons.drink) {
        items.push(`Drink: ${addons.drink}`);
      }
      // Handle other selections
      Object.keys(addons).forEach(key => {
        if (key !== 'rice' && key !== 'drink' && addons[key]) {
          items.push(`${key}: ${addons[key]}`);
        }
      });
    }

    return items.length > 0 ? items : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'picked_up':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading orders...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-[#552627]">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 print:hidden">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'all'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'pending'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'confirmed'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'preparing'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Preparing
        </button>
        <button
          onClick={() => setFilter('ready')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'ready'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Ready
        </button>
        <button
          onClick={() => setFilter('out_for_delivery')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'out_for_delivery'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Out for Delivery
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'delivered'
            ? 'bg-[#F7C400] text-black'
            : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Delivered
        </button>
        <button
          onClick={() => setFilter('picked_up')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'picked_up'
              ? 'bg-[#F7C400] text-black'
              : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Picked Up
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'cancelled'
              ? 'bg-[#F7C400] text-black'
              : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
          Cancelled
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 print:hidden">
        <input
          type="text"
          placeholder="Search by order number, customer name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
        />
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200 print:hidden">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders
                .filter((order) => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    order.order_number.toLowerCase().includes(term) ||
                    (order.customer_name || '').toLowerCase().includes(term) ||
                    (order.customer_email || '').toLowerCase().includes(term) ||
                    (order.customer_phone || '').toLowerCase().includes(term)
                  );
                })
                .map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 ${highlightedOrderNumber === order.order_number
                      ? 'bg-yellow-50 ring-2 ring-[#F7C400] ring-inset'
                      : ''
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Print-only Header */}
              <div className="hidden print:block text-center mb-8 border-b-2 border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Wingside</h1>
                <p className="text-sm text-gray-600">Order Receipt - Admin Copy</p>
              </div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Print order"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading order details...</p>
                </div>
              ) : (
                <>
                  {/* Status and Payment */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Order Status</p>
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {selectedOrder.payment_status}
                      </span>
                      {selectedOrder.payment_method && (
                        <p className="text-xs text-gray-500 mt-1">via {selectedOrder.payment_method}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedOrder.customer_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedOrder.customer_phone}</span>
                      </div>
                      {selectedOrder.delivery_address_text && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">{selectedOrder.delivery_address_text}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Flavors</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Add-ons</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.items.map((item) => {
                            const addonItems = formatAddons(item.addons);
                            const hasItemDetails = item.notes || item.delivery_date || item.delivery_time;

                            return (
                              <React.Fragment key={item.id}>
                                <tr>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {item.product_name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {item.product_size || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {item.flavors && item.flavors.length > 0 ? (
                                      <div className="text-xs">
                                        {item.flavors.join(', ')}
                                      </div>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {addonItems && addonItems.length > 0 ? (
                                      <div className="text-xs space-y-1">
                                        {addonItems.map((addon, idx) => (
                                          <div key={idx}>{addon}</div>
                                        ))}
                                      </div>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {formatPrice(item.unit_price)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                    {formatPrice(item.total_price)}
                                  </td>
                                </tr>
                                {hasItemDetails && (
                                  <tr key={`${item.id}-details`} className="bg-yellow-50">
                                    <td colSpan={7} className="px-4 py-3">
                                      <div className="space-y-1.5">
                                        {item.delivery_date && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-pink-700">📅 Delivery Date:</span>
                                            <span className="text-gray-900">
                                              {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                        )}
                                        {item.delivery_time && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-pink-700">🕒 Delivery Time:</span>
                                            <span className="text-gray-900">{item.delivery_time}</span>
                                          </div>
                                        )}
                                        {item.notes && (
                                          <div className="text-sm">
                                            <span className="font-semibold text-pink-700">💌 Special Note:</span>
                                            <div className="mt-1 p-3 bg-white border border-pink-200 rounded-lg text-gray-900 italic">
                                              "{item.notes}"
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span className="font-medium">{formatPrice(selectedOrder.delivery_fee)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Notes</h3>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
