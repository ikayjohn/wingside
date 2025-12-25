"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConvertPointsModal from '@/components/ConvertPointsModal';
import FundWalletModal from '@/components/FundWalletModal';
import ReferralSection from '@/components/ReferralSection';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  cardNumber: string;
  bankAccount: string;
  bankName: string;
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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
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

        // Fetch wallet transactions
        const transactionsResponse = await fetch('/api/user/wallet-history');
        if (!transactionsResponse.ok) {
          console.error('Transactions API error:', transactionsResponse.status);
        }
        const transactionsData = await transactionsResponse.json();

        setUserData(profileData.profile);
        setRecentTransactions(transactionsData.transactions || []);

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
    };

    fetchUserData();
  }, []);

  // Fetch Embedly wallet data
  useEffect(() => {
    const fetchEmbedlyWallet = async () => {
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
    };

    fetchEmbedlyWallet();
  }, []);

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
        <h1 className="dashboard-welcome">
          Welcome, {userData.name}
        </h1>

        {/* Wallet Card */}
        <div className="dashboard-wallet-card">
          <div className="dashboard-wallet-top">
            <div className="dashboard-wallet-left">
              <p className="dashboard-wallet-label">Wallet Balance</p>
              {embedlyWallet ? (
                <>
                  <h2 className="dashboard-wallet-balance">₦{embedlyWallet.availableBalance.toLocaleString()}</h2>
                  <p className="dashboard-wallet-card-number">
                    Your Wingside Account: {embedlyWallet.virtualAccount.accountNumber}
                  </p>

                  <div className="dashboard-wallet-actions">
                    <button className="dashboard-fund-btn" onClick={() => setShowFundModal(true)}>
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
                  <h2 className="dashboard-wallet-balance">₦{userData.walletBalance.toLocaleString()}</h2>
                  <p className="dashboard-wallet-card-number">Card: {userData.cardNumber}</p>

                  <div className="dashboard-wallet-actions">
                    <button className="dashboard-fund-btn" onClick={() => setShowFundModal(true)}>
                      Fund wallet
                    </button>
                    <div className="dashboard-bank-info">
                      <span>{userData.bankName}: {userData.bankAccount}</span>
                      <button
                        className="dashboard-copy-btn"
                        onClick={() => copyToClipboard(userData.bankAccount, 'card')}
                      >
                        {copied === 'card' ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dashboard-wallet-right">
              <button className="dashboard-wallet-icon-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                </svg>
              </button>

              <div className="dashboard-ref-id-inline">
                <span>Referral Code: {userData.referralCode || userData.refId}</span>
                <button
                  className="dashboard-copy-btn-dark"
                  onClick={() => copyToClipboard(userData.referralCode || userData.refId, 'ref')}
                >
                  {copied === 'ref' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <p className="dashboard-section-title">How can we improve your wing experience today?</p>

        <div className="dashboard-quick-actions">
          <button
            className="dashboard-action-card dashboard-action-active"
            onClick={() => setShowConvertModal(true)}
          >
            <div className="dashboard-action-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </div>
            <span>Convert Points</span>
          </button>

          <Link href="/my-account/earn-rewards" className="dashboard-action-card">
            <div className="dashboard-action-icon yellow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <span>Earn rewards</span>
          </Link>

          <Link href="/my-account/tier-progression" className="dashboard-action-card">
            <div className="dashboard-action-icon gray">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-4-4 4-6-7z"></path>
                <path d="M3 16h18"></path>
              </svg>
            </div>
            <span>Tier Progression</span>
          </Link>

          <Link href="/my-account/wallet-history" className="dashboard-action-card">
            <div className="dashboard-action-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span>Wallet History</span>
          </Link>

          <Link href="/my-account/referrals" className="dashboard-action-card">
            <div className="dashboard-action-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3.5-3.5M19 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6"></path>
              </svg>
            </div>
            <span>Referrals</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <p className="dashboard-stat-label">Total Points</p>
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

        {/* Tier Progress */}
        <div className="dashboard-tier-section">
          <h3 className="dashboard-tier-title">Tier Progress</h3>

          <div className="dashboard-tier-card">
            <div className="dashboard-tier-header">
              <div>
                <p className="dashboard-tier-progress-label">Progress to {userData.tierProgress.nextTier}</p>
                <p className="dashboard-tier-points">
                  {userData.currentTier === 'Wingzard'
                    ? 'Max tier reached!'
                    : `${userData.tierProgress.pointsToNext} more points needed`}
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
                : `Earn ${userData.tierProgress.pointsToNext} more points to reach ${userData.tierProgress.nextTier}`
              }
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-recent-grid">
          {/* Recent Orders */}
          <div className="dashboard-recent-section">
            <div className="dashboard-recent-header">
              <h3 className="dashboard-recent-title">My Recent Orders</h3>
              <Link href="/order-confirmation" className="dashboard-view-all">View All</Link>
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
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-700' :
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
              <div className="dashboard-empty-card">
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
          <div className="dashboard-recent-section">
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
                        <p className={`font-semibold ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount < 0 ? '-' : '+'} ₦{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
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
              <div className="dashboard-empty-card">
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
        <ReferralSection />

      </div>

      {/* Convert Points Modal */}
      <ConvertPointsModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        availablePoints={userData.totalPoints}
        conversionRate={10}
      />

      {/* Fund Wallet Modal */}
      <FundWalletModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        accountNumber={embedlyWallet?.virtualAccount.accountNumber || userData.bankAccount}
        accountName={embedlyWallet?.name || `Wingclub / ${userData.name}`}
        bankName={embedlyWallet?.virtualAccount.bankName || userData.bankName}
      />
    </div>
  );
}