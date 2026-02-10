'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface GiftCard {
  id: string;
  code: string;
  card_number: string;
  initial_balance: number;
  current_balance: number;
  recipient_name: string;
  recipient_email: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  last_used_at: string | null;
  design_image: string;
  denomination: number;
  payment_reference: string;
  email_sent_at: string | null;
  purchased_by: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
  order_id: string | null;
}

interface Purchaser {
  id: string;
  full_name: string;
  email: string;
}

export default function GiftCardDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchaser, setPurchaser] = useState<Purchaser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update states
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin && id) {
      fetchGiftCard();
    }
  }, [isAdmin, id]);

  const checkAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      window.location.href = '/admin/gift-cards';
      return;
    }

    setIsAdmin(true);
  };

  const fetchGiftCard = async () => {
    try {
      const response = await fetch(`/api/admin/gift-cards/${id}`);
      if (!response.ok) throw new Error('Failed to fetch gift card');

      const data = await response.json();
      setGiftCard(data.gift_card);
      setTransactions(data.transactions || []);
      setPurchaser(data.purchaser);
    } catch (error) {
      console.error('Error fetching gift card:', error);
      setError('Failed to load gift card details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!giftCard) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { token, headerName } = await csrfResponse.json();

      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          [headerName]: token,
        },
        body: JSON.stringify({
          is_active: !giftCard.is_active,
        }),
      });

      if (!response.ok) throw new Error('Failed to update gift card');

      const data = await response.json();
      setGiftCard(data.gift_card);
      setSuccess(`Gift card ${data.gift_card.is_active ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update gift card');
    } finally {
      setUpdating(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!balanceAdjustment || !adjustmentReason) {
      setError('Please enter adjustment amount and reason');
      return;
    }

    const amount = parseFloat(balanceAdjustment);
    if (isNaN(amount)) {
      setError('Invalid amount');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { token, headerName } = await csrfResponse.json();

      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          [headerName]: token,
        },
        body: JSON.stringify({
          balance_adjustment: amount,
          adjustment_reason: adjustmentReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to adjust balance');
      }

      const data = await response.json();
      setGiftCard(data.gift_card);
      setBalanceAdjustment('');
      setAdjustmentReason('');
      setSuccess('Balance adjusted successfully');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh transactions
      fetchGiftCard();
    } catch (error: any) {
      setError(error.message || 'Failed to adjust balance');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            Gift card not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/gift-cards" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Gift Cards
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gift Card Details</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Preview</h2>
              <div className="relative h-48 bg-gradient-to-br from-[#F7C400] to-[#FDB913] rounded-xl overflow-hidden">
                {giftCard.design_image && (
                  <img
                    src={`/${giftCard.design_image}`}
                    alt="Gift Card Design"
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <p className="text-sm font-medium text-[#552627] opacity-80 mb-2">Gift Card Code</p>
                  <code className="text-2xl font-bold font-mono text-[#552627] mb-4">{giftCard.code}</code>
                  <p className="text-3xl font-bold text-[#552627]">{formatCurrency(giftCard.current_balance)}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Code:</span>
                  <code className="font-mono font-semibold text-gray-900">{giftCard.code}</code>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Denomination:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(giftCard.initial_balance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(giftCard.current_balance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Recipient:</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{giftCard.recipient_name}</div>
                    <div className="text-sm text-gray-600">{giftCard.recipient_email}</div>
                  </div>
                </div>
                {purchaser && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchased By:</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{purchaser.full_name}</div>
                      <div className="text-sm text-gray-600">{purchaser.email}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    giftCard.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {giftCard.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatDate(giftCard.created_at)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Expires:</span>
                  <span className="text-gray-900">{formatDate(giftCard.expires_at)}</span>
                </div>
                {giftCard.email_sent_at && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Email Sent:</span>
                    <span className="text-gray-900">{formatDate(giftCard.email_sent_at)}</span>
                  </div>
                )}
                {giftCard.last_used_at && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Last Used:</span>
                    <span className="text-gray-900">{formatDate(giftCard.last_used_at)}</span>
                  </div>
                )}
                {giftCard.payment_reference && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Payment Ref:</span>
                    <code className="text-xs text-gray-900">{giftCard.payment_reference}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.transaction_type === 'redemption' ? 'bg-blue-100 text-blue-600' :
                            transaction.transaction_type === 'purchase' ? 'bg-green-100 text-green-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {transaction.transaction_type}
                          </span>
                        </div>
                        <span className={`font-semibold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatDate(transaction.created_at)}</span>
                        <span>Balance after: {formatCurrency(transaction.balance_after)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <button
                onClick={handleToggleActive}
                disabled={updating}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  giftCard.is_active
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {updating ? 'Processing...' : giftCard.is_active ? 'Deactivate Card' : 'Activate Card'}
              </button>
            </div>

            {/* Balance Adjustment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjust Balance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Amount
                  </label>
                  <input
                    type="number"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    placeholder="Enter amount (positive or negative)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use negative for deductions (e.g., -500)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleBalanceAdjustment}
                  disabled={updating || !balanceAdjustment || !adjustmentReason}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Processing...' : 'Apply Adjustment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
