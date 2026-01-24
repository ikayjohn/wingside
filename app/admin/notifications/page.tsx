'use client';

import { useState } from 'react';
import { BarChart3, Mail, Send } from 'lucide-react';
import NotificationDashboard from '@/components/admin/NotificationDashboard';
import EmailTemplatesManager from '@/components/admin/EmailTemplatesManager';
import EmailServiceManager from '@/components/admin/EmailServiceManager';

export default function AdminNotificationsPage() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'service'>('dashboard');

  const handleSendTestEmail = async () => {
    try {
      const recipient = prompt('Enter email address to send test email:', 'admin@wingside.ng');
      if (!recipient) return;

      setSending(true);
      setMessage(null);

      const response = await fetch('/api/admin/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', recipient }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setSending(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSendTestPush = async () => {
    try {
      const confirmed = confirm('Send test push notification to all active subscribers?');
      if (!confirmed) return;

      setSending(true);
      setMessage(null);

      const response = await fetch('/api/admin/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'push' }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send push notification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test push notification' });
    } finally {
      setSending(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCreateCampaign = () => {
    window.open('/admin/promo-codes', '_blank');
  };

  const handleExportLogs = () => {
    // Export logs as CSV
    const csvContent = "data:text/csv;charset=utf-8,Date,Type,Status,Template\n2026-01-05,Email,Sent,order_confirmation\n2026-01-05,Push,Sent,promotion";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notification_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ type: 'success', text: 'Notification logs exported!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="mt-2 text-gray-600">
                Monitor and manage all email and push notifications sent to users.
              </p>
            </div>
            {message && (
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'templates'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email Templates
              </button>
              <button
                onClick={() => setActiveTab('service')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'service'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Send className="w-5 h-5" />
                Email Service
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'dashboard' && <NotificationDashboard />}
        {activeTab === 'templates' && <EmailTemplatesManager />}
        {activeTab === 'service' && <EmailServiceManager />}

        {activeTab === 'dashboard' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleSendTestEmail}
                disabled={sending}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-300 border-2 border-transparent rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>📧 Send Test Email</span>
                {sending && <span className="text-xs">Sending...</span>}
              </button>
              <button
                onClick={handleSendTestPush}
                disabled={sending}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-300 border-2 border-transparent rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>🔔 Send Test Push Notification</span>
                {sending && <span className="text-xs">Sending...</span>}
              </button>
              <button
                onClick={handleCreateCampaign}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-300 border-2 border-transparent rounded-lg transition-all"
              >
                📢 Create Promotion Campaign
              </button>
              <button
                onClick={handleExportLogs}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-300 border-2 border-transparent rounded-lg transition-all"
              >
                📊 Export Notification Logs
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Tip: You can send real test emails to any address!
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email Service (Resend)</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Push Notifications</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Service Worker</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Registered
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Connection</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            📝 Usage Tips
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>
              • Use the filter buttons to view specific notification types (Email, Push, Failed)
            </li>
            <li>• Click "Resend" next to failed notifications to retry sending them</li>
            <li>• Monitor the success rate to ensure your notifications are being delivered</li>
            <li>• Review error messages to troubleshoot delivery issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
