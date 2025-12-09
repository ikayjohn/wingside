"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');

  // Mock orders data
  const orders = [
    {
      id: 'WG2024128',
      date: 'Jan 26, 2024 03:15 PM',
      items: 'Buffalo Classic + BBQ Smoky (12 wings)',
      total: 24000,
      status: 'delivered',
      statusColor: 'green',
    },
    {
      id: 'WG2024127',
      date: 'Jan 25, 2024 07:30 PM',
      items: 'Honey Garlic + Lemon Pepper (18 wings)',
      total: 32000,
      status: 'delivered',
      statusColor: 'green',
    },
    {
      id: 'WG2024126',
      date: 'Jan 24, 2024 12:45 PM',
      items: 'Spicy Korean + Teriyaki (12 wings)',
      total: 28000,
      status: 'cancelled',
      statusColor: 'red',
    },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    );
  };

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

        {/* Stats Cards */}
        <div className="wallet-stats-grid mb-6">
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Total Orders</p>
            <p className="wallet-stat-value">{orders.length}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Delivered</p>
            <p className="wallet-stat-value">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">In Progress</p>
            <p className="wallet-stat-value">0</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Cancelled</p>
            <p className="wallet-stat-value">{orders.filter(o => o.status === 'cancelled').length}</p>
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
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      order.statusColor === 'green'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.items}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {order.date}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-xl font-bold text-gray-900">₦{order.total.toLocaleString()}</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (shown when no orders) */}
        {orders.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start your wing journey by placing your first order!</p>
            <Link href="/order" className="btn-primary inline-block">
              Order Now
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
