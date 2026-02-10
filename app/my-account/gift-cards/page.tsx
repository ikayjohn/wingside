'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface GiftCard {
  id: string;
  code: string;
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
  purchased_by: string;
}

export default function GiftCardsPage() {
  const [loading, setLoading] = useState(true);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [activeCards, setActiveCards] = useState<GiftCard[]>([]);
  const [usedCards, setUsedCards] = useState<GiftCard[]>([]);
  const [expiredCards, setExpiredCards] = useState<GiftCard[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'active' | 'used' | 'expired'>('active');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?redirect=/my-account/gift-cards';
        return;
      }

      const response = await fetch('/api/user/gift-cards');
      if (!response.ok) throw new Error('Failed to fetch gift cards');

      const data = await response.json();
      setGiftCards(data.gift_cards);
      setActiveCards(data.active);
      setUsedCards(data.used);
      setExpiredCards(data.expired);
      setTotalBalance(data.total_balance);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getPercentageUsed = (card: GiftCard) => {
    return ((card.initial_balance - card.current_balance) / card.initial_balance) * 100;
  };

  const renderGiftCard = (card: GiftCard) => (
    <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header with Design */}
      <div className="relative h-32 bg-gradient-to-br from-[#F7C400] to-[#FDB913] overflow-hidden">
        {card.design_image && (
          <img
            src={`/${card.design_image}`}
            alt="Gift Card Design"
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-[#552627] opacity-80">Gift Card Balance</p>
            <p className="text-3xl font-bold text-[#552627]">{formatCurrency(card.current_balance)}</p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Code */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Code</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-lg font-mono font-semibold text-gray-800 bg-gray-100 px-3 py-2 rounded">
              {card.code}
            </code>
            <button
              onClick={() => copyCode(card.code)}
              className="px-3 py-2 bg-[#F7C400] text-[#552627] rounded hover:bg-[#e5b500] transition-colors text-sm font-semibold"
            >
              {copiedCode === card.code ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {card.current_balance > 0 && card.current_balance < card.initial_balance && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Used: {formatCurrency(card.initial_balance - card.current_balance)}</span>
              <span>{Math.round(getPercentageUsed(card))}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#F7C400] h-2 rounded-full transition-all"
                style={{ width: `${getPercentageUsed(card)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Original Amount:</span>
            <span className="font-medium text-gray-800">{formatCurrency(card.initial_balance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expires:</span>
            <span className={`font-medium ${new Date(card.expires_at) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
              {formatDate(card.expires_at)}
            </span>
          </div>
          {card.last_used_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last Used:</span>
              <span className="font-medium text-gray-800">{formatDate(card.last_used_at)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {card.is_active && card.current_balance > 0 && new Date(card.expires_at) > new Date() && (
          <Link
            href="/order"
            className="mt-4 block w-full text-center bg-[#F7C400] text-[#552627] py-2 rounded-lg font-semibold hover:bg-[#e5b500] transition-colors"
          >
            Use Now
          </Link>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF5E5] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF5E5] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#552627] mb-2">My Gift Cards</h1>
          <p className="text-gray-600">View and manage your Wingside gift cards</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-[#F7C400] to-[#FDB913] rounded-2xl p-8 mb-8 shadow-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-[#552627] opacity-80 mb-2">Total Available Balance</p>
            <p className="text-5xl font-bold text-[#552627] mb-4">{formatCurrency(totalBalance)}</p>
            <Link
              href="/order"
              className="inline-block bg-[#552627] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d1c1d] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'active'
                ? 'text-[#552627] border-b-2 border-[#F7C400]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({activeCards.length})
          </button>
          <button
            onClick={() => setActiveTab('used')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'used'
                ? 'text-[#552627] border-b-2 border-[#F7C400]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Used ({usedCards.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'expired'
                ? 'text-[#552627] border-b-2 border-[#F7C400]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expired ({expiredCards.length})
          </button>
        </div>

        {/* Gift Cards Grid */}
        {activeTab === 'active' && (
          <div>
            {activeCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Gift Cards</h3>
                <p className="text-gray-600 mb-6">You don't have any active gift cards at the moment.</p>
                <Link
                  href="/gifts"
                  className="inline-block bg-[#F7C400] text-[#552627] px-8 py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors"
                >
                  Browse Gift Cards
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCards.map(renderGiftCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'used' && (
          <div>
            {usedCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Used Gift Cards</h3>
                <p className="text-gray-600">You haven't fully used any gift cards yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usedCards.map(renderGiftCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'expired' && (
          <div>
            {expiredCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Expired Gift Cards</h3>
                <p className="text-gray-600">Great! You don't have any expired gift cards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiredCards.map(renderGiftCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
