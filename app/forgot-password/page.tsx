"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Sending password reset email to:', email);
      console.log('📍 Redirect URL:', `${window.location.origin}/reset-password`);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        setError(error.message || 'Error sending recovery email');
      } else {
        console.log('✅ Password reset email sent successfully');
        setSubmitted(true);
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="wingclub-container">

        {/* Left Side - Image */}
        <div className="wingclub-image-section">
          <img src="/signup.jpg" alt="Reset Password" />
        </div>

        {/* Right Side - Form */}
        <div className="wingclub-form-section">
          {/* Close Button */}
          <Link href="/my-account" className="wingclub-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </Link>

          {!submitted ? (
            <>
              <h2 className="wingclub-title">Reset Your Password</h2>
              <p className="wingclub-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  <strong>Error:</strong> {error}
                  <br />
                  <span className="text-xs mt-1 block">
                    If the problem persists, please contact support or try again later.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="wingclub-input"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button type="submit" className="wingclub-submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {/* Back to Login */}
              <p className="wingclub-switch-text">
                Remember your password?{' '}
                <Link href="/my-account" className="wingclub-switch-link">
                  Back to Login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="wingclub-success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className="wingclub-title">Check Your Email</h2>
              <p className="wingclub-subtitle">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>

              {/* Back to Login */}
              <Link href="/my-account" className="wingclub-submit-btn" style={{ textAlign: 'center', display: 'block' }}>
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
