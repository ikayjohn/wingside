"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function WalletHistoryPage() {
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  // Mock data - in real app this would come from API
  const stats = {
    totalSpent: 43490,
    totalDeposited: 50000,
    pointsConverted: 800,
    bonusesEarned: 25750,
  };

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'spending', label: 'Spending' },
    { value: 'funding', label: 'Funding' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'bonuses', label: 'Bonuses' },
  ];

  const handleFilterSelect = (value: string) => {
    setFilter(value);
    setShowFilterDropdown(false);
  };

  const handleResetFilters = () => {
    setFilter('all');
    setDateRange({ from: '', to: '' });
  };

  const handleClearDates = () => {
    setDateRange({ from: '', to: '' });
  };

  const allTransactions = [
    {
      id: 1,
      type: 'Points to Cash Conversion',
      description: 'Converted 500 points to cash',
      date: 'Jan 28.03 02:30 PM',
      amount: 3000,
      points: 50,
      status: 'completed',
      icon: 'convert',
      iconColor: 'blue',
      isCredit: true,
      category: 'conversions',
    },
    {
      id: 2,
      type: 'Wing Order #WG2024128',
      description: 'Buffalo Classic + BBQ Smoky (12 wings)',
      date: 'Jan 27.03 03:15 PM',
      amount: 24000,
      points: 245,
      status: 'completed',
      icon: 'order',
      iconColor: 'red',
      isCredit: false,
      category: 'spending',
    },
    {
      id: 3,
      type: 'Wallet Funding',
      description: 'Card deposit',
      date: 'Jan 27.03 02:30 PM',
      amount: 60000,
      points: null,
      status: 'completed',
      icon: 'wallet',
      iconColor: 'green',
      isCredit: true,
      category: 'funding',
    },
    {
      id: 4,
      type: 'Welcome Bonus',
      description: 'New member signup bonus',
      date: 'Jan 26.03 02:30 PM',
      amount: null,
      points: 1000,
      status: 'completed',
      icon: 'gift',
      iconColor: 'purple',
      isCredit: true,
      category: 'bonuses',
    },
    {
      id: 5,
      type: 'Wing Order #WG2024125',
      description: 'Honey Garlic + Lemon Pepper (18 wings)',
      date: 'Jan 26.03 07:45 PM',
      amount: 32000,
      points: 320,
      status: 'completed',
      icon: 'order',
      iconColor: 'red',
      isCredit: false,
      category: 'spending',
    },
    {
      id: 6,
      type: 'Referral Bonus',
      description: 'Friend signed up using your referral',
      date: 'Jan 25.03 11:20 AM',
      amount: null,
      points: 500,
      status: 'completed',
      icon: 'gift',
      iconColor: 'purple',
      isCredit: true,
      category: 'bonuses',
    },
    {
      id: 7,
      type: 'Wallet Funding',
      description: 'Bank transfer',
      date: 'Jan 24.03 09:15 AM',
      amount: 50000,
      points: null,
      status: 'completed',
      icon: 'wallet',
      iconColor: 'green',
      isCredit: true,
      category: 'funding',
    },
    {
      id: 8,
      type: 'Points to Cash Conversion',
      description: 'Converted 1000 points to cash',
      date: 'Jan 23.03 04:30 PM',
      amount: 6000,
      points: 100,
      status: 'completed',
      icon: 'convert',
      iconColor: 'blue',
      isCredit: true,
      category: 'conversions',
    },
    {
      id: 9,
      type: 'Wing Order #WG2024120',
      description: 'Spicy Korean + Teriyaki (12 wings)',
      date: 'Jan 22.03 06:30 PM',
      amount: 28000,
      points: 280,
      status: 'completed',
      icon: 'order',
      iconColor: 'red',
      isCredit: false,
      category: 'spending',
    },
    {
      id: 10,
      type: 'Birthday Bonus',
      description: 'Happy birthday from Wingside!',
      date: 'Jan 20.03 12:00 AM',
      amount: 5000,
      points: 250,
      status: 'completed',
      icon: 'gift',
      iconColor: 'purple',
      isCredit: true,
      category: 'bonuses',
    },
    {
      id: 11,
      type: 'Wing Order #WG2024115',
      description: 'BBQ Classic + Hot Wings (24 wings)',
      date: 'Jan 19.03 08:15 PM',
      amount: 42000,
      points: 420,
      status: 'completed',
      icon: 'order',
      iconColor: 'red',
      isCredit: false,
      category: 'spending',
    },
    {
      id: 12,
      type: 'Wallet Funding',
      description: 'Card deposit',
      date: 'Jan 18.03 03:45 PM',
      amount: 40000,
      points: null,
      status: 'completed',
      icon: 'wallet',
      iconColor: 'green',
      isCredit: true,
      category: 'funding',
    },
  ];

  // Convert transaction date string to Date object for comparison
  const parseTransactionDate = (dateStr: string) => {
    // Format: "Jan 28.03 02:30 PM" -> Convert to "2024-01-28"
    const months: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const parts = dateStr.split(' ');
    const month = months[parts[0]];
    const day = parts[1].split('.')[0].padStart(2, '0');
    const year = '2024'; // Using 2024 as default year

    return `${year}-${month}-${day}`;
  };

  // Filter transactions based on selected filter and date range
  const getFilteredTransactions = () => {
    let filtered = filter === 'all'
      ? allTransactions
      : allTransactions.filter(t => t.category === filter);

    // Apply date range filter if dates are selected
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(transaction => {
        const transactionDate = parseTransactionDate(transaction.date);

        if (dateRange.from && dateRange.to) {
          return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
        } else if (dateRange.from) {
          return transactionDate >= dateRange.from;
        } else if (dateRange.to) {
          return transactionDate <= dateRange.to;
        }

        return true;
      });
    }

    return filtered;
  };

  const transactions = getFilteredTransactions();

  const getIcon = (iconName: string) => {
    const icons = {
      convert: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      ),
      order: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
      wallet: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      ),
      gift: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
      ),
    };
    return icons[iconName as keyof typeof icons];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="wallet-history-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="wallet-history-header">
          <h1 className="wallet-history-title">Wallet History</h1>
          <p className="wallet-history-subtitle">Track all your wallet transactions and activity</p>
        </div>

        {/* Stats Cards */}
        <div className="wallet-stats-grid">
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Total Spent</p>
            <p className="wallet-stat-value">₦{stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Total Deposited</p>
            <p className="wallet-stat-value">₦{stats.totalDeposited.toLocaleString()}</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Points Converted</p>
            <p className="wallet-stat-value">{stats.pointsConverted} pts</p>
          </div>
          <div className="wallet-stat-card">
            <p className="wallet-stat-label">Bonuses Earned</p>
            <p className="wallet-stat-value">₦{stats.bonusesEarned.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="wallet-filters">
          {/* Custom Filter Dropdown */}
          <div className="wallet-custom-filter-wrapper">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="wallet-custom-filter-btn"
            >
              <span>{filterOptions.find(opt => opt.value === filter)?.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showFilterDropdown && (
              <div className="wallet-custom-filter-dropdown">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect(option.value)}
                    className={`wallet-custom-filter-option ${filter === option.value ? 'active' : ''}`}
                  >
                    <span>{option.label}</span>
                    {filter === option.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="wallet-date-range-wrapper">
            <div className="wallet-date-range-inputs">
              <div className="wallet-date-input-group">
                <label className="wallet-date-label">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="wallet-date-input"
                />
              </div>
              <span className="wallet-date-separator">-</span>
              <div className="wallet-date-input-group">
                <label className="wallet-date-label">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="wallet-date-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reset Buttons */}
        {(filter !== 'all' || dateRange.from || dateRange.to) && (
          <div className="wallet-reset-buttons">
            {(dateRange.from || dateRange.to) && (
              <button onClick={handleClearDates} className="wallet-reset-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear Dates
              </button>
            )}
            <button onClick={handleResetFilters} className="wallet-reset-btn wallet-reset-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Reset All Filters
            </button>
          </div>
        )}

        {/* Transaction Tabs */}
        <div className="wallet-tabs">
          <button className="wallet-tab active">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Transaction History
          </button>
          <span className="wallet-transaction-count">
            {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {/* Transactions List */}
        <div className="wallet-transactions">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="wallet-transaction-card">
              <div className="wallet-transaction-left">
                <div className={`wallet-transaction-icon ${transaction.iconColor}`}>
                  {getIcon(transaction.icon)}
                </div>
                <div className="wallet-transaction-info">
                  <div className="wallet-transaction-header">
                    <h3 className="wallet-transaction-title">{transaction.type}</h3>
                    <span className="wallet-transaction-status">{transaction.status}</span>
                  </div>
                  <p className="wallet-transaction-description">{transaction.description}</p>
                  <div className="wallet-transaction-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {transaction.date}
                  </div>
                </div>
              </div>

              <div className="wallet-transaction-right">
                {transaction.amount !== null && (
                  <p className={`wallet-transaction-amount ${transaction.isCredit ? 'credit' : 'debit'}`}>
                    {transaction.isCredit ? '+' : ''}₦{transaction.amount.toLocaleString()}
                  </p>
                )}
                {transaction.points !== null && (
                  <p className="wallet-transaction-points">+{transaction.points} pts</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
