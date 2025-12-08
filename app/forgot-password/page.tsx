"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset requested for:', email);
    setSubmitted(true);
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
          <Link href="/wingclub" className="wingclub-close-btn">
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
                <button type="submit" className="wingclub-submit-btn">
                  Send Reset Link
                </button>
              </form>

              {/* Back to Login */}
              <p className="wingclub-switch-text">
                Remember your password?{' '}
                <Link href="/wingclub" className="wingclub-switch-link">
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
              <Link href="/wingclub" className="wingclub-submit-btn" style={{ textAlign: 'center', display: 'block' }}>
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
