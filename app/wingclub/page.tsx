"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WingclubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: 'NG',
    phone: '',
    password: '',
    referralId: '',
    agreePrivacy: false,
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup submitted:', signupData);
    // Redirect to dashboard (authentication will be added later)
    router.push('/wingclub/dashboard');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', loginData);
    // Redirect to dashboard (authentication will be added later)
    router.push('/wingclub/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="wingclub-container">
        
        {/* Left Side - Image */}
        <div className="wingclub-image-section">
          <img src="/signup.jpg" alt="Join Wingclub" />
        </div>

        {/* Right Side - Form */}
        <div className="wingclub-form-section">
          {/* Close Button */}
          <Link href="/" className="wingclub-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </Link>

          {/* Tabs */}
          <div className="wingclub-tabs">
            <button
              className={`wingclub-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
            <button
              className={`wingclub-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
          </div>

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <>
              <h2 className="wingclub-title">Join the Wingclub</h2>
              <p className="wingclub-subtitle">Enter your information and claim your spot at the Wing table.</p>

              <form onSubmit={handleSignupSubmit}>
                {/* Name Row */}
                <div className="wingclub-row">
                  <div className="wingclub-field">
                    <label className="wingclub-label">First name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={signupData.firstName}
                      onChange={handleSignupChange}
                      placeholder="First name"
                      className="wingclub-input"
                    />
                  </div>
                  <div className="wingclub-field">
                    <label className="wingclub-label">Last name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={signupData.lastName}
                      onChange={handleSignupChange}
                      placeholder="Last name"
                      className="wingclub-input"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    placeholder="you@company.com"
                    className="wingclub-input"
                  />
                </div>

                {/* Phone */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Phone number</label>
                  <div className="wingclub-phone-wrapper">
                    <select
                      name="countryCode"
                      value={signupData.countryCode}
                      onChange={handleSignupChange}
                      className="wingclub-country-select"
                    >
                      <option value="NG">NG</option>
                      <option value="US">US</option>
                      <option value="UK">UK</option>
                      <option value="GH">GH</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      placeholder="+1 (555) 000-0000"
                      className="wingclub-phone-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Set a password</label>
                  <div className="wingclub-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      placeholder="Enter a password"
                      className="wingclub-input"
                    />
                    <button
                      type="button"
                      className="wingclub-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Referral ID */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Referral ID</label>
                  <input
                    type="text"
                    name="referralId"
                    value={signupData.referralId}
                    onChange={handleSignupChange}
                    placeholder="e.g. Wingmanwings"
                    className="wingclub-input wingclub-input-highlight"
                  />
                </div>

                {/* Privacy Checkbox */}
                <div className="wingclub-checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    id="agreePrivacy"
                    checked={signupData.agreePrivacy}
                    onChange={handleSignupChange}
                    className="wingclub-checkbox"
                  />
                  <label htmlFor="agreePrivacy" className="wingclub-checkbox-label">
                    I agree to the <Link href="/privacy" className="wingclub-link">privacy policy.</Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="wingclub-submit-btn">
                  Join the Wingclub
                </button>
              </form>

              {/* Login Link */}
              <p className="wingclub-switch-text">
                Already have an account?{' '}
                <button onClick={() => setActiveTab('login')} className="wingclub-switch-link">
                  Login
                </button>
              </p>
            </>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <>
              <h2 className="wingclub-title">Welcome Back</h2>
              <p className="wingclub-subtitle">Enter your credentials to access your account.</p>

              <form onSubmit={handleLoginSubmit}>
                {/* Email */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@company.com"
                    className="wingclub-input"
                  />
                </div>

                {/* Password */}
                <div className="wingclub-field">
                  <label className="wingclub-label">Password</label>
                  <div className="wingclub-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password"
                      className="wingclub-input"
                    />
                    <button
                      type="button"
                      className="wingclub-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="wingclub-login-options">
                  <div className="wingclub-checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      id="rememberMe"
                      checked={loginData.rememberMe}
                      onChange={handleLoginChange}
                      className="wingclub-checkbox"
                    />
                    <label htmlFor="rememberMe" className="wingclub-checkbox-label">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="wingclub-forgot-link">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button type="submit" className="wingclub-submit-btn">
                  Login
                </button>
              </form>

              {/* Signup Link */}
              <p className="wingclub-switch-text">
                Don't have an account?{' '}
                <button onClick={() => setActiveTab('signup')} className="wingclub-switch-link">
                  Sign Up
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}