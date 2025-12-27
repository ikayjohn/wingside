"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState({
    revenueChart: [],
    statusChart: [],
    topProducts: [],
    dailyChart: [],
    customerGrowth: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Animate numbers
      const duration = 1000;
      const steps = 60;
      const stepDuration = duration / steps;

      Object.keys(stats).forEach((key) => {
        const target = stats[key as keyof typeof stats];
        let current = 0;
        const increment = target / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedStats((prev) => ({
            ...prev,
            [key]: Math.floor(current),
          }));
        }, stepDuration);
      });
    }
  }, [loading, stats]);

  async function fetchStats() {
    try {
      const [statsResponse, chartsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/charts'),
      ]);

      const statsData = await statsResponse.json();
      const chartsData = await chartsResponse.json();

      if (!statsResponse.ok) {
        throw new Error(statsData.error || 'Failed to fetch stats');
      }

      setStats({
        totalOrders: statsData.totalOrders,
        pendingOrders: statsData.pendingOrders,
        totalProducts: statsData.totalProducts,
        totalCustomers: statsData.totalCustomers,
        recentOrders: statsData.recentOrders,
        totalRevenue: statsData.totalRevenue,
      });

      setRecentActivity(statsData.recentOrdersData);
      setChartData(chartsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F7C400]"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: animatedStats.totalOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Pending Orders',
      value: animatedStats.pendingOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Total Products',
      value: animatedStats.totalProducts,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: 'Active',
      trendUp: null,
    },
    {
      title: 'Total Customers',
      value: animatedStats.totalCustomers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Avg Order Value',
      value: stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : '₦0',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(animatedStats.totalRevenue),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #F7C400 0%, #e5b000 100%)',
      trend: '+32%',
      trendUp: true,
    },
  ];

  const quickActions = [
    {
      title: 'Manage Products',
      href: '/admin/products',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      color: 'text-blue-600'
    },
    {
      title: 'View Orders',
      href: '/admin/orders',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
      color: 'text-purple-600'
    },
    {
      title: 'Manage Flavors',
      href: '/admin/flavors',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
      color: 'text-red-600'
    },
    {
      title: 'Delivery Areas',
      href: '/admin/delivery-areas',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'text-green-600'
    },
    {
      title: 'Promo Codes',
      href: '/admin/promo-codes',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      color: 'text-yellow-600'
    },
    {
      title: 'View Customers',
      href: '/admin/customers',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      color: 'text-indigo-600'
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      color: 'text-cyan-600'
    },
    {
      title: 'Manage Events',
      href: '/admin/events',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      color: 'text-rose-600'
    },
    {
      title: 'Job Positions',
      href: '/admin/job-positions',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      color: 'text-emerald-600'
    },
    {
      title: 'Job Applications',
      href: '/admin/job-applications',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      color: 'text-teal-600'
    },
    {
      title: 'Contact Submissions',
      href: '/admin/contact-submissions',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      color: 'text-violet-600'
    },
    {
      title: 'Manage Users',
      href: '/admin/users',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'text-pink-600'
    },
    {
      title: 'Manage Stores',
      href: '/admin/stores',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      color: 'text-orange-600'
    },
    {
      title: 'Social Verifications',
      href: '/admin/social-verifications',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'text-lime-600'
    },
    {
      title: 'Hero Slides',
      href: '/admin/hero-slides',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      color: 'text-amber-600'
    },
    {
      title: 'System Settings',
      href: '/admin/settings',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'text-gray-600'
    },
    {
      title: 'View Site',
      href: '/',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
      color: 'text-slate-600'
    },
  ];

  const COLORS = ['#F7C400', '#552627', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#552627] to-[#3a1a1b] p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di0yaC0ydjJoMnptMC0zaC0ydjJoMnptLTItMnYyaDJ2LTJ6bTAgM3YyaDJ2LTJ6bS0yIDJoMnYyaC0yek0zNiAzNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, Captain!</h1>
          <p className="text-gray-300 text-lg">Real-time insights into Wingside's performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
            style={{ background: stat.gradient }}
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBIMHY0MHptMC01TDIwIDBIMHYzNXptMC01TDMwIDBIMjB2MzB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuNCIvPjwvZz48L3N2Zz4=')] animate-pulse"></div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                {/* Icon Container with Pulse */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/50 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                  <div className="relative p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/50 group-hover:bg-white/50 transition-all duration-300 group-hover:scale-110">
                    <div className="text-gray-900 transform group-hover:rotate-12 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                </div>

                {/* Trend Badge with Animation */}
                {stat.trendUp !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 ${
                    stat.trendUp
                      ? 'bg-white/95 text-green-700'
                      : 'bg-white/95 text-red-700'
                  }`}>
                    <div className={`transform transition-transform duration-500 ${stat.trendUp ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-y-0.5'}`}>
                      {stat.trendUp ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                    </div>
                    <span>{stat.trend}</span>
                  </div>
                )}
              </div>

              {/* Title with Slide Animation */}
              <p className="text-gray-900 text-sm font-bold mb-2 uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-300">
                {stat.title}
              </p>

              {/* Value with Counter Animation Effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full"></div>
                <p className="relative text-4xl font-black text-gray-900 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </p>
              </div>

              {/* Progress Bar Indicator */}
              <div className="mt-4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900/50 rounded-full transition-all duration-1000 ease-out group-hover:bg-gray-900"
                  style={{
                    width: `${Math.min(100, (parseInt(stat.value.toString().replace(/[^0-9]/g, '')) || 1) * 5)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Glow Effect on Hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Trend (30 Days)</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Completed Orders</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.revenueChart}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7C400" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F7C400" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#552627', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F7C400"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Orders by Status</h2>
            <div className="text-sm text-gray-600">Current distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.statusChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#552627', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="orders" fill="#F7C400" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
            <div className="text-sm text-gray-600">By quantity</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData.topProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name?.substring(0, 10) + '...'}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantity"
              >
                {chartData.topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#552627', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Orders Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Orders This Week</h2>
            <div className="text-sm text-gray-600">Last 7 days</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData.dailyChart}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#552627" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#552627" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#552627', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#552627"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorOrders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Customer Growth</h2>
            <div className="text-sm text-gray-600">Last 6 months</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#552627', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-[#F7C400] hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent orders</p>
            ) : (
              recentActivity.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#552627]">
                      {formatCurrency(order.total || 0)}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group flex flex-col items-center justify-center p-4 rounded-xl bg-white hover:bg-[#F7C400] transition-all duration-200 hover:scale-105 shadow-md hover:shadow-xl"
            >
              <div className={`mb-2 transform group-hover:scale-110 transition-transform ${action.color}`}>
                {action.icon}
              </div>
              <p className="text-xs font-semibold text-gray-800 text-center">{action.title}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
