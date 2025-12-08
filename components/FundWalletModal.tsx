"use client";

import React, { useState } from 'react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export default function FundWalletModal({
  isOpen,
  onClose,
  accountNumber,
  accountName,
  bankName,
}: FundWalletModalProps) {
  const [copied, setCopied] = useState(false);

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
              Transfer to your wingside bank account from any of your bank.
            </p>
          </div>
          <button onClick={onClose} className="fund-wallet-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

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
