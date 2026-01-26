"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountNumber: string;
  accountName: string;
  bankName: string;
  currentBalance?: number;
  onRefreshBalance?: () => Promise<void>;
}

export default function FundWalletModal({
  isOpen,
  onClose,
  accountNumber,
  accountName,
  bankName,
  currentBalance,
  onRefreshBalance,
}: FundWalletModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | undefined>(currentBalance);
  const [balanceUpdated, setBalanceUpdated] = useState(false);

  // Auto-refresh balance every 30 seconds when modal is open
  useEffect(() => {
    if (!isOpen || !onRefreshBalance) return;

    const intervalId = setInterval(async () => {
      try {
        await onRefreshBalance();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isOpen, onRefreshBalance]);

  // Detect balance changes
  useEffect(() => {
    if (currentBalance !== undefined && lastBalance !== undefined && currentBalance > lastBalance) {
      setBalanceUpdated(true);
      setTimeout(() => setBalanceUpdated(false), 3000);
    }
    setLastBalance(currentBalance);
  }, [currentBalance, lastBalance]);

  const handleRefresh = useCallback(async () => {
    if (!onRefreshBalance || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefreshBalance();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshBalance, isRefreshing]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fund-wallet-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fund-wallet-header">
          <div>
            <h2 className="fund-wallet-title">Fund Wallet</h2>
            <p className="fund-wallet-subtitle">
              Transfer to your Wingside® Bank Account from any of your bank.
            </p>
          </div>
          <button onClick={onClose} className="fund-wallet-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Current Balance Display */}
        {currentBalance !== undefined && (
          <div className={`mx-6 mb-4 p-4 rounded-lg transition-all duration-300 ${balanceUpdated
              ? 'bg-green-100 border-2 border-green-500'
              : 'bg-gray-100'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className={`text-2xl font-bold ${balanceUpdated ? 'text-green-600' : 'text-gray-900'}`}>
                  ₦{currentBalance.toLocaleString()}
                </p>
                {balanceUpdated && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Balance updated!
                  </p>
                )}
              </div>
              {onRefreshBalance && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-3 rounded-full transition-all ${isRefreshing
                      ? 'bg-gray-200 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 border border-gray-300'
                    }`}
                  title="Refresh balance"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isRefreshing ? 'animate-spin' : ''}
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Balance updates automatically every 30 seconds
            </p>
          </div>
        )}

        {/* Account Details */}
        <div className="fund-wallet-content">
          <div className="fund-wallet-field">
            <label className="fund-wallet-label">Account Number</label>
            <div className="fund-wallet-value-row">
              <span className="fund-wallet-value">{accountNumber}</span>
              <button
                onClick={() => copyToClipboard(accountNumber)}
                className="fund-wallet-copy-btn"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="fund-wallet-field">
            <label className="fund-wallet-label">Account Name</label>
            <span className="fund-wallet-value">{accountName}</span>
          </div>

          <div className="fund-wallet-field">
            <label className="fund-wallet-label">Bank or Institution</label>
            <span className="fund-wallet-value">{bankName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
