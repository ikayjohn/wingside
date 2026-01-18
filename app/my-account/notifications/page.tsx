'use client';

import Link from 'next/link';
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

        <Link
          href="/my-account/dashboard"
          className="inline-flex items-center gap-2 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-lg font-semibold hover:bg-[#E5B500] transition-colors mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </Link>

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
