'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteSettings, fetchSettings } from '@/lib/settings';
import { getVisibleLinks } from '@/lib/page-visibility';
import type { NavigationLink } from '@/lib/navigation-links';

export default function Footer() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [companyLinks, setCompanyLinks] = useState<NavigationLink[]>([]);
  const [involvedLinks, setInvolvedLinks] = useState<NavigationLink[]>([]);
  const [legalLinks, setLegalLinks] = useState<NavigationLink[]>([]);

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        setSettings(settings);
        // Filter visible navigation links for each section
        setCompanyLinks(getVisibleLinks(settings, 'footer-company'));
        setInvolvedLinks(getVisibleLinks(settings, 'footer-involved'));
        setLegalLinks(getVisibleLinks(settings, 'footer-legal'));
      })
      .catch((error) => {
        console.error('Failed to fetch settings in Footer:', error);
        // Keep default empty settings on error
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // 1. Get CSRF Token
      const csrfResponse = await fetch('/api/csrf/token');
      const csrfData = await csrfResponse.json();

      if (!csrfResponse.ok) throw new Error('Failed to get security token');

      // 2. Submit Newsletter Signup
      const response = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [csrfData.headerName]: csrfData.token,
        },
        body: JSON.stringify({
          email,
          type: 'footer_subscription',
          source: 'footer'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Thank you for subscribing!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setMessage('Failed to connect to the server. Please check your connection.');
    }
  };

  return (
    <>
      {/* Newsletter Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-white border-b border-gray-200 footer-container">
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Logo */}
            <div className="flex justify-center md:justify-start">
              <div className="text-center md:text-left">
                <img
                  src="/logo.png"
                  alt="Wingside Logo"
                  className="h-40 md:h-60 w-auto mb-3 md:mb-4 mx-auto md:mx-0"
                />
              </div>
            </div>

            {/* Right: Subscribe Form */}
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-0 md:mb-1 leading-none" style={{ color: '#552627' }}>
                Subscribe for more
              </h2>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 leading-none" style={{ color: '#F7C400' }}>
                DELICIOUSNESS
              </p>
              <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">
                Be the first to know about exclusive offers, benefits, events<br className="hidden lg:block" />
                and more sent via emails. We promise not to spam you.
              </p>

              {/* Email Input */}
              <div className="flex flex-col mb-6 md:mb-8 w-full max-w-[670px]">
                <form onSubmit={handleSubmit} className="relative w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`newsletter-input ${status === 'error' ? 'border-red-500 pr-12' : ''}`}
                    disabled={status === 'loading' || status === 'success'}
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    )}
                  </button>
                </form>
                {message && (
                  <p className={`text-xs mt-2 font-medium ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}
              </div>

              {/* Social Icons */}
              <div className="flex gap-8">
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                )}
                {settings.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                )}
                {settings.social_linkedin && (
                  <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
                {settings.social_youtube && (
                  <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {settings.social_tiktok && (
                  <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                )}
                {settings.social_spotify && (
                  <a href={settings.social_spotify} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="bg-white py-6 md:py-8 footer-container">
        <div className="w-full">
          {/* Footer Navigation */}
          <div className="flex flex-col gap-y-3 md:gap-y-4 mb-6 md:mb-8">
            {/* Company Section - Dynamic based on visibility settings */}
            {companyLinks.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-x-4 md:gap-x-6 gap-y-2">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900">COMPANY</span>
                {companyLinks.map((link) => (
                  <Link key={link.id} href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Get Involved Section - Dynamic based on visibility settings */}
            {involvedLinks.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-x-4 md:gap-x-8 gap-y-2">
                <span className="font-bold text-xs uppercase tracking-wide text-gray-900">GET INVOLVED</span>
                {involvedLinks.map((link) => (
                  <Link key={link.id} href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-gray-500 pt-4 md:pt-6">
            © 2026 All rights reserved. Wingside Foods Limited.
          </div>

          {/* Legal Links - Dynamic based on visibility settings */}
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-2 mt-4 text-xs">
              {legalLinks.map((link) => (
                <Link key={link.id} href={link.href} className="text-gray-500 hover:text-gray-700 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </footer>
    </>
  );
}