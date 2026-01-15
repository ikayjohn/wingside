"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { HoneypotField } from '@/components/HoneypotField';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName: string, lastName: string): string {
  // Clean and format names
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();

  // Take first 4 chars of first name and first 4 chars of last name
  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  // Generate 3 random digits
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  // Combine: FIRST4 + LAST4 + 3DIGITS
  // Example: johndoe123
  let code = `${firstPart}${lastPart}${randomDigits}`;

  // Ensure code is at least 5 characters
  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 4).toUpperCase();
    code = `${code}${extraRandom}`;
  }

  // Max length 15 characters
  return code.slice(0, 15);
}

export default function MyAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Redirect based on role
        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/my-account/dashboard');
        }
      } else {
        // User is not logged in, show login/signup forms
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }>({});

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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

  // Validation functions
  const validateName = (name: string, fieldName: string): { valid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: `${fieldName} is required` };
    }

    // Check for numbers in name
    if (/\d/.test(name)) {
      return { valid: false, error: `${fieldName} cannot contain numbers` };
    }

    // Check for special characters (allow hyphens, apostrophes, spaces)
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      return { valid: false, error: `${fieldName} can only contain letters` };
    }

    if (name.trim().length < 2) {
      return { valid: false, error: `${fieldName} must be at least 2 characters` };
    }

    return { valid: true };
  };

  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    if (!phone || phone.trim().length === 0) {
      return { valid: false, error: 'Phone number is required' };
    }

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Nigerian phone numbers must be 10 digits (after removing country code)
    if (cleaned.length !== 10) {
      return { valid: false, error: 'Please enter a valid 10-digit Nigerian phone number' };
    }

    // Must start with valid Nigerian mobile prefix (7, 8, or 9)
    if (!/^[789]\d{9}$/.test(cleaned)) {
      return { valid: false, error: 'Phone number must start with 7, 8, or 9' };
    }

    return { valid: true };
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Clear field error when user starts typing
    if (name in fieldErrors) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === 'phone') {
      // Handle phone number formatting for Nigerian numbers
      let phoneValue = value.replace(/\D/g, '');
      // Remove leading 0 if present (common mistake: 0801 -> 801)
      if (phoneValue.startsWith('0')) {
        phoneValue = phoneValue.slice(1);
      }
      // Limit to 10 digits
      phoneValue = phoneValue.slice(0, 10);

      setSignupData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else if (name === 'firstName' || name === 'lastName') {
      // Only allow letters, spaces, hyphens, and apostrophes in names
      const nameValue = value.replace(/[^a-zA-Z\s\-']/g, '');
      setSignupData(prev => ({
        ...prev,
        [name]: nameValue
      }));
    } else {
      setSignupData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format phone number to ensure it's always in correct Nigerian format
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Remove leading 0 if present (common mistake: 0801 -> 801)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }

    // Limit to 10 digits (Nigerian mobile numbers without country code)
    cleaned = cleaned.slice(0, 10);

    return cleaned;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setSubmitError(null);
    setFieldErrors({});

    // Validate honeypot (client-side check)
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const honeypotValue = formData.get('website_url') as string;
    if (honeypotValue && honeypotValue.trim() !== '') {
      console.warn('Honeypot field filled - likely bot');
      return; // Silently fail for bots
    }

    // Validate first name
    const firstNameValidation = validateName(signupData.firstName, 'First name');
    if (!firstNameValidation.valid) {
      setFieldErrors({ firstName: firstNameValidation.error! });
      return;
    }

    // Validate last name
    const lastNameValidation = validateName(signupData.lastName, 'Last name');
    if (!lastNameValidation.valid) {
      setFieldErrors({ lastName: lastNameValidation.error! });
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhone(signupData.phone);
    if (!phoneValidation.valid) {
      setFieldErrors({ phone: phoneValidation.error! });
      return;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(signupData.phone);

    setIsSubmitting(true);

    try {
      // Process referral ID if provided
      let referredByUserId = null;
      if (signupData.referralId.trim()) {
        const { data: referrerData, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', signupData.referralId.trim().toLowerCase())
          .single();

        if (!referrerError && referrerData) {
          referredByUserId = referrerData.id;
        } else {
          alert('Invalid referral ID. Please check and try again, or leave blank if you don\'t have one.');
          setIsSubmitting(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email.toLowerCase().trim(),
        password: signupData.password,
        options: {
          data: {
            full_name: `${signupData.firstName.trim()} ${signupData.lastName.trim()}`,
            phone: `+234${formattedPhone}`,
          },
        },
      });

      if (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        // Generate unique referral code for new user
        const referralCode = generateReferralCode(signupData.firstName, signupData.lastName);

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || signupData.email.toLowerCase().trim(),
          full_name: `${signupData.firstName.trim()} ${signupData.lastName.trim()}`,
          phone: `+234${formattedPhone}`,
          role: 'customer',
          referral_code: referralCode,
          referred_by: referredByUserId,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // If user was referred, create referral record
        if (referredByUserId) {
          const { error: referralError } = await supabase.from('referrals').insert({
            referrer_id: referredByUserId,
            referred_user_id: data.user.id,
            referral_code_used: signupData.referralId.trim().toUpperCase(),
            status: 'pending_signup',
            reward_amount: 200, // 200 points reward for both referrer and referred
            referred_email: signupData.email,
          });

          if (referralError) {
            console.error('Referral creation error:', referralError);
          }
        }

        // Auto-create Embedly customer and wallet
        try {
          console.log('🔄 Attempting to create Embedly wallet...');
          const embedlyResponse = await fetch('/api/embedly/auto-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!embedlyResponse.ok) {
            const errorText = await embedlyResponse.text();
            console.error('❌ Embedly API error:', embedlyResponse.status, errorText);
            return;
          }

          const embedlyResult = await embedlyResponse.json();

          if (embedlyResult.success && embedlyResult.wallet) {
            console.log('✅ Embedly wallet created:', embedlyResult.wallet.virtualAccount?.accountNumber || 'No account number');
          } else if (embedlyResult.needsManualWalletCreation) {
            console.log('⚠️ Embedly customer created, wallet needs manual creation');
          } else if (embedlyResult.error) {
            console.error('❌ Embedly error:', embedlyResult.error);
          } else {
            console.log('ℹ️ Embedly response:', embedlyResult.message || 'No details');
          }
        } catch (embedlyError) {
          console.error('❌ Embedly auto-wallet creation failed:', embedlyError);
          console.error('Error details:', embedlyError instanceof Error ? embedlyError.message : embedlyError);
          // Don't fail signup if Embedly wallet creation fails
        }

        alert('Account created successfully! Please check your email to verify your account.');
        router.push('/my-account/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      // Check for rate limit errors
      if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
        setSubmitError('Too many signup attempts. Please wait a few minutes before trying again.');
      } else {
        setSubmitError('An error occurred during signup. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);

    // Validate honeypot (client-side check)
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const honeypotValue = formData.get('website_url') as string;
    if (honeypotValue && honeypotValue.trim() !== '') {
      console.warn('Honeypot field filled - likely bot');
      setIsSubmitting(false);
      return; // Silently fail for bots
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email.toLowerCase().trim(),
        password: loginData.password,
      });

      if (error) {
        // Check for rate limit errors
        if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
          setSubmitError('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          setSubmitError(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        router.push('/my-account/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Check for rate limit errors
      if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
        setSubmitError('Too many login attempts. Please wait a few minutes before trying again.');
      } else {
        setSubmitError('An error occurred during login. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

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

          {/* Error Message */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {submitError}
            </div>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <>
              <h2 className="wingclub-title">Join the Wingclub</h2>
              <p className="wingclub-subtitle">Enter your information and claim your spot at the Wing table.</p>

              <form onSubmit={handleSignupSubmit}>
                {/* Honeypot Field */}
                <HoneypotField />
                {/* Name Row */}
                <div className="wingclub-row">
                  <div className="wingclub-field">
                    <label className="wingclub-label">First name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={signupData.firstName}
                      onChange={handleSignupChange}
                      placeholder="e.g., John"
                      className={`wingclub-input ${fieldErrors.firstName ? 'error' : ''}`}
                    />
                    {fieldErrors.firstName && (
                      <span className="wingclub-error">{fieldErrors.firstName}</span>
                    )}
                  </div>
                  <div className="wingclub-field">
                    <label className="wingclub-label">Last name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={signupData.lastName}
                      onChange={handleSignupChange}
                      placeholder="e.g., Doe"
                      className={`wingclub-input ${fieldErrors.lastName ? 'error' : ''}`}
                    />
                    {fieldErrors.lastName && (
                      <span className="wingclub-error">{fieldErrors.lastName}</span>
                    )}
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
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                      +234
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      placeholder="801 234 5678"
                      className={`wingclub-phone-input rounded-l-none flex-1 ${fieldErrors.phone ? 'error' : ''}`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter Nigerian number without the leading 0</p>
                  {fieldErrors.phone && (
                    <span className="wingclub-error">{fieldErrors.phone}</span>
                  )}
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
                  <label className="wingclub-label">Referral ID (Optional)</label>
                  <input
                    type="text"
                    name="referralId"
                    value={signupData.referralId}
                    onChange={handleSignupChange}
                    placeholder="e.g. johndoe123 (all lowercase)"
                    className="wingclub-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter a friend's referral code to earn rewards (case-insensitive)</p>
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
                <button
                  type="submit"
                  className="wingclub-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Join the Wingclub'}
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
                {/* Honeypot Field */}
                <HoneypotField />
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
                <button
                  type="submit"
                  className="wingclub-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
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