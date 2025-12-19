"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatCard, BarChart, ProgressBar } from '@/components/admin/Charts';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  popularProducts: Array<{ name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topFlavors: Array<{ name: string; count: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    popularProducts: [],
    revenueByDay: [],
    ordersByStatus: [],
    topFlavors: [],
    revenueByCategory: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const supabase = createClient();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  async function fetchAnalyticsData() {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      const dateFilter = daysAgo.toISOString();

      // Fetch orders with date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id(name, category_id),
          categories:products!inner(category_id(name))
        `);

      if (itemsError) throw itemsError;

      // Calculate basic metrics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by day
      const revenueByDay = aggregateRevenueByDay(orders || []);

      // Orders by status
      const ordersByStatus = aggregateOrdersByStatus(orders || []);

      // Popular products
      const popularProducts = aggregatePopularProducts(orderItems || []);

      // Top flavors
      const topFlavors = aggregateTopFlavors(orderItems || []);

      // Revenue by category
      const revenueByCategory = await aggregateRevenueByCategory(orderItems || []);

      // Recent orders
      const recentOrders = orders?.slice(0, 10).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total: order.total,
        status: order.status,
        created_at: order.created_at
      })) || [];

      setSalesData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        popularProducts,
        revenueByDay,
        ordersByStatus,
        topFlavors,
        revenueByCategory,
        recentOrders
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateRevenueByDay(orders: Array<{ created_at: string; total: number }>) {
    const dailyData: { [key: string]: { revenue: number; orders: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.total;
      dailyData[date].orders += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }

  function aggregateOrdersByStatus(orders: Array<{ status: string }>) {
    const statusCount: { [key: string]: number } = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count
    }));
  }

  function aggregatePopularProducts(orderItems: Array<{ product_name?: string; quantity: number; total_price: number }>) {
    const productData: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    
    orderItems.forEach(item => {
      const productName = item.product_name || 'Unknown Product';
      if (!productData[productName]) {
        productData[productName] = { name: productName, quantity: 0, revenue: 0 };
      }
      productData[productName].quantity += item.quantity;
      productData[productName].revenue += item.total_price;
    });

    return Object.values(productData)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  function aggregateTopFlavors(orderItems: Array<{ flavors?: string[]; quantity: number }>) {
    const flavorCount: { [key: string]: number } = {};
    
    orderItems.forEach(item => {
      if (item.flavors && Array.isArray(item.flavors)) {
        item.flavors.forEach((flavor: string) => {
          flavorCount[flavor] = (flavorCount[flavor] || 0) + item.quantity;
        });
      }
    });

    return Object.entries(flavorCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async function aggregateRevenueByCategory(orderItems: Array<{ categories?: { name?: string }; total_price: number }>) {
    const categoryRevenue: { [key: string]: number } = {};
    
    orderItems.forEach(item => {
      const category = item.categories?.name || 'Other';
      categoryRevenue[category] = (categoryRevenue[category] || 0) + item.total_price;
    });

    return Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue
    }));
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'out for delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#552627]">Sales Analytics</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatPrice(salesData.totalRevenue)}
          subtitle={`${salesData.totalOrders} orders`}
          color="#552627"
        />
        <StatCard
          title="Average Order Value"
          value={formatPrice(salesData.averageOrderValue)}
          subtitle="Per order"
          color="#F7C400"
        />
        <StatCard
          title="Total Orders"
          value={salesData.totalOrders}
          subtitle="In selected period"
          color="#552627"
        />
        <StatCard
          title="Conversion Rate"
          value="--"
          subtitle="Visitors to orders"
          color="#552627"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Revenue Trend (Last 14 days)</h2>
          <BarChart
            data={salesData.revenueByDay.slice(-14).map((day) => ({
              label: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
              value: day.revenue,
              color: "#F7C400"
            }))}
            height={256}
          />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {salesData.ordersByStatus.map((status) => (
              <ProgressBar
                key={status.status}
                value={status.count}
                max={salesData.totalOrders}
                label={status.status}
                color="#552627"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Popular Products</h2>
          <div className="space-y-3">
            {salesData.popularProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} sold</p>
                </div>
                <span className="text-sm font-semibold text-[#552627]">
                  {formatPrice(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Flavors */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Top Flavors</h2>
          <div className="space-y-3">
            {salesData.topFlavors.slice(0, 5).map((flavor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{flavor.name}</span>
                <span className="text-sm font-semibold text-[#552627]">{flavor.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-[#552627] mb-4">Revenue by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesData.revenueByCategory.map((category) => (
            <div key={category.category} className="text-center">
              <p className="text-lg font-semibold text-[#552627]">{formatPrice(category.revenue)}</p>
              <p className="text-sm text-gray-600">{category.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-[#552627] mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesData.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.customer_name}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}