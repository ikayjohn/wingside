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
    };
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getInputType = (key: string) => {
    if (key.includes('email')) return 'email';
    if (key.includes('phone') || key.includes('whatsapp')) return 'tel';
    if (key.includes('url') || key.includes('facebook') || key.includes('instagram') ||
        key.includes('twitter') || key.includes('linkedin') || key.includes('youtube')) return 'url';
    if (key.includes('rate') || key.includes('amount') || key.includes('fee') ||
        key.includes('radius') || key.includes('threshold')) return 'number';
    return 'text';
  };

  const renderInput = (item: SettingItem) => {
    const inputType = getInputType(item.key);

    // Boolean settings (accept_cash, accept_card, accept_wallet)
    if (item.key.startsWith('accept_')) {
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
        {Object.entries(settingsByCategory).map(([category, items]) => (
          <div key={category} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {getCategoryTitle(category)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
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
                  {renderInput(item)}
                </div>
              ))}
            </div>
          </div>
        ))}

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
        </ul>
      </div>
    </div>
  );
}
