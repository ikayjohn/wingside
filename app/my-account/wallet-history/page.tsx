"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderNumber?: string;
}

export default function WalletHistoryPage() {
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // Fetch from both local wallet_transactions and Embedly
        const [localResponse, embedlyResponse] = await Promise.all([
          fetch('/api/user/wallet-history'),
          fetch('/api/embedly/wallets/history').catch(() => null) // May fail if no Embedly wallet
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
            // Convert Embedly transactions to the expected format
            const embedlyTransactions = Object.values(embedlyData.transactions)
              .flat()
              .map((txn: any) => ({
                id: txn.reference || txn.id || `embedly-${Date.now()}`,
                type: txn.type === 'debit' ? 'Payment' : 'Wallet Funding',
                description: txn.description || txn.remarks,
                amount: txn.type === 'debit' ? -Math.abs(txn.amount) : Math.abs(txn.amount),
                status: 'completed',
                paymentMethod: 'wallet',
                createdAt: txn.date || new Date().toISOString(),
                orderNumber: undefined
              }));
            allTransactions = [...allTransactions, ...embedlyTransactions];
          }
        }

        // Sort all transactions by date (newest first)
        allTransactions.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTransactions(allTransactions);
      } catch (err: any) {
        console.error('Error fetching wallet history:', err);
        setError(err.message || 'Failed to load wallet history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'payment', label: 'Payments' },
    { value: 'funding', label: 'Wallet Funding' },
    { value: 'refund', label: 'Refunds' },
  ];

  const handleFilterSelect = (value: string) => {
    setFilter(value);
    setShowFilterDropdown(false);
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type.toLowerCase().includes(filter));
  };

  const filteredTransactions = getFilteredTransactions();

  const formatPrice = (price: number) => {
    return '₦' + Math.abs(price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    const typeLower = type.toLowerCase();

    if (typeLower.includes('payment') || typeLower.includes('order')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      );
    }

    if (typeLower.includes('funding') || typeLower.includes('deposit')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      );
    }

    if (typeLower.includes('refund')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      );
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    );
  };

  const getIconColor = (transaction: Transaction) => {
    if (transaction.amount < 0) return 'red';
    if (transaction.type.toLowerCase().includes('funding')) return 'green';
    return 'blue';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

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
        </div>

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
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {/* Transactions List */}
        <div className="wallet-transactions">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <p className="text-gray-600">No transactions found</p>
              <p className="text-gray-500 text-sm mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="wallet-transaction-card">
                <div className="wallet-transaction-left">
                  <div className={`wallet-transaction-icon ${getIconColor(transaction)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="wallet-transaction-info">
                    <div className="wallet-transaction-header">
                      <h3 className="wallet-transaction-title">{transaction.type}</h3>
                      <span className={`wallet-transaction-status ${transaction.status === 'completed' ? 'completed' : transaction.status === 'pending' ? 'pending' : 'failed'}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <p className="wallet-transaction-description">{transaction.description}</p>
                    <div className="wallet-transaction-date">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {formatDate(transaction.createdAt)}
                    </div>
                    {transaction.orderNumber && (
                      <Link
                        href={`/my-account/orders/${transaction.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        View Order →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="wallet-transaction-right">
                  <p className={`wallet-transaction-amount ${transaction.amount >= 0 ? 'credit' : 'debit'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatPrice(transaction.amount)}
                  </p>
                  {transaction.paymentMethod && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      via {transaction.paymentMethod.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
