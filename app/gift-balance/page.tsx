"use client";

import { useState } from "react";
import QRScannerModal from "@/components/QRScannerModal";

export default function GiftBalancePage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [balanceResult, setBalanceResult] = useState<{
    success: boolean;
    balance?: number;
    currency?: string;
    code?: string;
    expiresAt?: string;
    recipientName?: string;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setBalanceResult(null);

    const cleanCode = code.replace(/[\s-]/g, '').toUpperCase();

    // Determine which API to call based on format
    const isLegacyFormat = /^\d{16}$/.test(cleanCode);

    try {
      let response;

      if (isLegacyFormat) {
        // Legacy 16-digit card number format — requires PIN
        // For backward compat, check with default PIN '0000' since new cards use that
        response = await fetch('/api/gift-cards/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardNumber: cleanCode,
            pin: '0000',
          }),
        });
      } else {
        // New 12-digit alphanumeric code format
        response = await fetch('/api/gift-cards/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setBalanceResult({
          success: false,
          error: data.error || 'Failed to check balance',
        });
      } else {
        setBalanceResult({
          success: true,
          balance: data.balance,
          currency: data.currency || 'NGN',
          code: data.code || data.cardNumber,
          expiresAt: data.expiresAt,
          recipientName: data.recipientName,
        });
      }
    } catch (error) {
      console.error('Error checking gift card balance:', error);
      setBalanceResult({
        success: false,
        error: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    let scannedCode = "";

    try {
      // Try to parse as JSON first
      const data = JSON.parse(decodedText);
      scannedCode = data.code || data.cardNumber || "";
    } catch {
      // If not JSON, try to parse key-value format
      const parts = decodedText.split(",");
      for (const part of parts) {
        const [key, value] = part.split(":");
        if (key?.trim() === "code" || key?.trim() === "cardNumber") {
          scannedCode = value?.trim() || "";
          break;
        }
      }

      // If still no code, treat entire text as the code
      if (!scannedCode) {
        scannedCode = decodedText.trim();
      }
    }

    setCode(scannedCode);

    // Auto-submit after QR scan
    if (scannedCode) {
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 300);
    }
  };

  // Format the code input with spaces for readability
  const formatCodeDisplay = (input: string) => {
    const clean = input.replace(/[\s-]/g, '').toUpperCase();
    // Group into chunks of 4 for readability
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <main className="w-full max-w-4xl mx-auto -mt-20 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-black text-black mb-8">
            Gift Balance
          </h1>

          {/* Subheading */}
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Check your gift card balance by scanning the QR code or entering the code on the back of the card. Enter the code exactly as shown, without spaces or dashes.
          </p>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Code Input - 70% width */}
              <div className="w-full md:w-[70%]">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9\s-]/g, ''))}
                  placeholder="Enter gift card code"
                  maxLength={20}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-[#F7C400] focus:outline-none transition-colors text-lg uppercase tracking-wider font-mono"
                  required
                />
                <p className="text-gray-500 text-xs mt-2 ml-1">
                  *Enter the 12-character code from your gift card
                </p>
              </div>

              {/* Check Balance Button - 30% width */}
              <div className="w-full md:w-[30%]">
                <button
                  type="submit"
                  disabled={isLoading || code.replace(/[\s-]/g, '').length < 6}
                  className="w-full bg-[#5c3a3a] hover:bg-[#4a2e2e] text-white font-bold py-4 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[60px] flex items-center justify-center text-sm md:text-base whitespace-nowrap cursor-pointer"
                >
                  {isLoading ? "Checking..." : "Check Balance"}
                </button>
              </div>
            </div>
          </form>

          {/* Balance Result */}
          {balanceResult && (
            <div className="mt-8 max-w-2xl mx-auto">
              {balanceResult.success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 text-center">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 text-green-500 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Gift Card Balance
                  </h3>
                  <div className="text-5xl font-black text-[#F7C400] mb-4">
                    {balanceResult.currency === 'NGN' ? '₦' : balanceResult.currency}
                    {balanceResult.balance?.toLocaleString()}
                  </div>
                  {balanceResult.recipientName && (
                    <p className="text-gray-700 mb-2 font-medium">
                      {balanceResult.recipientName}
                    </p>
                  )}
                  {balanceResult.code && (
                    <p className="text-gray-600 mb-2">
                      Code: <span className="font-mono font-semibold">{formatCodeDisplay(balanceResult.code)}</span>
                    </p>
                  )}
                  {balanceResult.expiresAt && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(balanceResult.expiresAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setBalanceResult(null);
                      setCode('');
                    }}
                    className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                  >
                    Check Another Card
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-8 text-center">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 text-red-500 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Error
                  </h3>
                  <p className="text-red-600 mb-4">{balanceResult.error}</p>
                  <button
                    onClick={() => {
                      setBalanceResult(null);
                    }}
                    className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* QR Code Button */}
          {!balanceResult && (
            <div className="mt-12">
              <button
                type="button"
                className="px-10 py-4 border-2 border-gray-700 text-gray-800 font-semibold rounded-full hover:bg-gray-50 transition-colors bg-transparent text-center cursor-pointer"
                onClick={() => setIsQRScannerOpen(true)}
              >
                Use camera to scan QR Code behind your card
              </button>
            </div>
          )}
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}
