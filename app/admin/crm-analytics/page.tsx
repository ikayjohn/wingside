"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import CustomerSearchFilters, { FilterState } from '@/components/admin/CustomerSearchFilters';
import ExportButton from '@/components/admin/ExportButton';
import type { ExportSection } from '@/lib/export-utils';
import AdminLoader from '@/components/admin/AdminLoader';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  count: number;
  percentage: number;
}

interface CustomerWithSegments {
  id: string;
  full_name?: string;
  email: string;
  total_orders: number;
  total_spent: number;
  health_score: number;
  churn_risk: number;
  segments: string[];
  segment_objects: any[];
  last_order_date?: string;
  predicted_next_order?: string;
  created_at?: string;
  total_points?: number;
  bank_account?: string | null;
}

const SEGMENT_COLORS: Record<string, string> = {
  'vip': 'bg-purple-100 text-purple-800',
  'regular': 'bg-blue-100 text-blue-800',
  'new': 'bg-green-100 text-green-800',
  'at-risk': 'bg-orange-100 text-orange-800',
  'churned': 'bg-red-100 text-red-800',
  'corporate': 'bg-indigo-100 text-indigo-800',
  'weekend-warrior': 'bg-yellow-100 text-yellow-800',
  'big-spender': 'bg-emerald-100 text-emerald-800',
  'one-time': 'bg-gray-100 text-gray-800',
  'emerging': 'bg-teal-100 text-teal-800',
  'loyal': 'bg-sky-100 text-sky-800',
  'frequent': 'bg-cyan-100 text-cyan-800',
  'high-ltv': 'bg-amber-100 text-amber-800',
  'morning-orderer': 'bg-rose-100 text-rose-800',
  'afternoon-orderer': 'bg-lime-100 text-lime-800',
  'evening-orderer': 'bg-violet-100 text-violet-800',
  'weekday-orderer': 'bg-stone-100 text-stone-800'
};

const SEGMENT_BAR_COLORS: Record<string, string> = {
  'vip': '#9333ea', 'regular': '#3b82f6', 'new': '#22c55e',
  'at-risk': '#f97316', 'churned': '#ef4444', 'corporate': '#6366f1',
  'weekend-warrior': '#eab308', 'big-spender': '#10b981', 'one-time': '#6b7280',
  'emerging': '#14b8a6', 'loyal': '#0ea5e9', 'frequent': '#06b6d4',
  'high-ltv': '#f59e0b', 'morning-orderer': '#f43f5e', 'afternoon-orderer': '#84cc16',
  'evening-orderer': '#8b5cf6', 'weekday-orderer': '#78716c'
};

// Segment names map for consistent display
const SEGMENT_NAMES: Record<string, string> = {
  'vip': 'VIP', 'regular': 'Regular', 'new': 'New',
  'at-risk': 'At Risk', 'churned': 'Churned', 'corporate': 'Corporate',
  'weekend-warrior': 'Weekend Warrior', 'big-spender': 'Big Spender',
  'one-time': 'One-Time', 'emerging': 'Emerging',
  'loyal': 'Loyal', 'frequent': 'Frequent', 'high-ltv': 'High LTV',
  'morning-orderer': 'Morning', 'afternoon-orderer': 'Afternoon',
  'evening-orderer': 'Evening', 'weekday-orderer': 'Weekday'
};

type DurationPreset = 'all' | '7' | '30' | '90' | 'month';

export default function CRManalyticsPage() {
  const [customers, setCustomers] = useState<CustomerWithSegments[]>([]);
  const [segmentStats, setSegmentStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSegments | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [averageHealthScore, setAverageHealthScore] = useState(0);
  const [customersWithoutOrders, setCustomersWithoutOrders] = useState(0);
  const [customersWithOrders, setCustomersWithOrders] = useState(0);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [activeDuration, setActiveDuration] = useState<DurationPreset>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [totalCount, setTotalCount] = useState(0);
  const [segmentResetTrigger, setSegmentResetTrigger] = useState(0);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchCustomerData = useCallback(async (bustCache = false) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (selectedSegment) {
        params.set('segment', selectedSegment);
      }

      if (filters) {
        if (filters.search) params.set('search', filters.search);
        if (filters.segments.length > 0) params.set('segments', filters.segments.join(','));
        params.set('healthScoreMin', filters.healthScore[0].toString());
        params.set('healthScoreMax', filters.healthScore[1].toString());
        params.set('churnRiskMin', filters.churnRisk[0].toString());
        params.set('churnRiskMax', filters.churnRisk[1].toString());
        params.set('orderCountMin', filters.orderCount[0].toString());
        params.set('orderCountMax', filters.orderCount[1].toString());
        params.set('totalSpentMin', filters.totalSpent[0].toString());
        params.set('totalSpentMax', filters.totalSpent[1].toString());
        if (filters.lastOrderDate.start) params.set('lastOrderStart', filters.lastOrderDate.start);
        if (filters.lastOrderDate.end) params.set('lastOrderEnd', filters.lastOrderDate.end);
        if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
        params.set('sortBy', filters.sortBy);
        params.set('sortOrder', filters.sortOrder);
      }

      if (dateRange.start) params.set('dateRangeStart', dateRange.start);
      if (dateRange.end) params.set('dateRangeEnd', dateRange.end);

      if (bustCache) params.set('_t', Date.now().toString());

      const url = `/api/customers/segments?${params.toString()}`;
      const response = await fetch(url, bustCache ? { cache: 'no-store' } : undefined);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers || []);
        setSegmentStats(data.segment_stats || {});
        setAverageHealthScore(data.average_health_score || 0);
        setCustomersWithoutOrders(data.customers_without_orders || 0);
        setCustomersWithOrders(data.customers_with_orders || 0);
        setTotalProfiles(data.total_profiles || 0);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSegment, filters, dateRange]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/customer-tags');
      const data = await response.json();
      if (response.ok) {
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchCustomerTimeline = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/timeline`);
      const data = await response.json();

      if (response.ok) {
        setSelectedCustomer(data.customer);
        setTimeline(data.timeline || []);
        setCustomerStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const setDuration = (preset: DurationPreset) => {
    setActiveDuration(preset);
    if (preset === 'all') {
      setDateRange({ start: '', end: '' });
      return;
    }
    const end = new Date();
    const start = new Date();
    if (preset === 'month') {
      start.setDate(1);
    } else {
      start.setDate(start.getDate() - parseInt(preset));
    }
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getChurnRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-100';
    if (risk >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getTier = (points: number = 0): string => {
    if (points >= 20000) return 'Wingzard';
    if (points >= 5001) return 'Wing Leader';
    return 'Wing Member';
  };

  const formatSegmentName = (id: string) => SEGMENT_NAMES[id] || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  function getSegmentIcon(id: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
      'vip': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.128 8H18a1 1 0 110 2h-.782l-1.304 6.524a1 1 0 01-.978.806l-2.621.328a1 1 0 01-1.13-.874l-.56-3.355-2.23 2.23a1 1 0 01-1.414 0l-2.23-2.23-.56 3.355a1 1 0 01-1.13.874l-2.621-.328a1 1 0 01-.978-.806L2.782 10H2a1 1 0 110-2h.872l1.352-3.241a1 1 0 011.827-1.035L8.046 6.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      'regular': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
      'new': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      'at-risk': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
      'churned': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
      'corporate': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>,
      'weekend-warrior': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
      'big-spender': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
      'one-time': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
      'emerging': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>,
      'loyal': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>,
      'frequent': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
      'high-ltv': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
      'morning-orderer': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>,
      'afternoon-orderer': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>,
      'evening-orderer': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>,
      'weekday-orderer': <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
    };
    return icons[id] || <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
  }

  // Group segments for organized card display
  const segmentGroups = [
    { label: 'Value', ids: ['vip', 'big-spender', 'high-ltv', 'corporate'] },
    { label: 'Behavior', ids: ['regular', 'loyal', 'frequent', 'new', 'one-time', 'emerging'] },
    { label: 'Risk', ids: ['at-risk', 'churned'] },
    { label: 'Timing', ids: ['morning-orderer', 'afternoon-orderer', 'evening-orderer', 'weekend-warrior', 'weekday-orderer'] },
  ];

  const segmentData: CustomerSegment[] = Object.entries(segmentStats).map(([id, count]) => ({
    id,
    name: formatSegmentName(id),
    description: '',
    color: SEGMENT_COLORS[id] || 'bg-gray-100 text-gray-800',
    icon: getSegmentIcon(id),
    count: count as number,
    percentage: customers.length > 0 ? parseFloat(((count as number) / customers.length * 100).toFixed(1)) : 0
  }));

  const getCRMExportData = (): ExportSection[] => {
    const sections: ExportSection[] = [];

    sections.push({
      title: 'Overview',
      headers: ['Metric', 'Value'],
      rows: [
        ['Active Customers (with orders)', customersWithOrders],
        ['Never Ordered (signed up only)', customersWithoutOrders],
        ['Total Profiles', totalProfiles],
        ['Average Health Score', averageHealthScore.toFixed(1)],
        ['At-Risk Customers', segmentStats['at-risk'] ?? 0],
        ['Churned Customers', segmentStats['churned'] ?? 0],
      ],
    });

    if (Object.keys(segmentStats).length > 0) {
      sections.push({
        title: 'Segment Breakdown',
        headers: ['Segment', 'Customer Count', '% of Total'],
        rows: Object.entries(segmentStats).map(([seg, count]) => [
          formatSegmentName(seg),
          count as number,
          customers.length > 0 ? (((count as number) / customers.length) * 100).toFixed(1) : '0',
        ]),
      });
    }

    if (customers.length > 0) {
      sections.push({
        title: 'Customer List',
        headers: [
          'Name', 'Email', 'Joined Date', 'Points', 'Tier', 'Account Number',
          'Segments', 'Total Orders', 'Total Spent', 'Health Score', 'Churn Risk (%)',
          'Last Order Date', 'Predicted Next Order',
        ],
        rows: customers.map(c => [
          c.full_name || 'No Name',
          c.email,
          c.created_at ? new Date(c.created_at).toLocaleDateString('en-NG') : '',
          c.total_points ?? 0,
          getTier(c.total_points),
          c.bank_account || '',
          c.segments.join(', '),
          c.total_orders,
          c.total_spent,
          c.health_score,
          Math.round(c.churn_risk),
          c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-NG') : 'Never',
          c.predicted_next_order ? new Date(c.predicted_next_order).toLocaleDateString('en-NG') : '',
        ]),
      });
    }

    return sections;
  };

  const durationBtnClass = (preset: DurationPreset) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      activeDuration === preset
        ? 'bg-[#552627] text-white'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }`;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header + Duration Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#552627]">CRM Analytics</h1>
          <p className="text-sm text-gray-500">Customer segmentation and lifetime value insights</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            filename="wingside-crm"
            getExportData={getCRMExportData}
          />
          <button
            onClick={() => fetchCustomerData(true)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-[#552627] text-white rounded-md hover:bg-[#6a3435] transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Duration Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Period:</span>
          <div className="flex gap-1.5">
            <button onClick={() => setDuration('all')} className={durationBtnClass('all')}>All-Time</button>
            <button onClick={() => setDuration('7')} className={durationBtnClass('7')}>7 Days</button>
            <button onClick={() => setDuration('30')} className={durationBtnClass('30')}>30 Days</button>
            <button onClick={() => setDuration('90')} className={durationBtnClass('90')}>90 Days</button>
            <button onClick={() => setDuration('month')} className={durationBtnClass('month')}>This Month</button>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                setActiveDuration('all'); // clear preset highlight on custom range
              }}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#F7C400]"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                setActiveDuration('all');
              }}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#F7C400]"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid - Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <CustomerSearchFilters
            onFilterChange={(newFilters) => {
              if (newFilters.segments.length > 0 && selectedSegment) {
                setSelectedSegment('');
              }
              setFilters(newFilters);
            }}
            availableTags={availableTags}
            resetSegmentsTrigger={segmentResetTrigger}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customersWithOrders}</p>
          <p className="text-[10px] text-gray-400">With orders</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Never Ordered</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{customersWithoutOrders}</p>
          <p className="text-[10px] text-gray-400">Signed up only</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Avg Health Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{averageHealthScore.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400">Out of 100</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">At-Risk</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{segmentStats['at-risk'] || 0}</p>
          <p className="text-[10px] text-gray-400">60-90 days inactive</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Churned</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{segmentStats['churned'] || 0}</p>
          <p className="text-[10px] text-gray-400">90+ days inactive</p>
        </div>
      </div>

      {/* Segment Cards - Grouped */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Customer Segments</h2>
        <div className="space-y-4">
          {segmentGroups.map(group => {
            const groupSegments = group.ids
              .map(id => segmentData.find(s => s.id === id))
              .filter(Boolean) as CustomerSegment[];
            if (groupSegments.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {groupSegments.map(segment => (
                    <button
                      key={segment.id}
                      onClick={() => {
                        const next = selectedSegment === segment.id ? '' : segment.id;
                        setSelectedSegment(next);
                        if (next) setSegmentResetTrigger(prev => prev + 1);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all ${
                        selectedSegment === segment.id
                          ? 'border-[#552627] bg-[#552627]/5 text-[#552627] font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="opacity-70">{segment.icon}</span>
                      <span>{segment.name}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        selectedSegment === segment.id
                          ? 'bg-[#552627] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {segment.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Segment Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Segment Distribution</h3>
          <div className="space-y-2">
            {segmentData
              .filter(s => s.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 12)
              .map((segment) => {
                const maxCount = Math.max(...segmentData.map(s => s.count), 1);
                return (
                  <div key={segment.id} className="flex items-center gap-2">
                    <div className="w-24 text-[11px] text-gray-600 truncate" title={segment.name}>
                      {segment.name}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded h-5 relative overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max((segment.count / maxCount) * 100, 3)}%`,
                          backgroundColor: SEGMENT_BAR_COLORS[segment.id] || '#6b7280'
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[10px] font-semibold text-gray-600">
                        {segment.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            {segmentData.filter(s => s.count > 0).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No segment data</p>
            )}
          </div>
        </div>

        {/* Top 10 Customers by Spend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Top 10 by Spend</h3>
          <div className="space-y-2">
            {[...customers]
              .sort((a, b) => b.total_spent - a.total_spent)
              .slice(0, 10)
              .map((customer, i) => {
                const topCustomers = [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 10);
                const maxSpent = Math.max(...topCustomers.map(c => c.total_spent), 1);
                return (
                  <div key={customer.id} className="flex items-center gap-2">
                    <div className="w-4 text-[10px] text-gray-400 font-bold text-right">{i + 1}</div>
                    <div className="w-20 text-[11px] text-gray-600 truncate" title={customer.full_name || customer.email}>
                      {customer.full_name || customer.email.split('@')[0]}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded h-5 relative overflow-hidden">
                      <div
                        className="h-full rounded bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max((customer.total_spent / maxSpent) * 100, 3)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[10px] font-semibold text-gray-600">
                        {formatCurrency(customer.total_spent)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {customers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No customer data</p>
            )}
          </div>
        </div>

        {/* Health Score Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Health Score Distribution</h3>
          {(() => {
            const buckets = [
              { label: 'Critical (0-20)', min: 0, max: 20, color: '#ef4444' },
              { label: 'Poor (21-40)', min: 21, max: 40, color: '#f97316' },
              { label: 'Fair (41-60)', min: 41, max: 60, color: '#eab308' },
              { label: 'Good (61-80)', min: 61, max: 80, color: '#22c55e' },
              { label: 'Excellent (81+)', min: 81, max: 100, color: '#3b82f6' },
            ];
            const counts = buckets.map(b => ({
              ...b,
              count: customers.filter(c => c.health_score >= b.min && c.health_score <= b.max).length
            }));
            const maxBucket = Math.max(...counts.map(c => c.count), 1);
            return (
              <div className="space-y-2">
                {counts.map((bucket) => (
                  <div key={bucket.label} className="flex items-center gap-2">
                    <div className="w-24 text-[11px] text-gray-600">{bucket.label}</div>
                    <div className="flex-1 bg-gray-50 rounded h-5 relative overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max((bucket.count / maxBucket) * 100, 3)}%`,
                          backgroundColor: bucket.color
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[10px] font-semibold text-gray-600">
                        {bucket.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Tier Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Wing Club Tiers</h3>
          {(() => {
            const tiers = [
              { name: 'Wingzard', color: '#9333ea', icon: '/loyalty/wingzard.png' },
              { name: 'Wing Leader', color: '#3b82f6', icon: '/loyalty/wing-leader.png' },
              { name: 'Wing Member', color: '#6b7280', icon: '/loyalty/wing-member.png' },
              { name: 'No Tier', color: '#d1d5db', icon: '' },
            ];
            const tierCounts = tiers.map(t => ({
              ...t,
              count: customers.filter(c => {
                const pts = c.total_points ?? 0;
                if (t.name === 'Wingzard') return pts >= 20000;
                if (t.name === 'Wing Leader') return pts >= 5001 && pts <= 19999;
                if (t.name === 'Wing Member') return pts >= 1 && pts <= 5000;
                return pts === 0;
              }).length
            }));
            const total = Math.max(customers.length, 1);
            return (
              <div className="space-y-2.5">
                {tierCounts.map((tier) => (
                  <div key={tier.name} className="flex items-center gap-2">
                    <div className="w-24 flex items-center gap-1.5">
                      {tier.icon && (
                        <Image src={tier.icon} alt={tier.name} width={16} height={16} />
                      )}
                      <span className="text-[11px] text-gray-600">{tier.name}</span>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded h-5 relative overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max((tier.count / total) * 100, 2)}%`,
                          backgroundColor: tier.color
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[10px] font-semibold text-gray-600">
                        {tier.count} ({((tier.count / total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">
            {selectedSegment ? `Segment: ${formatSegmentName(selectedSegment)}` : 'All Customers'}
          </h2>
          {!loading && totalCount > customers.length && (
            <p className="text-[11px] text-amber-600 mt-0.5">
              Showing {customers.length} of {totalCount} — use filters or export to see all
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#552627]"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Acct No.</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Segments</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Spent</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Health</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Churn</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium text-gray-900">
                        {customer.full_name || 'No Name'}
                      </div>
                      <div className="text-[11px] text-gray-400">{customer.email}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-gray-500">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: '2-digit' })
                        : '-'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900 font-medium">
                      {(customer.total_points ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        getTier(customer.total_points) === 'Wingzard'
                          ? 'bg-purple-100 text-purple-800'
                          : getTier(customer.total_points) === 'Wing Leader'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getTier(customer.total_points)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] font-mono text-gray-600">
                      {customer.bank_account || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-0.5">
                        {customer.segments.slice(0, 3).map((segment) => (
                          <span
                            key={segment}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${SEGMENT_COLORS[segment] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {formatSegmentName(segment)}
                          </span>
                        ))}
                        {customer.segments.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{customer.segments.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getHealthColor(customer.health_score)}`}>
                        {customer.health_score}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getChurnRiskColor(customer.churn_risk)}`}>
                        {Math.round(customer.churn_risk)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => fetchCustomerTimeline(customer.id)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.full_name || 'Customer'}</h2>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setTimeline([]);
                    setCustomerStats(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  x
                </button>
              </div>

              {customerStats && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="bg-blue-50 p-2.5 rounded">
                    <p className="text-[10px] text-blue-600 font-medium">Total Orders</p>
                    <p className="text-lg font-bold text-blue-900">{customerStats.total_orders}</p>
                  </div>
                  <div className="bg-green-50 p-2.5 rounded">
                    <p className="text-[10px] text-green-600 font-medium">Lifetime Value</p>
                    <p className="text-lg font-bold text-green-900">{formatCurrency(customerStats.lifetime_value)}</p>
                  </div>
                  <div className="bg-purple-50 p-2.5 rounded">
                    <p className="text-[10px] text-purple-600 font-medium">Referrals</p>
                    <p className="text-lg font-bold text-purple-900">{customerStats.total_referrals}</p>
                  </div>
                  <div className="bg-orange-50 p-2.5 rounded">
                    <p className="text-[10px] text-orange-600 font-medium">Days Since Last Order</p>
                    <p className="text-lg font-bold text-orange-900">{customerStats.days_since_last_order || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Journey</h3>

              {timeline.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">No activity yet</div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          event.color === 'green' ? 'bg-green-100' :
                          event.color === 'red' ? 'bg-red-100' :
                          event.color === 'blue' ? 'bg-blue-100' :
                          event.color === 'purple' ? 'bg-purple-100' :
                          event.color === 'yellow' ? 'bg-yellow-100' :
                          event.color === 'indigo' ? 'bg-indigo-100' :
                          'bg-gray-100'
                        }`}>
                          {event.icon}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{event.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                              {event.link && (
                                <a
                                  href={event.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline mt-0.5 inline-block"
                                >
                                  View details
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                              {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
