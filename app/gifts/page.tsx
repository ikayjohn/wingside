'use client';

import { useState } from 'react';

export default function GiftsPage() {
  const [showThankYou, setShowThankYou] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'gifts_launch' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setShowThankYou(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-[70%] max-w-4xl mx-auto text-center">
        {/* Gift Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 bg-[#F7C400] rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-[#552627]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#552627] mb-4">
          Coming Soon
        </h1>

        {/* Subheading */}
        <p className="text-2xl md:text-3xl text-[#F7C400] font-semibold mb-6">
          Wingside Gifts
        </p>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
          We're working on something exciting! Soon you'll be able to share the love of
          wings with gift cards, special packages, and more.
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-[#552627]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-[#552627] mb-2">Gift Cards</h3>
            <p className="text-sm text-gray-600">Perfect for any wing lover</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-[#552627]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <h3 className="font-bold text-[#552627] mb-2">Gift Packages</h3>
            <p className="text-sm text-gray-600">Curated wing combos</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-[#552627]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-[#552627] mb-2">Vouchers</h3>
            <p className="text-sm text-gray-600">Redeemable rewards</p>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-[#F7C400] rounded-lg p-8 w-full">
          <h3 className="text-xl font-bold text-[#552627] mb-2">
            Get Notified
          </h3>
          <p className="text-[#552627] mb-4 text-sm">
            Be the first to know when Wingside Gifts launch!
          </p>
          {showThankYou ? (
            <div className="bg-[#552627] text-[#F7C400] px-4 py-3 rounded">
              Thank you! We'll notify you when we launch.
            </div>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-2"
              onSubmit={handleSubmit}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded border border-[#552627] focus:outline-none focus:ring-2 focus:ring-[#552627]"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#552627] text-[#F7C400] font-bold rounded hover:bg-[#552627]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing up...' : 'Notify Me'}
              </button>
            </form>
          )}
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-12">
          <a
            href="/"
            className="inline-flex items-center text-[#552627] hover:text-[#F7C400] transition-colors font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
