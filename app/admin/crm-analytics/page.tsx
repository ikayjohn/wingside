"use client";

import { useEffect, useState } from 'react';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
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

  function getSegmentIcon(id: string): string {
    const icons: Record<string, string> = {
      'vip': '👑',
      'regular': '⭐',
      'new': '🆕',
      'at-risk': '⚠️',
      'churned': '❌',
      'corporate': '🏢',
      'weekend-warrior': '🎉',
      'big-spender': '💰',
      'one-time': '🔸',
      'emerging': '📈'
    };
    return icons[id] || '👤';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Health Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{averageHealthScore.toFixed(0)}</p>
            </div>
            <div className="text-4xl">❤️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At-Risk Customers</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{segmentStats['at-risk'] || 0}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Churned Customers</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{segmentStats['churned'] || 0}</p>
            </div>
            <div className="text-4xl">📉</div>
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
