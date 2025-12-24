"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product_name: string;
  product_size?: string;
  flavors?: string[];
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-indigo-100 text-indigo-700';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase() === 'delivered') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    );
  };

  const getOrderSummary = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      return 'No items';
    }

    const firstItem = order.items[0];
    let summary = firstItem.product_name;

    if (firstItem.flavors && firstItem.flavors.length > 0) {
      summary += ` + ${firstItem.flavors[0]}`;
    }

    if (firstItem.product_size) {
      summary += ` (${firstItem.product_size})`;
    }

    if (order.items.length > 1) {
      summary += ` + ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`;
    }

    return summary;
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;

    switch (filter) {
      case 'delivered':
        return orders.filter(o => o.status.toLowerCase() === 'delivered');
      case 'in-progress':
        return orders.filter(o =>
          !['delivered', 'cancelled'].includes(o.status.toLowerCase())
        );
      case 'cancelled':
        return orders.filter(o => o.status.toLowerCase() === 'cancelled');
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  // Calculate stats
  const totalOrders = orders.length;
  const deliveredCount = orders.filter(o => o.status.toLowerCase() === 'delivered').length;
  const inProgressCount = orders.filter(o =>
    !['delivered', 'cancelled'].includes(o.status.toLowerCase())
  ).length;
  const cancelledCount = orders.filter(o => o.status.toLowerCase() === 'cancelled').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="wallet-history-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="wallet-history-header">
          <h1 className="wallet-history-title">My Orders</h1>
          <p className="wallet-history-subtitle">View and track your wing orders</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="wallet-stats-grid mb-6">
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Total Orders</p>
            <p className="wallet-stat-value">{totalOrders}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Delivered</p>
            <p className="wallet-stat-value">{deliveredCount}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">In Progress</p>
            <p className="wallet-stat-value">{inProgressCount}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Cancelled</p>
            <p className="wallet-stat-value">{cancelledCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="wallet-filters mb-6">
          <div className="wallet-filter-select-wrapper">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="wallet-filter-select"
            >
              <option value="all">All Orders</option>
              <option value="delivered">Delivered</option>
              <option value="in-progress">In Progress</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <svg className="wallet-filter-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/my-account/orders/${order.id}`}
              className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Order #{order.order_number}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getOrderSummary(order)}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white group-hover:bg-gray-50 transition-colors">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter.replace('-', ' ')} orders`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Start your wing journey by placing your first order!'
                : 'Try changing your filter to see more orders'}
            </p>
            {filter === 'all' && (
              <Link href="/order" className="btn-primary inline-block">
                Order Now
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
