'use client';

import NotificationPreferences from '@/components/NotificationPreferences';

export default function NotificationPreferencesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage how you receive notifications about your orders, promotions, and rewards.
          </p>
        </div>

        <NotificationPreferences />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            About Notifications
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>Email Notifications:</strong> Receive updates about your orders and
              exclusive promotions directly in your inbox.
            </li>
            <li>
              <strong>Push Notifications:</strong> Get instant notifications in your browser
              when your order status changes. Requires a modern browser.
            </li>
            <li>
              <strong>SMS Notifications:</strong> Get text message updates for important order
              updates (coming soon).
            </li>
          </ul>
          <p className="mt-4 text-xs text-blue-700">
            You can change these preferences at any time. We'll respect your choices and only
            send notifications for the categories you enable.
          </p>
        </div>
      </div>
    </div>
  );
}
