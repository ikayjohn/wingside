"use client";

import { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  function: string;
  icon: string;
}

const templates: EmailTemplate[] = [
  {
    id: 'referral_invitation',
    name: 'Referral Invitation',
    description: 'Sent when a user shares a referral code via email',
    category: 'Referrals',
    function: 'sendReferralInvitation',
    icon: '📧'
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    description: 'Sent to customer when order is placed',
    category: 'Orders',
    function: 'sendOrderConfirmation',
    icon: '🛒'
  },
  {
    id: 'payment_confirmation',
    name: 'Payment Confirmation',
    description: 'Sent to customer when payment is successful',
    category: 'Payments',
    function: 'sendPaymentConfirmation',
    icon: '💳'
  },
  {
    id: 'order_notification',
    name: 'Order Notification (Admin)',
    description: 'Sent to admin when new order is received',
    category: 'Notifications',
    function: 'sendOrderNotification',
    icon: '🔔'
  },
  {
    id: 'contact_notification',
    name: 'Contact Form Notification',
    description: 'Sent to admin when contact form is submitted',
    category: 'Notifications',
    function: 'sendContactNotification',
    icon: '📬'
  }
];

export default function EmailServiceManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testData, setTestData] = useState({
    recipientEmail: '',
    referrerName: 'Wingside Team',
    referralCode: 'TEST2025',
    customMessage: ''
  });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async () => {
    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate?.id,
          recipientEmail: testData.recipientEmail,
          referrerName: testData.referrerName,
          referralCode: testData.referralCode,
          customMessage: testData.customMessage
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: `Test email sent successfully to ${testData.recipientEmail}!`
        });
        setTimeout(() => {
          setShowTestModal(false);
          setSendResult(null);
          setTestData({
            recipientEmail: '',
            referrerName: 'Wingside Team',
            referralCode: 'TEST2025',
            customMessage: ''
          });
        }, 3000);
      } else {
        setSendResult({
          success: false,
          message: result.error || 'Failed to send test email'
        });
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Error sending test email'
      });
    } finally {
      setSending(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Referrals':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Orders':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Payments':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Notifications':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            {/* Template Icon & Category */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{template.icon}</div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
            </div>

            {/* Template Info */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>

            {/* Function Name */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                {template.function}()
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                  setShowTestModal(true);
                }}
                className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                Send Test Email
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Test: {selectedTemplate.name}
              </h3>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setSendResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {selectedTemplate.id === 'referral_invitation' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={testData.recipientEmail}
                    onChange={(e) => setTestData({ ...testData, recipientEmail: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referrer Name
                  </label>
                  <input
                    type="text"
                    value={testData.referrerName}
                    onChange={(e) => setTestData({ ...testData, referrerName: e.target.value })}
                    placeholder="Wingside Team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    value={testData.referralCode}
                    onChange={(e) => setTestData({ ...testData, referralCode: e.target.value })}
                    placeholder="TEST2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message (optional)
                  </label>
                  <textarea
                    value={testData.customMessage}
                    onChange={(e) => setTestData({ ...testData, customMessage: e.target.value })}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  />
                </div>
              </div>
            )}

            {sendResult && (
              <div className={`mt-4 p-3 rounded-lg border ${
                sendResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  sendResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {sendResult.success ? '✅' : '❌'} {sendResult.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setSendResult(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTest}
                disabled={sending || !testData.recipientEmail}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
