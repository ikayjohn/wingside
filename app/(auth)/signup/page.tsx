"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next';
import { HoneypotField } from '@/components/HoneypotField';
import Turnstile from '@/components/Turnstile';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate CAPTCHA
    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Verify CAPTCHA server-side
      const verifyResponse = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        setError('CAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Check for rate limiting or spam-related errors
        if (signUpError.message.includes('rate limit') ||
            signUpError.message.includes('too many requests')) {
          setError('Too many signup attempts. Please try again later.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'customer',
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway as auth user was created
        } else {
          // Auto-sync new customer to integrations (background, don't await)
          fetch('/api/integrations/sync-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email: email.toLowerCase().trim(),
              full_name: fullName.trim(),
              phone: phone.trim(),
            }),
          }).catch(err => console.error('Integration sync failed:', err));
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#552627] mb-2">
            Join Wingside
          </h1>
          <p className="text-gray-600">Create your account to start ordering</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Hidden honeypot field to catch bots */}
            <HoneypotField />

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                Account created successfully! Redirecting to login...
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F7C400] focus:outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F7C400] focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F7C400] focus:outline-none transition-colors"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F7C400] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#F7C400] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={setCaptchaToken}
                onError={() => {
                  setError('CAPTCHA verification failed. Please try again.');
                  setCaptchaToken(null);
                }}
                onExpire={() => {
                  setCaptchaToken(null);
                }}
                theme="auto"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-[#F7C400] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#e5b800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#552627] font-semibold hover:text-[#F7C400] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
