'use client';

import { useEffect, useState } from 'react';

interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: string;
  template_key: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  metadata: Record<string, any>;
  sent_at: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  email_sent: number;
  push_sent: number;
}

export default function NotificationDashboard() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'push' | 'failed'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadNotificationLogs();
    loadStats();
  }, [filter, page]);

  const loadNotificationLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/notifications/logs?type=${filter}&page=${page}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleResendNotification = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logId }),
      });

      if (response.ok) {
        alert('Notification resent successfully!');
        loadNotificationLogs();
        loadStats();
      } else {
        alert('Failed to resend notification');
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      alert('Failed to resend notification');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      email: 'bg-blue-100 text-blue-800',
      push: 'bg-purple-100 text-purple-800',
      sms: 'bg-orange-100 text-orange-800',
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Sent</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.sent}</div>
            <div className="text-sm text-gray-500 mt-1">
              {((stats.sent / stats.total) * 100).toFixed(1)}% success rate
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}% failure
              rate
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Email Sent</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.email_sent}</div>
            <div className="text-sm text-gray-500 mt-1">Email notifications</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Push Sent</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats.push_sent}</div>
            <div className="text-sm text-gray-500 mt-1">Push notifications</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'email', 'push', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notification Logs</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No notification logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(
                          log.notification_type
                        )}`}
                      >
                        {log.notification_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.template_key || log.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleResendNotification(log.id)}
                          className="text-yellow-600 hover:text-yellow-900 font-medium"
                        >
                          Resend
                        </button>
                      )}
                      {log.error_message && (
                        <div className="text-xs text-red-600 mt-1" title={log.error_message}>
                          Error
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
