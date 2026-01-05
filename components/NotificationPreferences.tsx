'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_order_confirmations: boolean;
  email_order_status: boolean;
  email_promotions: boolean;
  email_newsletter: boolean;
  email_rewards: boolean;
  email_reminders: boolean;
  push_order_confirmations: boolean;
  push_order_status: boolean;
  push_promotions: boolean;
  push_rewards: boolean;
  sms_order_confirmations: boolean;
  sms_order_status: boolean;
  sms_promotions: boolean;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const push = usePushNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' });
      // Revert changes
      setPreferences(preferences);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePushToggle = async () => {
    if (!preferences) return;

    const newState = !preferences.push_enabled;

    if (newState) {
      const subscribed = await push.toggleSubscription();
      if (subscribed) {
        await updatePreferences({ push_enabled: true });
      } else {
        setMessage({ type: 'error', text: 'Failed to enable push notifications. Please check your browser settings.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      await push.unsubscribe();
      await updatePreferences({ push_enabled: false });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">Failed to load notification preferences.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
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

      {/* Email Notifications Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-600">Receive updates via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => updatePreferences({ email_enabled: e.target.checked })}
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>

        {preferences.email_enabled && (
          <div className="ml-4 space-y-3">
            {[
              { key: 'email_order_confirmations', label: 'Order confirmations' },
              { key: 'email_order_status', label: 'Order status updates' },
              { key: 'email_promotions', label: 'Promotions and deals' },
              { key: 'email_newsletter', label: 'Newsletter' },
              { key: 'email_rewards', label: 'Rewards and points' },
              { key: 'email_reminders', label: 'Reminders' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <span className="text-gray-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                    onChange={(e) =>
                      updatePreferences({
                        [item.key]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Push Notifications Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              {push.isSupported
                ? 'Receive notifications in your browser'
                : 'Not supported in this browser'}
            </p>
          </div>
          {push.isSupported && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={handlePushToggle}
                className="sr-only peer"
                disabled={saving || !push.isSupported}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          )}
        </div>

        {preferences.push_enabled && (
          <div className="ml-4 space-y-3">
            {[
              { key: 'push_order_confirmations', label: 'Order confirmations' },
              { key: 'push_order_status', label: 'Order status updates' },
              { key: 'push_promotions', label: 'Promotions and deals' },
              { key: 'push_rewards', label: 'Rewards and points' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <span className="text-gray-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                    onChange={(e) =>
                      updatePreferences({
                        [item.key]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {!push.isSupported && (
          <p className="text-sm text-yellow-600 ml-4">
            Push notifications require a modern browser with service worker support.
          </p>
        )}
      </div>

      {/* SMS Notifications Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
            <p className="text-sm text-gray-600">Receive updates via text message</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sms_enabled}
              onChange={(e) => updatePreferences({ sms_enabled: e.target.checked })}
              className="sr-only peer"
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>

        {preferences.sms_enabled && (
          <div className="ml-4 space-y-3">
            {[
              { key: 'sms_order_confirmations', label: 'Order confirmations' },
              { key: 'sms_order_status', label: 'Order status updates' },
              { key: 'sms_promotions', label: 'Promotions and deals' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <span className="text-gray-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                    onChange={(e) =>
                      updatePreferences({
                        [item.key]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {saving && (
        <div className="mt-6 text-center text-sm text-gray-600">Saving preferences...</div>
      )}
    </div>
  );
}
