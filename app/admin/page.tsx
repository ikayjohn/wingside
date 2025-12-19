"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Fetch pending orders count
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      setStats({
        totalOrders: ordersCount || 0,
        pendingOrders: pendingCount || 0,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#552627] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Orders</p>
          <p className="text-3xl font-bold text-[#552627]">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold mb-2">Pending Orders</p>
          <p className="text-3xl font-bold text-[#F7C400]">{stats.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Products</p>
          <p className="text-3xl font-bold text-[#552627]">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Customers</p>
          <p className="text-3xl font-bold text-[#552627]">{stats.totalCustomers}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-[#552627] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/products"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">Manage Products</p>
          </a>
          <a
            href="/admin/orders"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">View Orders</p>
          </a>
          <a
            href="/admin/delivery-areas"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">Delivery Areas</p>
          </a>
          <a
            href="/admin/promo-codes"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">Promo Codes</p>
          </a>
          <a
            href="/admin/customers"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">View Customers</p>
          </a>
          <a
            href="/admin/pickup-locations"
            className="block p-4 border-2 border-[#F7C400] rounded-lg hover:bg-[#FDF5E5] transition-colors text-center"
          >
            <p className="font-semibold text-[#552627]">Stores List</p>
          </a>
        </div>
      </div>
    </div>
  );
}
