"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WingsideCard {
  id: string;
  card_serial: string;
  status: 'active' | 'suspended' | 'lost' | 'stolen' | 'expired' | 'terminated';
  card_type: 'standard' | 'gift' | 'corporate';
  max_debit: number;
  linked_at: string;
  last_used_at: string | null;
  total_transactions: number;
  total_spent: number;
}

interface CardBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

export default function WingsideCardPage() {
  const [card, setCard] = useState<WingsideCard | null>(null);
  const [balance, setBalance] = useState<CardBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchCardStatus();
  }, []);

  const fetchCardStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/my-account';
        return;
      }

      // Fetch card status
      const response = await fetch('/api/wingside-card/status');

      if (response.status === 404) {
        // User doesn't have a card yet
        setCard(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch card status');
      }

      const cardData = await response.json();
      setCard(cardData);

      // Fetch balance
      const balanceResponse = await fetch('/api/wingside-card/balance');
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }
    } catch (err) {
      console.error('Error fetching card:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch card information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'lost': return 'bg-orange-100 text-orange-800';
      case 'stolen': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard Card';
      case 'gift': return 'Gift Card';
      case 'corporate': return 'Corporate Card';
      default: return 'Card';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your Wingside Card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/my-account/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Wingside Card</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No Card State */}
        {!card ? (
          <>
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0 mt-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    What is a Wingside Card?
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    Wingside Card is a physical tap-to-pay card linked to your Wingside wallet. Use it at our stores to pay instantly by tapping the card at checkout - no phone or app needed!
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                    <li>Same balance as your Wingside wallet</li>
                    <li>Tap to pay at any Wingside location</li>
                    <li>Track all transactions in one place</li>
                    <li>Set daily spending limits for safety</li>
                    <li>One card per customer</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-4">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Wingside Card Yet</h3>
              <p className="text-gray-500 mb-6">
                Visit any Wingside store to get your physical card and link it to your account.
              </p>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="inline-block px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
              >
                Link Your Card
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Card Details */}
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-8 mb-8 text-gray-900">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">Wingside Card</p>
                  <p className="text-3xl font-bold tracking-wider">{card.card_serial}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(card.status)}`}>
                  {card.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">Balance</p>
                  <p className="text-2xl font-bold">
                    ₦{balance?.balance.toLocaleString() || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">Card Type</p>
                  <p className="text-lg font-semibold">
                    {getCardTypeLabel(card.card_type)}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-yellow-600 border-opacity-30">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="opacity-80">Daily Limit</p>
                    <p className="font-semibold">₦{card.max_debit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Transactions</p>
                    <p className="font-semibold">{card.total_transactions}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Total Spent</p>
                    <p className="font-semibold">₦{card.total_spent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Link
                href="/my-account/wallet"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Add Money</p>
                    <p className="text-sm text-gray-500">Top up wallet</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/my-account/wallet?tab=history"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">History</p>
                    <p className="text-sm text-gray-500">View transactions</p>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => setShowStatusModal(true)}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Manage Card</p>
                    <p className="text-sm text-gray-500">Suspend or report</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Card Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Card Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Card Serial</span>
                  <span className="font-medium text-gray-900">{card.card_serial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Linked On</span>
                  <span className="font-medium text-gray-900">
                    {new Date(card.linked_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Used</span>
                  <span className="font-medium text-gray-900">
                    {card.last_used_at
                      ? new Date(card.last_used_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Balance Source</span>
                  <span className="font-medium text-gray-900">Wingside Wallet</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Note:</strong> Your Wingside Card shares the same balance as your Wingside Wallet. All card payments and wallet transactions affect the same account balance.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Onboard Modal */}
      {showOnboardModal && <OnboardCardModal onClose={() => setShowOnboardModal(false)} onSuccess={fetchCardStatus} />}

      {/* Status Management Modal */}
      {showStatusModal && card && (
        <StatusManagementModal
          card={card}
          onClose={() => setShowStatusModal(false)}
          onSuccess={fetchCardStatus}
        />
      )}
    </div>
  );
}

// Onboard Card Modal Component
function OnboardCardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [cardSerial, setCardSerial] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wingside-card/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_serial: cardSerial, card_pin: cardPin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link card');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Link Your Wingside Card</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Serial Number
            </label>
            <input
              type="text"
              value={cardSerial}
              onChange={(e) => setCardSerial(e.target.value.toUpperCase())}
              placeholder="WS123456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
              pattern="WS\d{6}"
              title="Format: WS followed by 6 digits (e.g., WS123456)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card PIN
            </label>
            <input
              type="password"
              value={cardPin}
              onChange={(e) => setCardPin(e.target.value)}
              placeholder="Enter 4-6 digit PIN"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
              pattern="\d{4,6}"
              title="PIN must be 4-6 digits"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Linking...' : 'Link Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Status Management Modal Component
function StatusManagementModal({
  card,
  onClose,
  onSuccess
}: {
  card: WingsideCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState(card.status);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wingside-card/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update card status');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update card status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Manage Card Status</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Status
            </label>
            <div className="space-y-2">
              {['active', 'suspended', 'lost', 'stolen'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-900 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you changing the card status?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedStatus === card.status}
              className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
