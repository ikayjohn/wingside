"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  pendingRewards: number;
  creditedRewards: number;
}

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  reward_amount: number;
  created_at: string;
  completed_at?: string;
  profiles?: {
    full_name: string;
    created_at: string;
  };
}

interface ShareMessage {
  subject?: string;
  body?: string;
  message?: string;
}

export default function ReferralSection() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
    pendingRewards: 0,
    creditedRewards: 0
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'email' | 'whatsapp' | 'twitter' | 'facebook' | 'copy_link'>('copy_link');
  const [emailAddress, setEmailAddress] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referrals/my-referrals');
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode || '');
        setStats(data.stats);
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getReferralUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
    return `${baseUrl}/signup?ref=${referralCode}`;
  };

  const handleShare = async () => {
    setSharingError(null);
    setEmailSent(false);

    try {
      const response = await fetch('/api/referrals/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareMethod,
          recipientEmail: shareMethod === 'email' ? emailAddress : undefined,
          customMessage: customMessage.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share referral');
      }

      const data = await response.json();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
      const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

      if (shareMethod === 'copy_link') {
        copyToClipboard(referralLink);
        setShowShareModal(false);
      } else if (shareMethod === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(data.messages.whatsapp.message)}`;
        window.open(whatsappUrl, '_blank');
        setShowShareModal(false);
      } else if (shareMethod === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.messages.twitter.message)}`;
        window.open(twitterUrl, '_blank');
        setShowShareModal(false);
      } else if (shareMethod === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(data.messages.facebook.message)}`;
        window.open(facebookUrl, '_blank');
        setShowShareModal(false);
      } else if (shareMethod === 'email' && emailAddress) {
        // Email sent successfully via backend
        setEmailSent(true);
        setTimeout(() => {
          setShowShareModal(false);
          setEmailAddress('');
          setCustomMessage('');
          setEmailSent(false);
        }, 2000);
      }

      if (shareMethod !== 'email') {
        setEmailAddress('');
        setCustomMessage('');
      }
    } catch (error) {
      console.error('Error sharing referral:', error);
      setSharingError(error instanceof Error ? error.message : 'Failed to share referral');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_signup':
        return 'bg-yellow-100 text-yellow-700';
      case 'signed_up':
        return 'bg-blue-100 text-blue-700';
      case 'first_order_completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_signup':
        return 'Pending Signup';
      case 'signed_up':
        return 'Signed Up';
      case 'first_order_completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Refer & Earn</h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium mb-2">🎉 Earn ₦1,000 for each referral!</p>
          <p className="text-sm text-yellow-700">Your friend also gets ₦1,000 after their first order. You'll earn your reward when your friend places their first order.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-2">Your referral link</label>
              <div className="flex">
                <input
                  type="text"
                  value={getReferralUrl()}
                  readOnly
                  placeholder="Your referral URL"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(getReferralUrl())}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-r-lg hover:bg-yellow-500 font-medium transition-colors text-sm whitespace-nowrap"
                >
                  {copied ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors self-end"
          >
            Share Referral
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-[#552627]">{stats.totalReferrals}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-[#F7C400]">{stats.pendingReferrals}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-[#552627]">{stats.completedReferrals}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-[#552627]">₦{stats.totalEarnings.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending Rewards</p>
          <p className="text-2xl font-bold text-[#F7C400]">₦{stats.pendingRewards.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Credited</p>
          <p className="text-2xl font-bold text-[#552627]">₦{stats.creditedRewards.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>

        {referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.slice(0, 5).map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {referral.profiles?.full_name || referral.referred_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Joined {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(referral.status)}`}>
                    {getStatusText(referral.status)}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    ₦{referral.reward_amount || 1000}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Image src="/referrals.svg" alt="No referrals" width={32} height={32} />
            </div>
            <p className="text-gray-600">No referrals yet</p>
            <p className="text-sm text-gray-500 mb-4">Share your referral code to start earning!</p>
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors"
            >
              Start Referring
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Your Referral Code</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Share via:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { method: 'copy_link' as const, label: 'Copy Link', icon: '🔗' },
                  { method: 'whatsapp' as const, label: 'WhatsApp', icon: '💬' },
                  { method: 'email' as const, label: 'Email', icon: '📧' },
                  { method: 'twitter' as const, label: 'Twitter', icon: '🐦' },
                  { method: 'facebook' as const, label: 'Facebook', icon: '📘' },
                ].map(({ method, label, icon }) => (
                  <button
                    key={method}
                    onClick={() => setShareMethod(method)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      shareMethod === method
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-sm font-medium">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {shareMethod === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}

            {sharingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">❌ {sharingError}</p>
              </div>
            )}

            {emailSent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✅ Email sent successfully to {emailAddress}!</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal touch to your referral..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={shareMethod === 'email' && !emailAddress.trim()}
                className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}