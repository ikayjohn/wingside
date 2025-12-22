"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  reference: string;
  balance?: number;
}

interface Bank {
  bankname: string;
  bankcode: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmbedlyWalletSection() {
  const [wallet, setWallet] = useState<EmbedlyWallet | null>(null);
  const [transactions, setTransactions] = useState<Record<string, WalletTransaction[]>>({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [transferForm, setTransferForm] = useState({
    type: 'wallet',
    amount: '',
    toAccount: '',
    bankCode: '',
    accountName: '',
    remarks: ''
  });

  useEffect(() => {
    fetchWalletData();
    fetchBanks();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/embedly/wallets');
      const data = await response.json();

      if (data.success) {
        if (data.hasWallet && data.wallet) {
          setWallet(data.wallet);
          await fetchTransactionHistory(data.wallet.id);
        } else if (data.customerId) {
          // User has customer account but no wallet yet
          console.log('User has customer account but no wallet');
          // Try to auto-create wallet
          try {
            const createResponse = await fetch('/api/embedly/auto-wallet', {
              method: 'POST',
            });
            const createData = await createResponse.json();

            if (createData.success && createData.wallet) {
              setWallet(createData.wallet);
              await fetchTransactionHistory(createData.wallet.id);
            }
          } catch (createError) {
            console.log('Auto wallet creation failed:', createError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async (walletId: string) => {
    try {
      const response = await fetch('/api/embedly/wallets/history');
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/embedly/utilities?type=banks');
      const data = await response.json();

      if (data.success) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const createWallet = async () => {
    try {
      setCreatingWallet(true);
      setError('');

      const response = await fetch('/api/embedly/wallets', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet);
        await fetchTransactionHistory(data.wallet.id);
      } else {
        setError(data.error || 'Failed to create wallet');
      }
    } catch (error) {
      setError('Failed to create wallet');
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.amount || (!transferForm.toAccount && transferForm.type !== 'wallet')) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/embedly/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowTransferModal(false);
        setTransferForm({
          type: 'wallet',
          amount: '',
          toAccount: '',
          bankCode: '',
          accountName: '',
          remarks: ''
        });
        // Refresh data
        await fetchWalletData();
      } else {
        setError(data.error || 'Transfer failed');
      }
    } catch (error) {
      setError('Transfer failed');
    }
  };

  const verifyAccount = async (bankCode: string, accountNumber: string) => {
    if (!bankCode || !accountNumber) return;

    try {
      const response = await fetch('/api/embedly/utilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankCode,
          accountNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransferForm(prev => ({
          ...prev,
          accountName: data.data.accountName
        }));
      }
    } catch (error) {
      console.error('Account verification failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Digital Wallet</h3>
          <p className="text-gray-600 mb-6">Get your own virtual account and start managing your money digitally.</p>
          <button
            onClick={createWallet}
            disabled={creatingWallet}
            className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors disabled:opacity-50"
          >
            {creatingWallet ? 'Creating Wallet...' : 'Create Wallet'}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Digital Wallet</h2>
            <p className="text-gray-600">Manage your digital funds and transfers</p>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full ${
            wallet.availableBalance > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(wallet.availableBalance)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{wallet.virtualAccount.accountNumber}</p>
              <button
                onClick={() => copyToClipboard(wallet.virtualAccount.accountNumber)}
                className="text-gray-400 hover:text-gray-600"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Bank</p>
            <p className="text-lg font-semibold text-gray-900">{wallet.virtualAccount.bankName}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowFundModal(true)}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors"
          >
            Fund Wallet
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
          >
            Transfer Funds
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>

        {Object.keys(transactions).length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(transactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <p className="text-sm font-medium text-gray-600 mb-2">{date}</p>
                <div className="space-y-2">
                  {dateTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d={transaction.type === 'credit'
                                ? "M12 6v6m0 0v6m0-6h6m-6 0H6"
                                : "M20 12H4"
                              }
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.balance && (
                          <p className="text-sm text-gray-600">Balance: {formatCurrency(transaction.balance)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Funds</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Type
                </label>
                <select
                  value={transferForm.type}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="wallet">To Wallet</option>
                  <option value="interbank">To Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="0.00"
                />
              </div>

              {transferForm.type === 'interbank' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bank
                    </label>
                    <select
                      value={transferForm.bankCode}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, bankCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Select a bank</option>
                      {banks.map((bank) => (
                        <option key={bank.bankcode} value={bank.bankcode}>
                          {bank.bankname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={transferForm.toAccount}
                      onChange={(e) => {
                        setTransferForm(prev => ({ ...prev, toAccount: e.target.value }));
                        if (e.target.value.length === 10 && transferForm.bankCode) {
                          verifyAccount(transferForm.bankCode, e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Account number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={transferForm.accountName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Account name will appear here"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Account Number
                  </label>
                  <input
                    type="text"
                    value={transferForm.toAccount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toAccount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Enter virtual account number"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (optional)
                </label>
                <input
                  type="text"
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Payment description"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}