"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  created_at: string;
  balance_before?: number;
  balance_after?: number;
  metadata?: any;
  profiles?: {
    email: string;
    embedly_wallet_id: string;
    wallet_balance: number;
  };
}

interface UserGroup {
  user_id: string;
  full_name: string;
  email: string;
  embedly_wallet_id: string;
  wallet_balance: number;
  is_guest?: boolean;
  transactions: Transaction[];
}

export default function WalletCleanupPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchCleanupCandidates();
  }, []);

  const fetchCleanupCandidates = async (userId?: string) => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/admin/wallet-transactions/cleanup?user_id=${userId}`
        : '/api/admin/wallet-transactions/cleanup';
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      setTransactions(data.transactions || []);
      setUserGroups(data.analysis?.userGroups || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, data: any) => {
    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/admin/wallet-transactions/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      setActionMessage({ type: 'success', text: result.message });
      
      // Refresh data
      fetchCleanupCandidates(selectedUser || undefined);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return '₦' + Math.abs(amount).toLocaleString('en-NG');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB');
  };

  const getTotalPendingAmount = (userGroup: UserGroup) => {
    return userGroup.transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Transaction Cleanup</h1>
          <p className="text-gray-600">Manage and cleanup pending/failed wallet transactions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className={`mb-6 px-4 py-3 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Issues</div>
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {transactions.filter(t => t.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {transactions.filter(t => t.status === 'failed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Affected Users</div>
            <div className="text-2xl font-bold text-blue-600">{userGroups.length}</div>
          </div>
        </div>

        {/* User Groups */}
        <div className="space-y-6">
          {userGroups.map((userGroup) => (
            <div key={userGroup.user_id} className="bg-white rounded-lg shadow">
              {/* User Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {userGroup.full_name}
                      </h3>
                      {userGroup.is_guest && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Guest
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{userGroup.email}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Wallet Balance: </span>
                        <span className="font-semibold text-gray-900">
                          {formatAmount(userGroup.wallet_balance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pending Amount: </span>
                        <span className="font-semibold text-yellow-600">
                          {formatAmount(getTotalPendingAmount(userGroup))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Issues: </span>
                        <span className="font-semibold text-red-600">
                          {userGroup.transactions.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('delete_user_pending_transactions', { user_id: userGroup.user_id })}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Delete All Pending
                    </button>
                    {!userGroup.is_guest && (
                      <button
                        onClick={() => {
                          const amount = getTotalPendingAmount(userGroup);
                          if (confirm(`Refund ${formatAmount(amount)} to ${userGroup.full_name} (${userGroup.email})?`)) {
                            handleAction('refund_to_wallet', { 
                              user_id: userGroup.user_id, 
                              amount 
                            });
                          }
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Refund Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-gray-100">
                {userGroup.transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {transaction.type === 'debit' ? 'Debit' : 'Credit'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatAmount(transaction.amount)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Description:</span> {transaction.description || 'N/A'}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Reference: {transaction.reference}</div>
                          <div>Created: {formatDate(transaction.created_at)}</div>
                          {transaction.balance_before !== undefined && (
                            <div>
                              Balance: {formatAmount(transaction.balance_before)} → {formatAmount(transaction.balance_after || 0)}
                            </div>
                          )}
                          {transaction.metadata?.order_id && (
                            <div>Order ID: {transaction.metadata.order_id}</div>
                          )}
                        </div>
                      </div>

                      {/* Transaction Actions */}
                      <div className="flex gap-2 ml-4">
                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(`Refund ₦${transaction.amount} and delete this pending transaction?`)) {
                                  handleAction('refund_and_delete_pending', { transaction_id: transaction.id });
                                }
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                              title="Refund amount and delete this pending transaction"
                            >
                              Refund & Delete
                            </button>
                            <button
                              onClick={() => handleAction('mark_completed', { transaction_id: transaction.id })}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this transaction?')) {
                                  handleAction('delete_transaction', { transaction_id: transaction.id });
                                }
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {transaction.status === 'failed' && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this failed transaction?')) {
                                handleAction('delete_transaction', { transaction_id: transaction.id });
                              }
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">All Clean!</h3>
            <p className="text-gray-600">No pending or failed wallet transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
