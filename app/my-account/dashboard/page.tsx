"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import ConvertPointsModal from '@/components/ConvertPointsModal';
import FundWalletModal from '@/components/FundWalletModal';

export default function WingclubDashboard() {
  const [copied, setCopied] = useState<'card' | 'ref' | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);

  // User data - in real app this would come from API/context
  const userData = {
    name: 'Fortune',
    walletBalance: 15000,
    cardNumber: 'WC001234567890',
    bankAccount: '9012345678',
    bankName: 'Wingside Bank',
    refId: 'WingmanFortune',
    totalPoints: 1500,
    pointsThisMonth: 275,
    currentTier: 'Wing Leader',
    memberSince: '15/01/2024',
    availableToConvert: 15000,
    convertiblePoints: 2750,
    minConversion: 100,
    tierProgress: {
      current: 2250,
      target: 5000,
      nextTier: 'Wingzard',
      percentage: 44,
    },
  };

  const copyToClipboard = (text: string, type: 'card' | 'ref') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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
                <span>Ref ID: {userData.refId}</span>
                <button
                  className="dashboard-copy-btn-dark"
                  onClick={() => copyToClipboard(userData.refId, 'ref')}
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
                <p className="dashboard-tier-points">{userData.tierProgress.current} points to go</p>
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
              Buy {userData.tierProgress.target - (userData.tierProgress.target * userData.tierProgress.percentage / 100)} more wings to reach {userData.tierProgress.nextTier}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-recent-grid">
          {/* Recent Orders */}
          <div className="dashboard-recent-section">
            <div className="dashboard-recent-header">
              <h3 className="dashboard-recent-title">My Recent Orders</h3>
              <Link href="/orders" className="dashboard-view-all">View All</Link>
            </div>
            
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
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-recent-section">
            <div className="dashboard-recent-header">
              <h3 className="dashboard-recent-title">Recent Transactions</h3>
              <Link href="/transactions" className="dashboard-view-all">View All</Link>
            </div>
            
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
          </div>
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
      <FundWalletModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        accountNumber={userData.bankAccount}
        accountName="Wingclub / Fortune"
        bankName={userData.bankName}
      />
    </div>
  );
}