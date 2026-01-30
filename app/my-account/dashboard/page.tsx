"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConvertPointsModal from '@/components/ConvertPointsModal';
import FundWalletModal from '@/components/FundWalletModal';
import ReferralSection from '@/components/ReferralSection';
import FeedbackSection from '@/components/FeedbackSection';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  cardNumber: string;
  refId: string;
  referralCode: string;
  totalPoints: number;
  pointsThisMonth: number;
  currentTier: string;
  memberSince: string;
  availableToConvert: number;
  convertiblePoints: number;
  minConversion: number;
  tierProgress: {
    current: number;
    target: number;
    nextTier: string;
    percentage: number;
  };
  addresses: any[];
  recentOrders: any[];
  totalOrders: number;
  totalSpent: number;
  role: string;
  avatar_url?: string;
  current_streak?: number;
  longest_streak?: number;
  streak_start_date?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderNumber?: string;
}

interface EmbedlyWallet {
  id: string;
  availableBalance: number;
  ledgerBalance: number;
  name: string;
  virtualAccount: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
  };
  isDefault: boolean;
}

const getStreakMessage = (streak: number): string => {
  switch (streak) {
    case 1:
      return "Streak started! Let's build some momentum.";
    case 2:
      return "Nice! You're building your streak.";
    case 3:
      return "Keep going — you're halfway there!";
    case 4:
      return "Great consistency! Over halfway now.";
    case 5:
      return "Almost there — just 2 days to 500 points!";
    case 6:
      return "One more day to hit 500 points!";
    case 7:
      return "Streak complete! You've earned 500 points!";
    default:
      return "";
  }
};

export default function WingclubDashboard() {
  const router = useRouter();
  const [copied, setCopied] = useState<'card' | 'ref' | 'account' | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [embedlyWallet, setEmbedlyWallet] = useState<EmbedlyWallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Fetch user data on component mount
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile');
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Profile API error:', errorText);
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }
      const profileData = await profileResponse.json();

      // Fetch wallet transactions from both local and Embedly
      const [localResponse, embedlyResponse] = await Promise.all([
        fetch('/api/user/wallet-history'),
        fetch('/api/embedly/wallets/history').catch(() => null)
      ]);

      let allTransactions: Transaction[] = [];

      // Add local transactions
      if (localResponse.ok) {
        const localData = await localResponse.json();
        allTransactions = [...allTransactions, ...(localData.transactions || [])];
      }

      // Add Embedly transactions
      if (embedlyResponse && embedlyResponse.ok) {
        const embedlyData = await embedlyResponse.json();
        if (embedlyData.success && embedlyData.transactions) {
          const embedlyTransactions = Object.values(embedlyData.transactions)
            .flat()
            .map((txn: any) => ({
              id: txn.reference || txn.id || `embedly-${Date.now()}`,
              type: txn.type === 'debit' ? 'Payment' : 'Wallet Funding',
              description: txn.description || txn.remarks,
              amount: txn.type === 'debit' ? -Math.abs(txn.amount) : Math.abs(txn.amount),
              status: 'completed',
              paymentMethod: 'wallet',
              createdAt: txn.date || new Date().toISOString()
            }));
          allTransactions = [...allTransactions, ...embedlyTransactions];
        }
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setUserData(profileData.profile);
      setRecentTransactions(allTransactions);

      // Redirect admins to admin panel
      if (profileData.profile?.role === 'admin') {
        router.push('/admin');
        return;
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch Embedly wallet data
  const fetchEmbedlyWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const walletResponse = await fetch('/api/embedly/wallets');
      const walletData = await walletResponse.json();

      if (walletData.success && walletData.hasWallet && walletData.wallet) {
        setEmbedlyWallet(walletData.wallet);
      }
    } catch (err) {
      console.error('Failed to fetch Embedly wallet:', err);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    fetchEmbedlyWallet();
  }, [fetchEmbedlyWallet]);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  // Fetch notifications on component mount
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        // Update local state to mark all as read
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
      } else {
        console.error('Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const copyToClipboard = (text: string, type: 'card' | 'ref' | 'account' = 'card') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No user data state
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Welcome Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {userData.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-4 border-white" style={{ display: userData.avatar_url ? 'none' : 'flex' }}>
                <span className="text-2xl font-bold text-white">
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <h1 className="dashboard-welcome !mb-0">
                {greeting}, {userData.name.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {userData.currentTier} • {userData.totalPoints.toLocaleString()} points
              </p>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-full bg-white border-2 border-gray-200 hover:border-[#F7C400] hover:bg-yellow-50 transition-all shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h4"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>

              {/* Notification Badge */}
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                ></div>

                {/* Dropdown Content */}
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#552627] to-[#3a1a1b] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">Notifications</h3>
                      <span className="bg-[#F7C400] text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                        {notifications.filter(n => !n.read).length} new
                      </span>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-80">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                        <p className="text-sm">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h4"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-yellow-50' : ''
                              }`}
                          >
                            <div className="flex gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                {notification.icon}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {!notification.read && (
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-[#F7C400]"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                    <Link
                      href="/my-account/notifications"
                      className="block w-full text-sm text-center text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                    >
                      ⚙️ Notification Settings
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Wallet Card */}
        <div className="dashboard-wallet-card">
          <div className="dashboard-wallet-top">
            <div className="dashboard-wallet-left">
              {/* Wallet and Points Row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="dashboard-wallet-label">Wallet Balance</p>
                  {embedlyWallet ? (
                    <h2 className="dashboard-wallet-balance">₦{embedlyWallet.availableBalance.toLocaleString()}</h2>
                  ) : (
                    <h2 className="dashboard-wallet-balance">₦{userData.walletBalance.toLocaleString()}</h2>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <p className="dashboard-wallet-label">Points Balance</p>
                  <h2 className="dashboard-wallet-balance text-[#F7C400]">{userData.totalPoints.toLocaleString()}</h2>
                </div>
              </div>

              {embedlyWallet ? (
                <>
                  <p className="dashboard-wallet-card-number">
                    Your Wingside Account: {embedlyWallet.virtualAccount.accountNumber}
                  </p>

                  <div className="dashboard-wallet-actions">
                    <button
                      className="dashboard-fund-btn"
                      onClick={() => setShowFundModal(true)}
                    >
                      Fund wallet
                    </button>
                    <div className="dashboard-bank-info">
                      <span>{embedlyWallet.virtualAccount.bankName}</span>
                      <button
                        className="dashboard-copy-btn-icon"
                        onClick={() => copyToClipboard(embedlyWallet.virtualAccount.accountNumber, 'account')}
                      >
                        {copied === 'account' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="dashboard-wallet-card-number">Loading wallet...</p>

                  <div className="dashboard-wallet-actions">
                    <button className="dashboard-fund-btn" disabled>
                      Setting up wallet...
                    </button>
                    <div className="dashboard-bank-info">
                      <span>Please wait while we set up your wallet</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dashboard-wallet-right">
              <Image src="/wallet.svg" alt="Wallet" width={48} height={48} className="brightness-0 invert" />
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="dashboard-quick-actions">
          <button
            className="dashboard-action-card dashboard-action-active"
            onClick={() => setShowConvertModal(true)}
          >
            <div className="dashboard-action-icon blue">
              <Image src="/convert.svg" alt="Convert Points" width={40} height={40} />
            </div>
            <span>Convert Points</span>
          </button>

          <Link href="/my-account/earn-rewards" className="dashboard-action-card">
            <div className="dashboard-action-icon yellow">
              <Image src="/earnrewards.svg" alt="Earn Rewards" width={40} height={40} />
            </div>
            <span>Earn Rewards</span>
          </Link>

          <Link href="/my-account/tier-progression" className="dashboard-action-card">
            <div className="dashboard-action-icon gray">
              <Image src="/wingzard.svg" alt="Tier Progression" width={40} height={40} />
            </div>
            <span>Tier Progression</span>
          </Link>

          <Link href="/my-account/orders" className="dashboard-action-card">
            <div className="dashboard-action-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <span>My Orders</span>
          </Link>

          <Link href="/my-account/wallet-history" className="dashboard-action-card">
            <div className="dashboard-action-icon green">
              <Image src="/wallethistory.svg" alt="Wallet History" width={40} height={40} />
            </div>
            <span>Wallet History</span>
          </Link>
 
          <Link href="/my-account/cards" className="dashboard-action-card">
            <div className="dashboard-action-icon red">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <span>My Cards</span>
          </Link>
 
          <Link href="/my-account/referrals" className="dashboard-action-card">
            <div className="dashboard-action-icon purple">
              <Image src="/referrals.svg" alt="Referrals" width={40} height={40} />
            </div>
            <span>Referrals</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <p className="dashboard-stat-label">Points Balance</p>
            <h3 className="dashboard-stat-value">{userData.totalPoints.toLocaleString()}</h3>
            <p className="dashboard-stat-sub">+{userData.pointsThisMonth} this month</p>
          </div>

          <div className="dashboard-stat-card">
            <p className="dashboard-stat-label">Current Tier</p>
            <h3 className="dashboard-stat-value">{userData.currentTier}</h3>
            <p className="dashboard-stat-sub">Member since {userData.memberSince}</p>
          </div>

          <div className="dashboard-stat-card">
            <p className="dashboard-stat-label">Available to Convert</p>
            <h3 className="dashboard-stat-value">₦{userData.availableToConvert.toLocaleString()}</h3>
            <p className="dashboard-stat-sub">{userData.convertiblePoints.toLocaleString()} points &nbsp;&nbsp; Minimum Conversion: {userData.minConversion} points</p>
          </div>
        </div>



        {/* Streak and Tier Progress - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* Streak Counter - Advanced 7-Day System */}
          <div className="h-full">
            {(userData.current_streak ?? 0) > 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 relative h-full flex flex-col">
              {/* Personal Best - Top Right */}
              <div className="absolute top-6 right-6 text-sm">
                <span className="text-gray-500 font-semibold">
                  Personal Best: {userData.longest_streak ?? 0} Days
                </span>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <Image src="/streak.svg" alt="Streak" width={32} height={32} className="text-red-500" style={{ color: '#EF4444' }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {userData.current_streak >= 7 ? '500 Points Earned!' : `Day ${userData.current_streak} of 7`}
                </h3>
                <p className="text-gray-600 text-sm">
                  {getStreakMessage(userData.current_streak)}
                </p>
              </div>

              {/* Days Row */}
              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className="flex-1 max-w-[48px] flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        userData.current_streak >= day
                          ? ''
                          : 'bg-white border-2 border-gray-200'
                      }`}
                      style={userData.current_streak >= day ? { backgroundColor: '#F9CB0C' } : {}}
                    >
                      {userData.current_streak >= day ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : null}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      Day {day}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 p-6 border-2 border-dashed border-gray-300 h-full flex flex-col justify-center">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-300 rounded-full">
                    <Image src="/streak.svg" alt="Streak" width={32} height={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700">Start Your 7-Day Streak!</h3>
                    <p className="text-gray-600">Earn 500 points by ordering for 7 consecutive days</p>
                  </div>
                </div>

                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span><strong>₦15,000+</strong> order each day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span><strong>7 days</strong> = 500 points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>Streak resets after completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-0.5">!</span>
                    <span>Miss a day → streak resets</span>
                  </li>
                </ul>

                {/* CTA */}
                <Link
                  href="/order"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg text-center hover:from-orange-600 hover:to-yellow-600 transition-all"
                >
                  Start Your Streak Now
                </Link>
              </div>
            </div>
          )}
          </div>

          {/* Tier Progress */}
          <div className="dashboard-tier-section lg:mb-0 h-full flex flex-col">
          <h3 className="dashboard-tier-title">Tier Progress</h3>

          <div className="dashboard-tier-card h-full flex flex-col">
            <div className="dashboard-tier-header">
              <div>
                <p className="dashboard-tier-progress-label">Progress to {userData.tierProgress.nextTier}</p>
                <p className="dashboard-tier-points">
                  {userData.currentTier === 'Wingzard'
                    ? 'Max tier reached!'
                    : `${userData.tierProgress.target - userData.tierProgress.current} more points needed`}
                </p>
              </div>
              <div className="dashboard-tier-percentage">
                <span className="dashboard-tier-percent-value">{userData.tierProgress.percentage}%</span>
                <span className="dashboard-tier-percent-label">Complete</span>
              </div>
            </div>

            <div className="dashboard-progress-bar">
              <div
                className="dashboard-progress-fill"
                style={{ width: `${userData.tierProgress.percentage}%` }}
              ></div>
            </div>

            <p className="dashboard-tier-hint">
              {userData.currentTier === 'Wingzard'
                ? 'You are a Wingzard! Enjoy exclusive VIP benefits.'
                : `Earn ${userData.tierProgress.target - userData.tierProgress.current} more points to reach ${userData.tierProgress.nextTier}`
              }
            </p>
          </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-recent-grid items-stretch">
          {/* Recent Orders */}
          <div className="dashboard-recent-section h-full flex flex-col">
            <div className="dashboard-recent-header">
              <h3 className="dashboard-recent-title">My Recent Orders</h3>
              <Link href="/my-account/orders" className="dashboard-view-all">View All</Link>
            </div>

            {userData.recentOrders && userData.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {userData.recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        {order.items && (
                          <p className="text-sm text-gray-500">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{Number(order.total).toLocaleString()}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      order.status === 'failed' ? 'bg-red-200 text-red-800' :
                                        'bg-gray-100 text-gray-700'
                          }`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-card h-full flex flex-col justify-center">
                <div className="dashboard-empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h4 className="dashboard-empty-title">No Recent Orders</h4>
                <p className="dashboard-empty-text">You currently do not have any recent orders</p>
                <Link href="/order" className="dashboard-order-btn">Order now</Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-recent-section h-full flex flex-col">
            <div className="dashboard-recent-header">
              <h3 className="dashboard-recent-title">Recent Transactions</h3>
              <Link href="/my-account/wallet-history" className="dashboard-view-all">View All</Link>
            </div>

            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        {transaction.paymentMethod && (
                          <p className="text-sm text-gray-500">Via {transaction.paymentMethod}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                          {transaction.amount < 0 ? '-' : '+'} ₦{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {transaction.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-card h-full flex flex-col justify-center">
                <div className="dashboard-empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="12" rx="2"></rect>
                    <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path>
                    <path d="M12 12v4"></path>
                    <path d="M8 12v4"></path>
                    <path d="M16 12v4"></path>
                  </svg>
                </div>
                <h4 className="dashboard-empty-title">No transaction recorded</h4>
                <p className="dashboard-empty-text">You do not have any recent transaction</p>
              </div>
            )}
          </div>
        </div>

        {/* Referral Section */}
        <div className="mt-8">
          <ReferralSection />
        </div>

        {/* Feedback Section */}
        <div className="mt-8">
          <FeedbackSection />
        </div>

      </div>

      {/* Convert Points Modal */}
      <ConvertPointsModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        availablePoints={userData.totalPoints}
        conversionRate={10}
      />

      {/* Fund Wallet Modal */}
      {embedlyWallet && (
        <FundWalletModal
          isOpen={showFundModal}
          onClose={() => setShowFundModal(false)}
          accountNumber={embedlyWallet.virtualAccount.accountNumber}
          accountName={embedlyWallet.name}
          bankName={embedlyWallet.virtualAccount.bankName}
          currentBalance={embedlyWallet.availableBalance}
          onRefreshBalance={fetchEmbedlyWallet}
        />
      )}
    </div>
  );
}