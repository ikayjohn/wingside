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
  topFlavors: Array<{ name: string; count: number; percentage: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  peakHours: Array<{ hour: number; count: number; revenue: number; label: string }>;
  customerInsights: {
    totalCustomers: number;
    repeatCustomers: number;
    averageOrdersPerCustomer: number;
    customerLTV: number;
    topCustomers: Array<{ name: string; email: string; orders: number; totalSpent: number }>;
    newCustomers: number;
    returningCustomers: number;
    repeatCustomerRate: number;
  };
  periodComparison: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
  };
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
    recentOrders: [],
    peakHours: [],
    customerInsights: {
      totalCustomers: 0,
      repeatCustomers: 0,
      averageOrdersPerCustomer: 0,
      customerLTV: 0,
      topCustomers: [],
      newCustomers: 0,
      returningCustomers: 0,
      repeatCustomerRate: 0,
    },
    periodComparison: {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      revenueChange: 0,
      ordersChange: 0,
      aovChange: 0,
    },
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
      const days = parseInt(dateRange);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      const dateFilter = daysAgo.toISOString();

      console.log(`📅 Fetching analytics for last ${days} days (from ${daysAgo.toLocaleDateString()})`);

      // Previous period for comparison
      const previousDaysAgo = new Date();
      previousDaysAgo.setDate(previousDaysAgo.getDate() - (days * 2));
      const previousDateFilter = previousDaysAgo.toISOString();

      // Fetch actual flavors from database to filter against
      const { data: actualFlavors } = await supabase
        .from('flavors')
        .select('name')
        .eq('is_active', true);

      const validFlavorNames = new Set(actualFlavors?.map(f => f.name) || []);

      // Fetch current period orders with order_items (paid orders only)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            flavors,
            quantity,
            total_price
          )
        `)
        .eq('payment_status', 'paid')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders error:', ordersError);
        throw ordersError;
      }

      // Fetch previous period orders for comparison (paid orders only)
      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', previousDateFilter)
        .lt('created_at', dateFilter);

      if (previousError) {
        console.error('Previous orders error:', previousError);
        throw previousError;
      }

      // Flatten order items for analysis
      const allOrderItems: Array<{
        product_id?: string;
        product_name?: string;
        flavors?: string[];
        quantity: number;
        total_price: number;
      }> = [];
      orders?.forEach(order => {
        if (order.order_items) {
          order.order_items.forEach((item: any) => {
            allOrderItems.push(item);
          });
        }
      });

      // Calculate basic metrics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      console.log('📊 Analytics Data:', {
        totalOrders,
        totalRevenue,
        dateRange: `${dateFilter} to now`,
        sampleOrder: orders?.[0]
      });

      // Calculate previous period metrics
      const previousTotalOrders = previousOrders?.length || 0;
      const previousRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const previousAOV = previousTotalOrders > 0 ? previousRevenue / previousTotalOrders : 0;

      // Revenue by day
      const revenueByDay = aggregateRevenueByDay(orders || []);
      console.log('📈 Revenue by Day:', revenueByDay.slice(-7));

      // Orders by status
      const ordersByStatus = aggregateOrdersByStatus(orders || []);

      // Popular products
      const popularProducts = aggregatePopularProducts(allOrderItems || []);

      // Top flavors with percentages - filtered to only actual wing flavors
      const topFlavors = aggregateTopFlavors(allOrderItems || [], validFlavorNames);

      // Revenue by category - fetch products with category join (correct syntax!)
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id, category:categories(id, name)');

      console.log('🔍 Raw products data:', JSON.stringify(allProducts?.slice(0, 3), null, 2));
      console.log('❌ Products error:', productsError);
      console.log('🛒 Sample order item product_ids:', allOrderItems?.slice(0, 5).map(i => i.product_id));

      // Create maps: product ID → category AND product name → category (fallback)
      const productCategoryMap = new Map<string, string>();
      const productNameMap = new Map<string, string>();

      allProducts?.forEach(product => {
        const category = product.category as any;
        const categoryName = category?.name || 'Uncategorized';

        // Map by product ID (preferred)
        productCategoryMap.set(product.id, categoryName);

        // Map by product name (fallback for orders missing product_id)
        productNameMap.set(product.name, categoryName);

        console.log(`📦 Product mapping: "${product.name}" (${product.id}) → Category: "${categoryName}" (category_id: ${product.category_id})`);
      });

      console.log('\n🗺️ Final Product-Category Map:');
      allOrderItems?.slice(0, 5).forEach(item => {
        const mappedCategory = (item.product_id ? productCategoryMap.get(item.product_id) : null) || productNameMap.get(item.product_name);
        console.log(`   Order item "${item.product_name}" (${item.product_id}) → "${mappedCategory}"`);
      });

      // Aggregate revenue by category (with fallback to product name matching)
      const revenueByCategory = aggregateRevenueByCategory(allOrderItems || [], productCategoryMap, productNameMap);

      // Peak hours analysis
      const peakHours = aggregatePeakHours(orders || []);

      // Customer insights - get unique customer emails from current period
      const customerEmails = Array.from(new Set(orders?.map(o => o.customer_email).filter(Boolean)));

      // Fetch ALL orders for these customers to get accurate first order dates
      const { data: allCustomerOrders } = await supabase
        .from('orders')
        .select('customer_email, created_at')
        .eq('payment_status', 'paid')
        .in('customer_email', customerEmails.length > 0 ? customerEmails : ['none']);

      const customerInsights = aggregateCustomerInsights(orders || [], allCustomerOrders || []);

      // Period comparison
      const periodComparison = {
        revenue: totalRevenue,
        orders: totalOrders,
        avgOrderValue: averageOrderValue,
        revenueChange: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
        ordersChange: previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0,
        aovChange: previousAOV > 0 ? ((averageOrderValue - previousAOV) / previousAOV) * 100 : 0,
      };

      // Recent orders
      const recentOrders = orders?.slice(0, 10).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name || 'Guest',
        total: Number(order.total),
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
        recentOrders,
        peakHours,
        customerInsights,
        periodComparison,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  function aggregateRevenueByDay(orders: Array<any>) {
    const dailyData: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach(order => {
      // Use YYYY-MM-DD format for consistent sorting
      const dateObj = new Date(order.created_at);
      const date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += Number(order.total);
      dailyData[date].orders += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  function aggregateOrdersByStatus(orders: Array<any>) {
    const statusCount: { [key: string]: number } = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count
    }));
  }

  function aggregatePopularProducts(orderItems: Array<any>) {
    const productData: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    orderItems.forEach(item => {
      const productName = item.product_name || 'Unknown Product';
      if (!productData[productName]) {
        productData[productName] = { name: productName, quantity: 0, revenue: 0 };
      }
      productData[productName].quantity += item.quantity;
      productData[productName].revenue += Number(item.total_price);
    });

    return Object.values(productData)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  function aggregateTopFlavors(orderItems: Array<any>, validFlavorNames: Set<string>) {
    const flavorCount: { [key: string]: number } = {};
    let totalFlavorOrders = 0;

    orderItems.forEach(item => {
      if (item.flavors && Array.isArray(item.flavors)) {
        item.flavors.forEach((flavor: string) => {
          // Only count flavors that exist in the actual flavors table
          if (validFlavorNames.has(flavor)) {
            flavorCount[flavor] = (flavorCount[flavor] || 0) + item.quantity;
            totalFlavorOrders += item.quantity;
          }
        });
      }
    });

    return Object.entries(flavorCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalFlavorOrders > 0 ? Math.round((count / totalFlavorOrders) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  function aggregateRevenueByCategory(orderItems: Array<any>, productCategoryMap: Map<string, string>, productNameMap: Map<string, string>) {
    const categoryRevenue: { [key: string]: number } = {};

    orderItems.forEach(item => {
      let categoryName = 'Uncategorized';

      // Try product_id first
      if (item.product_id && typeof item.product_id === 'string') {
        categoryName = productCategoryMap.get(item.product_id) || 'Uncategorized';
      }
      // Fallback: match by product_name if product_id is null
      else if (item.product_name) {
        categoryName = productNameMap.get(item.product_name) || 'Uncategorized';
      }

      if (!categoryRevenue[categoryName]) {
        categoryRevenue[categoryName] = 0;
      }
      categoryRevenue[categoryName] += Number(item.total_price);
    });

    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  function aggregatePeakHours(orders: Array<any>) {
    const hourData: { [key: number]: { count: number; revenue: number } } = {};

    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      if (!hourData[hour]) {
        hourData[hour] = { count: 0, revenue: 0 };
      }
      hourData[hour].count += 1;
      hourData[hour].revenue += Number(order.total);
    });

    return Object.entries(hourData)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        count: data.count,
        revenue: data.revenue,
        label: formatHour(parseInt(hour))
      }))
      .sort((a, b) => b.count - a.count);
  }

  function formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  function aggregateCustomerInsights(orders: Array<any>, allCustomerOrders: Array<any>) {
    // Get unique customers
    const customerMap = new Map<string, { name: string; email: string; orders: number; totalSpent: number; firstOrder: string; lastOrder: string; actualFirstOrder: string }>();

    // Build map of customer emails to their actual first order date (from all time)
    const customerFirstOrderMap = new Map<string, string>();
    allCustomerOrders.forEach(order => {
      const email = order.customer_email;
      const existing = customerFirstOrderMap.get(email);
      if (!existing || order.created_at < existing) {
        customerFirstOrderMap.set(email, order.created_at);
      }
    });

    orders.forEach(order => {
      const email = order.customer_email || 'unknown';
      const existing = customerMap.get(email);
      const actualFirstOrder = customerFirstOrderMap.get(email) || order.created_at;

      if (existing) {
        existing.orders += 1;
        existing.totalSpent += Number(order.total);
        if (order.created_at > existing.lastOrder) {
          existing.lastOrder = order.created_at;
        }
      } else {
        customerMap.set(email, {
          name: order.customer_name || 'Unknown',
          email,
          orders: 1,
          totalSpent: Number(order.total),
          firstOrder: order.created_at,
          lastOrder: order.created_at,
          actualFirstOrder: actualFirstOrder
        });
      }
    });

    const customers = Array.from(customerMap.values());
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.orders > 1).length;
    const averageOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;
    const customerLTV = totalCustomers > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0;

    // Get new vs returning customers based on ACTUAL first order date (all time)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = customers.filter(c => new Date(c.actualFirstOrder) >= thirtyDaysAgo).length;
    const returningCustomers = customers.filter(c => new Date(c.actualFirstOrder) < thirtyDaysAgo).length;

    // Top customers by total spent
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        email: c.email,
        orders: c.orders,
        totalSpent: c.totalSpent
      }));

    return {
      totalCustomers,
      repeatCustomers,
      averageOrdersPerCustomer,
      customerLTV,
      topCustomers,
      newCustomers,
      returningCustomers,
      repeatCustomerRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
    };
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
        <h1 className="text-3xl font-bold text-[#552627]">Analytics Dashboard</h1>
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

      {/* Key Metrics with Period Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[#552627]">{formatPrice(salesData.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">{salesData.totalOrders} orders</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${salesData.periodComparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {salesData.periodComparison.revenueChange >= 0 ? '+' : ''}{salesData.periodComparison.revenueChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-[#F7C400]">{formatPrice(salesData.averageOrderValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Per order</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${salesData.periodComparison.aovChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {salesData.periodComparison.aovChange >= 0 ? '+' : ''}{salesData.periodComparison.aovChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Orders</p>
                <p className="text-2xl font-bold text-[#552627]">{salesData.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">In selected period</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${salesData.periodComparison.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {salesData.periodComparison.ordersChange >= 0 ? '+' : ''}{salesData.periodComparison.ordersChange.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-[#552627]">{salesData.customerInsights.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">{salesData.customerInsights.repeatCustomers} repeat customers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Revenue Trend (Last 14 Days)</h2>
          {salesData.revenueByDay.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No revenue data available for the selected period</p>
              <p className="text-xs mt-2">Only paid orders are included in analytics</p>
            </div>
          ) : (
            <div className="space-y-2">
              {salesData.revenueByDay.slice(-14).map((day, index) => {
                const maxRevenue = Math.max(...salesData.revenueByDay.map(d => d.revenue));
                const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-24">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%`, minWidth: percentage > 0 ? '60px' : '0' }}
                      >
                        <span className="text-xs font-semibold text-white">{day.orders}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#552627] w-24 text-right">
                      {formatPrice(day.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Peak Ordering Hours</h2>
          {salesData.peakHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No order data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.peakHours.slice(0, 8).map((hour, index) => (
                <div key={hour.hour} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-12">{hour.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${salesData.peakHours[0].count > 0 ? (hour.count / salesData.peakHours[0].count) * 100 : 0}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{hour.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{formatPrice(hour.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Popular Products</h2>
          {salesData.popularProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No product data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.popularProducts.slice(0, 6).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-500">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#552627]">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Flavors */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Most Ordered Flavors</h2>
          {salesData.topFlavors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No flavor data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.topFlavors.slice(0, 6).map((flavor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-500">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{flavor.name}</p>
                      <p className="text-xs text-gray-500">{flavor.percentage}% of orders</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#552627]">{flavor.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-[#552627] mb-6">Customer Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#552627]">{salesData.customerInsights.totalCustomers}</p>
            <p className="text-sm text-gray-600">Total Customers</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#F7C400]">{formatPrice(salesData.customerInsights.customerLTV)}</p>
            <p className="text-sm text-gray-600">Avg Spend/Customer</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#552627]">{salesData.customerInsights.averageOrdersPerCustomer.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Avg Orders/Customer</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-[#F7C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{salesData.customerInsights.repeatCustomerRate?.toFixed(0) || '0'}%</p>
            <p className="text-sm text-gray-600">Repeat Customer Rate</p>
          </div>
        </div>

        {/* Top Customers */}
        <div>
          <h3 className="text-lg font-semibold text-[#552627] mb-3">Top Customers</h3>
          {salesData.customerInsights.topCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No customer data available for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesData.customerInsights.topCustomers.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{customer.orders}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-[#552627]">{formatPrice(customer.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Orders by Status</h2>
          {salesData.ordersByStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No order status data available for the selected period</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#552627] mb-4">Revenue by Category</h2>
          {salesData.revenueByCategory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No category data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.revenueByCategory
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 6)
                .map((category, index) => {
                  const maxRevenue = Math.max(...salesData.revenueByCategory.map(c => c.revenue));
                  return (
                    <div key={category.category} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-32">{category.category}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(category.revenue / maxRevenue) * 100}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{formatPrice(category.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-[#552627] mb-4">Recent Orders</h2>
        {salesData.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No orders available for the selected period</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}