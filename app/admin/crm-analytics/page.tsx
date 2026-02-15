"use client";

import { useEffect, useState } from 'react';

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
  'emerging': 'bg-teal-100 text-teal-800'
};

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

  useEffect(() => {
    fetchCustomerData();
  }, [selectedSegment]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const url = selectedSegment
        ? `/api/customers/segments?segment=${selectedSegment}`
        : '/api/customers/segments';

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers || []);
        setSegmentStats(data.segment_stats || {});
        setAverageHealthScore(data.average_health_score || 0);
        setCustomersWithoutOrders(data.customers_without_orders || 0);
        setCustomersWithOrders(data.customers_with_orders || 0);
        setTotalProfiles(data.total_profiles || 0);

        // Debug logging
        console.log('📊 CRM Analytics Data:', {
          customersWithOrders: data.customers_with_orders,
          customersWithoutOrders: data.customers_without_orders,
          totalProfiles: data.total_profiles,
          debug: data._debug
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
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

  const segmentData: CustomerSegment[] = Object.entries(segmentStats).map(([id, count]) => ({
    id,
    name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: '',
    color: SEGMENT_COLORS[id] || 'bg-gray-100 text-gray-800',
    icon: getSegmentIcon(id),
    count: count as number,
    percentage: customers.length > 0 ? ((count as number) / customers.length * 100).toFixed(1) as any : 0
  }));

  function getSegmentIcon(id: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
      'vip': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.128 8H18a1 1 0 110 2h-.782l-1.304 6.524a1 1 0 01-.978.806l-2.621.328a1 1 0 01-1.13-.874l-.56-3.355-2.23 2.23a1 1 0 01-1.414 0l-2.23-2.23-.56 3.355a1 1 0 01-1.13.874l-2.621-.328a1 1 0 01-.978-.806L2.782 10H2a1 1 0 110-2h.872l1.352-3.241a1 1 0 011.827-1.035L8.046 6.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      'regular': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
      'new': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      'at-risk': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
      'churned': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
      'corporate': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>,
      'weekend-warrior': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
      'big-spender': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
      'one-time': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
      'emerging': <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
    };
    return icons[id] || <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Analytics</h1>
          <p className="text-gray-600 mt-1">Customer segmentation and lifetime value insights</p>
        </div>
        <button
          onClick={fetchCustomerData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-xs text-gray-400 mt-0.5">With orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{customersWithOrders}</p>
            </div>
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Never Ordered</p>
              <p className="text-xs text-gray-400 mt-0.5">Signed up only</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{customersWithoutOrders}</p>
            </div>
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Health Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{averageHealthScore.toFixed(0)}</p>
            </div>
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At-Risk Customers</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{segmentStats['at-risk'] || 0}</p>
            </div>
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Churned Customers</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{segmentStats['churned'] || 0}</p>
            </div>
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Segments</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {segmentData.map((segment) => (
            <button
              key={segment.id}
              onClick={() => setSelectedSegment(selectedSegment === segment.id ? '' : segment.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSegment === segment.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{segment.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{segment.name}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{segment.count}</div>
              <div className="text-xs text-gray-500">{segment.percentage}% of total</div>
            </button>
          ))}
        </div>
      </div>

      {/* Customer List with Segments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedSegment ? `Segment: ${selectedSegment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : 'All Customers'}
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churn Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {customer.full_name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {customer.segments.slice(0, 2).map((segment) => (
                          <span
                            key={segment}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEGMENT_COLORS[segment] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {getSegmentIcon(segment)} {segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        ))}
                        {customer.segments.length > 2 && (
                          <span className="text-xs text-gray-500">+{customer.segments.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(customer.health_score)}`}>
                        {customer.health_score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChurnRiskColor(customer.churn_risk)}`}>
                        {customer.churn_risk}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchCustomerTimeline(customer.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Timeline
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.full_name || 'Customer'}</h2>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setTimeline([]);
                    setCustomerStats(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Stats */}
              {customerStats && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-600">Total Orders</p>
                    <p className="text-xl font-bold text-blue-900">{customerStats.total_orders}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-green-600">Lifetime Value</p>
                    <p className="text-xl font-bold text-green-900">{formatCurrency(customerStats.lifetime_value)}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-purple-600">Referrals</p>
                    <p className="text-xl font-bold text-purple-900">{customerStats.total_referrals}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-orange-600">Days Since Last Order</p>
                    <p className="text-xl font-bold text-orange-900">{customerStats.days_since_last_order || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Journey</h3>

              {timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No activity yet</div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
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
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              {event.link && (
                                <a
                                  href={event.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                  View →
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
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
  );
}
