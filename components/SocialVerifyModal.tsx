"use client";

import React, { useState } from "react";

interface SocialVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'youtube';
  platformName: string;
  platformUrl: string;
  points: number;
  onSuccess: () => void;
}

export default function SocialVerifyModal({
  isOpen,
  onClose,
  platform,
  platformName,
  platformUrl,
  points,
  onSuccess
}: SocialVerifyModalProps) {
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/rewards/social-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          username: username.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadySubmitted) {
          setError(`You already submitted this verification on ${new Date(data.submittedAt).toLocaleDateString()}`);
        } else if (data.alreadyVerified) {
          setError('You have already verified this platform!');
        } else {
          throw new Error(data.error || 'Failed to submit verification');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowClick = () => {
    window.open(platformUrl, '_blank');
  };

  // Platform-specific button styles
  const getPlatformButtonClass = () => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600';
      case 'twitter':
        return 'bg-black hover:bg-gray-900';
      case 'tiktok':
        return 'bg-black hover:bg-gray-900';
      case 'facebook':
        return 'bg-[#1877F2] hover:bg-[#0d65d9]';
      case 'youtube':
        return 'bg-[#FF0000] hover:bg-[#cc0000]';
      default:
        return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={submitting || success}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Submitted!</h3>
            <p className="text-gray-600">
              We'll verify your {platformName} follow and award your {points} points shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verify {platformName} Follow
              </h3>
              <p className="text-gray-600 text-sm">
                Follow us and submit your username to earn <span className="font-bold text-yellow-600">{points} points</span>!
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Follow */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full">Step 1</span>
                  <span className="font-medium text-gray-900">Follow Us</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Click the button below to follow our {platformName} account
                </p>
                <button
                  type="button"
                  onClick={handleFollowClick}
                  className={`w-full text-white py-2.5 px-4 rounded-lg font-medium transition-all ${getPlatformButtonClass()}`}
                >
                  Follow @{platformUrl.split('/').pop()}
                </button>
              </div>

              {/* Step 2: Submit Username */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full">Step 2</span>
                  <span className="font-medium text-gray-900">Submit Your Username</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Enter your {platformName} username so we can verify your follow
                </p>
                <div className="flex gap-2">
                  <span className="bg-gray-200 px-3 py-2.5 rounded-lg text-gray-600">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourusername"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !username.trim()}
                className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : `Submit for Verification (+${points} pts)`}
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll verify your follow within 24-48 hours. You'll receive points once verified.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
