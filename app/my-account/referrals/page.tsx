"use client";

import { useState } from 'react';
import Link from 'next/link';
import ReferralSection from '@/components/ReferralSection';

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/my-account/dashboard" className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
          <p className="text-gray-600">
            Invite your friends to Wingside and earn ₦500 for every successful referral. Your friends get ₦500 off their first order too!
          </p>
        </div>

        {/* Referral Content */}
        <ReferralSection />

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Your Code</h3>
              <p className="text-sm text-gray-600">
                Share your unique referral code with friends via social media, email, or direct message.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Friend Signs Up</h3>
              <p className="text-sm text-gray-600">
                Your friend uses your code to sign up and gets ₦500 off their first order of ₦1,000 or more.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">You Get Rewarded</h3>
              <p className="text-sm text-gray-600">
                Once your friend places their first order, you both earn ₦500 credited to your wallets.
              </p>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms & Conditions</h2>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Referral rewards are credited after your friend completes their first order of ₦1,000 or more.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Referral codes cannot be used by existing customers or combined with other promotional offers.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Each customer can use only one referral code during signup.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Referral rewards are credited to your wallet and can be used for future orders.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Wingside reserves the right to modify or terminate the referral program at any time.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 mt-1">•</span>
              <p>Fraudulent activities or abuse of the referral system will result in account suspension.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How many people can I refer?</h3>
              <p className="text-sm text-gray-600">You can refer up to 50 people. There's no limit to how much you can earn!</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">When will I receive my referral reward?</h3>
              <p className="text-sm text-gray-600">Rewards are credited to your wallet within 24 hours after your friend completes their first qualifying order.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens if my friend doesn't use my referral code?</h3>
              <p className="text-sm text-gray-600">The referral must use your unique code during signup for both of you to receive the rewards.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I track my referral status?</h3>
              <p className="text-sm text-gray-600">Yes! You can view all your referrals and their status on this page, including pending, completed, and rewarded referrals.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if my friend forgets to use my code?</h3>
              <p className="text-sm text-gray-600">Unfortunately, the referral code must be applied during signup. Make sure to remind your friends to use your code!</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}