"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Card {
  id: string;
  cardId: string;
  cardType: 'VIRTUAL' | 'PHYSICAL';
  cardStatus: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'TERMINATED';
  maskedPan: string;
  expiryDate: string;
  balance: number;
  currencyId: string;
  cardPinSet: boolean;
  spendLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  isDefault: boolean;
  createdAt: string;
}

interface FundModalProps {
  card: Card;
  onConfirm: (cardId: string, amount: number) => void;
  onClose: () => void;
}

function FundModal({ card, onConfirm, onClose }: FundModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFund = async () => {
    const fundAmount = parseFloat(amount);
    if (!fundAmount || fundAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(card.cardId, fundAmount);
      onClose();
    } catch (error) {
      console.error('Error funding card:', error);
      alert(error instanceof Error ? error.message : 'Failed to fund card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Fund Card {card.maskedPan}
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₦)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            min="100"
            step="100"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFund}
            className="flex-1 px-4 py-3 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Fund Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LimitModalProps {
  card: Card;
  onConfirm: (cardId: string, dailyLimit?: number, monthlyLimit?: number) => void;
  onClose: () => void;
}

function LimitModal({ card, onConfirm, onClose }: LimitModalProps) {
  const [dailyLimit, setDailyLimit] = useState(card.dailyLimit?.toString() || '');
  const [monthlyLimit, setMonthlyLimit] = useState(card.monthlyLimit?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await onConfirm(
        card.cardId,
        dailyLimit ? parseFloat(dailyLimit) : undefined,
        monthlyLimit ? parseFloat(monthlyLimit) : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error updating limits:', error);
      alert(error instanceof Error ? error.message : 'Failed to update limits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Update Limits - {card.maskedPan}
        </h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Limit (₦)
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              placeholder="Enter daily limit"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Limit (₦)
            </label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="Enter monthly limit"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              min="10000"
              step="10000"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className="flex-1 px-4 py-3 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Limits'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasEmbedlyAccount, setHasEmbedlyAccount] = useState<boolean | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/embedly/cards');

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cards API error:', errorData);
        const errorMsg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || `Failed to fetch cards (${response.status})`);
        setError(errorMsg);

        if (errorData.error?.includes('Embedly customer') || errorData.error?.includes('wallet')) {
          setHasEmbedlyAccount(false);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCards(data.cards);
        setHasEmbedlyAccount(true);
      } else {
        console.error('Cards fetch error:', data);
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to fetch cards');
        setError(errorMsg);

        if (data.error?.includes('Embedly customer') || data.error?.includes('wallet')) {
          setHasEmbedlyAccount(false);
        }
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (cardType: 'VIRTUAL' | 'PHYSICAL') => {
    if (!hasEmbedlyAccount) {
      alert('You need an Embedly wallet to create cards. Please contact support.');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/embedly/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchCards();
      } else {
        alert(data.error || 'Failed to create card');
      }
    } catch (err) {
      console.error('Error creating card:', err);
      alert(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  const handleCardAction = async (cardId: string, action: string) => {
    try {
      setActionLoading(cardId);
      const response = await fetch(`/api/embedly/cards/${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchCards();
      } else {
        alert(data.error || 'Failed to perform action');
      }
    } catch (err) {
      console.error('Error performing card action:', err);
      alert('Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFundCard = async (cardId: string, amount: number) => {
    const response = await fetch('/api/embedly/cards/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        amount,
        narration: `Fund card ${cardId}`
      }),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fund card');
    }

    await fetchCards();
  };

  const handleUpdateLimit = async (cardId: string, dailyLimit?: number, monthlyLimit?: number) => {
    const response = await fetch('/api/embedly/cards/limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        dailyLimit,
        monthlyLimit
      }),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update limits');
    }

    await fetchCards();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'FROZEN': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      case 'TERMINATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchCards}
            className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
          >
            Try Again
          </button>
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
            <h1 className="text-2xl font-bold text-gray-900">My Cards</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Card Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Card
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleCreateCard('VIRTUAL')}
              disabled={creating}
              className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Virtual Card</p>
                <p className="text-sm text-gray-500">Instant delivery</p>
              </div>
            </button>
            <button
              onClick={() => handleCreateCard('PHYSICAL')}
              disabled={creating}
              className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
                <path d="M12 15h.01"></path>
              </svg>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Physical Card</p>
                <p className="text-sm text-gray-500">Delivered to address</p>
              </div>
            </button>
          </div>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-4">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cards Yet</h3>
            <p className="text-gray-500 mb-6">
              You don't have any cards yet. Create a virtual or physical card to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  {/* Card Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{card.maskedPan}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(card.cardStatus)}`}>
                            {card.cardStatus}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {card.cardType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Balance</p>
                        <p className="font-semibold text-gray-900">
                          ₦{card.balance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expiry</p>
                        <p className="font-semibold text-gray-900">
                          {card.expiryDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Daily Limit</p>
                        <p className="font-semibold text-gray-900">
                          ₦{card.dailyLimit?.toLocaleString() || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Monthly Limit</p>
                        <p className="font-semibold text-gray-900">
                          ₦{card.monthlyLimit?.toLocaleString() || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedCard(card);
                        setShowFundModal(true);
                      }}
                      className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Fund
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCard(card);
                        setShowLimitModal(true);
                      }}
                      className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Limits
                    </button>
                    {card.cardStatus === 'ACTIVE' ? (
                      <button
                        onClick={() => handleCardAction(card.cardId, 'freeze')}
                        disabled={actionLoading === card.cardId}
                        className="px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === card.cardId ? 'Freezing...' : 'Freeze'}
                      </button>
                    ) : card.cardStatus === 'FROZEN' ? (
                      <button
                        onClick={() => handleCardAction(card.cardId, 'unfreeze')}
                        disabled={actionLoading === card.cardId}
                        className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === card.cardId ? 'Unfreezing...' : 'Unfreeze'}
                      </button>
                    ) : card.cardStatus === 'BLOCKED' ? (
                      <button
                        onClick={() => handleCardAction(card.cardId, 'unblock')}
                        disabled={actionLoading === card.cardId}
                        className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === card.cardId ? 'Unblocking...' : 'Unblock'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCardAction(card.cardId, 'block')}
                        disabled={actionLoading === card.cardId}
                        className="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === card.cardId ? 'Blocking...' : 'Block'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fund Modal */}
      {showFundModal && selectedCard && (
        <FundModal
          card={selectedCard}
          onConfirm={handleFundCard}
          onClose={() => {
            setShowFundModal(false);
            setSelectedCard(null);
          }}
        />
      )}

      {/* Limit Modal */}
      {showLimitModal && selectedCard && (
        <LimitModal
          card={selectedCard}
          onConfirm={handleUpdateLimit}
          onClose={() => {
            setShowLimitModal(false);
            setSelectedCard(null);
          }}
        />
      )}
    </div>
  );
}
