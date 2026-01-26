'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SettingItem {
  key: string;
  value: string;
  description: string;
}

interface SettingsByCategory {
  [category: string]: SettingItem[];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsByCategory, setSettingsByCategory] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/admin/settings');

      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 403) {
        setMessage('You do not have permission to access this page');
        setMessageType('error');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load settings');
      }

      const data = await response.json();
      setSettings(data.settings || {});
      setSettingsByCategory(data.settingsByCategory || {});
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage(error.message || 'Failed to load settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');

      console.log('Saving settings:', settings);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (!response.ok) {
        if (data.failures) {
          const failedKeys = data.failures.map((f: any) => f.key).join(', ');
          throw new Error(`Failed to update: ${failedKeys}`);
        }
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage(`Settings saved successfully! (${data.updated || 0} updated)`);
      setMessageType('success');

      // Reload settings to confirm changes
      await loadSettings();

      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage(error.message || 'Failed to save settings');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      general: 'General Settings',
      contact: 'Contact Information',
      business: 'Business Hours',
      delivery: 'Delivery Settings',
      payment: 'Payment Settings',
      order_availability: 'Order Availability',
    };
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getInputType = (key: string) => {
    if (key.includes('email')) return 'email';
    if (key.includes('phone') || key.includes('whatsapp')) return 'tel';
    if (key.includes('url') || key.includes('facebook') || key.includes('instagram') ||
        key.includes('twitter') || key.includes('linkedin') || key.includes('youtube') ||
        key.includes('tiktok') || key.includes('spotify')) return 'url';
    if (key.includes('rate') || key.includes('amount') || key.includes('fee') ||
        key.includes('radius') || key.includes('threshold')) return 'number';
    return 'text';
  };

  const renderInput = (item: SettingItem, category: string) => {
    const inputType = getInputType(item.key);

    // Boolean settings (accept_cash, accept_card, accept_wallet, auto_close_outside_hours, payment_gateway_*_enabled)
    if (item.key.startsWith('accept_') || item.key === 'auto_close_outside_hours' || item.key.startsWith('payment_gateway_')) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings[item.key] === 'true'}
            onChange={(e) => handleChange(item.key, e.target.checked ? 'true' : 'false')}
            className="w-5 h-5 text-[#F7C400] focus:ring-[#F7C400] rounded"
          />
          <span className="text-sm text-gray-600">
            {settings[item.key] === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );
    }

    return (
      <input
        type={inputType}
        value={settings[item.key] || ''}
        onChange={(e) => handleChange(item.key, e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
        placeholder={item.description}
        step={inputType === 'number' ? '0.01' : undefined}
        min={inputType === 'number' ? '0' : undefined}
      />
    );
  };

  const getFieldLabel = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Site Settings</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
        <div className="text-sm text-gray-600">
          {Object.keys(settings).length} settings configured
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Render all categories except order_availability */}
        {Object.entries(settingsByCategory)
          .filter(([category]) => category !== 'order_availability')
          .map(([category, items]) => {
            // Filter out tax_rate from payment settings
            const filteredItems = items.filter(item => item.key !== 'tax_rate');

            // Skip rendering if no items remain after filtering
            if (filteredItems.length === 0) return null;

            return (
          <div key={category} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {getCategoryTitle(category)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div key={item.key} className={
                  category === 'business' || item.key.includes('address_line') || item.key.includes('description')
                    ? 'md:col-span-2'
                    : ''
                }>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getFieldLabel(item.key)}
                    {item.description && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({item.description})
                      </span>
                    )}
                  </label>
                  {renderInput(item, category)}
                </div>
              ))}
            </div>
          </div>
            );
          })}

        {/* Order Availability Section - Always Last */}
        {settingsByCategory['order_availability'] && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 shadow-md rounded-lg p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                ⏰ Order Availability Settings
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                Auto-Close Feature
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6 border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
              <p className="text-sm text-gray-600">
                When enabled, orders will automatically be disabled outside your configured business hours.
                Customers will see a countdown timer showing when you'll reopen. This feature works in
                combination with the manual "Accept Orders" toggle in General Settings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                // Define day order: Monday to Sunday
                const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const timezoneSetting = settingsByCategory['order_availability'].find(i => i.key === 'business_timezone');
                const autoCloseSetting = settingsByCategory['order_availability'].find(i => i.key === 'auto_close_outside_hours');

                return (
                  <>
                    {/* Auto-close toggle - show first and full width */}
                    {autoCloseSetting && (
                      <div key={autoCloseSetting.key} className="md:col-span-2 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-4 border border-orange-300">
                        <label className="block text-base font-semibold text-gray-900 mb-3">
                          {getFieldLabel(autoCloseSetting.key)}
                          {autoCloseSetting.description && (
                            <span className="ml-2 text-sm text-gray-600 font-normal">
                              ({autoCloseSetting.description})
                            </span>
                          )}
                        </label>
                        {renderInput(autoCloseSetting, 'order_availability')}
                      </div>
                    )}

                    {/* Day-specific settings in order: Monday to Sunday */}
                    {dayOrder.map(dayName => {
                      const openTimeKey = `${dayName}_open`;
                      const closeTimeKey = `${dayName}_close`;
                      const openItem = settingsByCategory['order_availability'].find(i => i.key === openTimeKey);

                      if (!openItem) return null;

                      return (
                        <div key={dayName} className="md:col-span-2 lg:col-span-1 bg-white rounded-lg p-4 border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-3 capitalize">
                            {dayName} Hours
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Opens</label>
                              <input
                                type="time"
                                value={settings[openTimeKey] || ''}
                                onChange={(e) => handleChange(openTimeKey, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Closes</label>
                              <input
                                type="time"
                                value={settings[closeTimeKey] || ''}
                                onChange={(e) => handleChange(closeTimeKey, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Timezone setting - full width */}
                    {timezoneSetting && (
                      <div key={timezoneSetting.key} className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getFieldLabel(timezoneSetting.key)}
                          {timezoneSetting.description && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({timezoneSetting.description})
                            </span>
                          )}
                        </label>
                        <select
                          value={settings[timezoneSetting.key] || 'Africa/Lagos'}
                          onChange={(e) => handleChange(timezoneSetting.key, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                        >
                          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                          <option value="Africa/Lagos">Africa/Lagos</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Save Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={loadSettings}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#F7C400] text-[#552627] font-semibold rounded-lg hover:bg-[#e5b800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">About Settings:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• These settings control various aspects of your website</li>
          <li>• Changes take effect immediately across the entire site</li>
          <li>• Contact and business hour settings appear on the Contact page</li>
          <li>• Payment settings control available payment methods at checkout</li>
          <li>• Social media links appear in the footer</li>
          <li>• <strong>Order Availability</strong>: Configure auto-close based on business hours at the bottom of this page</li>
        </ul>
      </div>
    </div>
  );
}
