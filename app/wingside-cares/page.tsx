"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HoneypotField } from '@/components/HoneypotField';
import Turnstile from '@/components/Turnstile';

export default function WingsideCares() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate CAPTCHA
    if (!captchaToken) {
      setSubmitError('Please complete the CAPTCHA verification');
      setIsSubmitting(false);
      return;
    }

    try {
      // Verify CAPTCHA first
      const verifyResponse = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        setSubmitError('CAPTCHA verification failed. Please try again.');
        setIsSubmitting(false);
        setCaptchaToken(null);
        return;
      }

      // Submit the form
      const response = await fetch('/api/partnership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for rate limiting errors
        if (data.error?.includes('rate limit') || data.error?.includes('too many requests')) {
          throw new Error('Too many submission attempts. Please try again later.');
        }
        throw new Error(data.error || 'Failed to submit partnership inquiry');
      }

      setSubmitSuccess(true);
      setSubmitError('');
      setIsSubmitting(false);
      setCaptchaToken(null);

      // Reset form and close popup after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsPopupOpen(false);
        setFormData({ name: '', email: '', phone: '', organization: '', message: '' });
      }, 3000);

    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      setCaptchaToken(null);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    }
  };
  return (
    <div className="min-h-screen bg-white">

      {/* HERO SECTION */}
      <section className="relative h-[90vh] min-h-[600px]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="/cares-hero.jpg"
            alt="Community gathering"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Badge - Top */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: '40px' }}>
          <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#FEF08A', color: '#552627' }}>
            Wingside Cares
          </span>
        </div>

        {/* Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 w-full pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight whitespace-nowrap">
                <span className="text-white">Good wings, </span>
                <span style={{ color: '#f4c430' }}>Greater impact.</span>
              </h1>

              {/* Body Text */}
              <div className="space-y-4 mb-8">
                <p className="text-white text-base md:text-lg leading-relaxed">
                  At Wingside, giving back isn't a campaign — it's part of who we are.
                </p>
                <p className="text-white text-base md:text-lg leading-relaxed">
                  WINGSIDE CARES is our commitment to stand with communities, support those displaced by hardship, and invest in long-term community development. Through food relief, local partnerships, and hands-on service, we're showing up where it matters most.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#why-we-do-this"
                  className="inline-block px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: '#f4c430', color: '#552627' }}
                >
                  Learn more
                </Link>
                <Link
                  href="#join-movement"
                  className="inline-block px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 border-2 border-white text-white hover:bg-white hover:text-[#552627]"
                >
                  Join the Movement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY WE DO THIS SECTION */}
      <section id="why-we-do-this" className="py-16 md:py-24 gutter-x" style={{ backgroundColor: '#FFFDF2' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Column */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-black">
                Why We Do This
              </h2>
              <div className="space-y-4 text-base md:text-lg leading-relaxed text-black">
                <p>
                  We believe that a business is only as strong as the community it serves. That's why WINGSIDE CARES isn't just about donations — it's about genuine connection, sustainable support, and being present in both good times and bad.
                </p>
                <p>
                  From supporting families displaced by crises to investing in long-term community development, we're committed to making a tangible difference. We don't just show up for the photo opportunities; we show up for the hard work, the consistent effort, and the real impact.
                </p>
                <p className="font-semibold">
                  This is our way of giving back with intention, consistency, and heart.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="order-first md:order-last">
              <img
                src="/cares-why-we-do-this.jpg"
                alt="Hands coming together in partnership"
                className="w-full h-auto rounded-2xl shadow-lg"
                style={{ borderRadius: '16px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO SECTION */}
      <section className="py-16 md:py-24 gutter-x" style={{ backgroundColor: '#FFFDF2' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16" style={{ color: '#552627' }}>
            What we do
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Column 1 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <svg className="w-16 h-16" style={{ color: '#f4c430' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z"/>
                  <path d="M10 12h4v8h-4z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#552627' }}>
                Supporting Displaced Homes
              </h3>
              <p className="text-base leading-relaxed" style={{ color: '#666' }}>
                We provide immediate food relief and support to families displaced by hardship, ensuring no one goes hungry during difficult times.
              </p>
            </div>

            {/* Column 2 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <svg className="w-16 h-16" style={{ color: '#f4c430' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#552627' }}>
                Community Development
              </h3>
              <p className="text-base leading-relaxed" style={{ color: '#666' }}>
                We invest in long-term community development projects, creating sustainable solutions that strengthen local neighborhoods.
              </p>
            </div>

            {/* Column 3 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <svg className="w-16 h-16" style={{ color: '#f4c430' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#552627' }}>
                Emergency & Crisis Response
              </h3>
              <p className="text-base leading-relaxed" style={{ color: '#666' }}>
                We mobilize quickly during emergencies and crises, providing food, resources, and hands-on support when it's needed most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WINGSIDE CARES IN ACTION SECTION */}
      <section className="py-16 md:py-24 bg-white">
        {/* Header - Constrained width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-0" style={{ color: '#552627' }}>
              WINGSIDE CARES in Action.<br />
              <span className="text-2xl md:text-3xl lg:text-4xl">Real Work, Real People</span>
            </h2>
            <Link
              href="#join-movement"
              className="inline-block px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 whitespace-nowrap"
              style={{ backgroundColor: '#f4c430', color: '#552627' }}
            >
              Join this Movement
            </Link>
          </div>
        </div>

        {/* Cards Grid - 4x2 layout - Full width */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-0 w-full">
            {/* Card 1 - Dark Burgundy */}
            <div className="p-10 transition-all duration-300 group relative flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#5c3a3a', height: '400px', padding: '40px' }}>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-black">
                  Feeding Communities
                </h3>
                <p className="text-white text-sm leading-relaxed group-hover:text-black mb-4">
                  Regular food distribution programs reaching hundreds of families monthly, ensuring consistent access to nutritious meals for those in need.
                </p>
                <svg className="w-10 h-10 group-hover:text-black" style={{ color: '#f4c430' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            {/* Card 2 - Photo */}
            <div className="overflow-hidden transition-all duration-300 relative" style={{ height: '400px' }}>
              <img
                src="/cares-action-1.jpg"
                alt="Wingside team distributing food outdoors"
                className="w-full h-full object-cover transition-all duration-300 hover:grayscale"
              />
            </div>

            {/* Card 3 - Dark Burgundy */}
            <div className="p-10 transition-all duration-300 group relative flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#5c3a3a', height: '400px', padding: '40px' }}>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-black">
                  Standing With Local Partners
                </h3>
                <p className="text-white text-sm leading-relaxed group-hover:text-black mb-4">
                  Collaborating with local organizations, churches, and community groups to maximize our collective impact and reach more people effectively.
                </p>
                <svg className="w-10 h-10 group-hover:text-black" style={{ color: '#f4c430' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            {/* Card 4 - Photo */}
            <div className="overflow-hidden transition-all duration-300 relative" style={{ height: '400px' }}>
              <img
                src="/cares-action-2.jpg"
                alt="Team preparing food indoors"
                className="w-full h-full object-cover transition-all duration-300 hover:grayscale"
              />
            </div>

            {/* Card 5 - Photo */}
            <div className="overflow-hidden transition-all duration-300 relative" style={{ height: '400px' }}>
              <img
                src="/cares-action-3.jpg"
                alt="Large group of volunteers at outdoor event"
                className="w-full h-full object-cover transition-all duration-300 hover:grayscale"
              />
            </div>

            {/* Card 6 - Bright Yellow */}
            <div className="p-10 transition-all duration-300 group relative flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#f4c430', height: '400px', padding: '40px' }}>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-black" style={{ color: '#552627' }}>
                  Serving With Heart
                </h3>
                <p className="text-sm leading-relaxed group-hover:text-black mb-4" style={{ color: '#552627' }}>
                  Our volunteers and team members show up every day with genuine care and dedication, building meaningful connections with the communities we serve.
                </p>
                <svg className="w-10 h-10 group-hover:text-black" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#552627' }}>
                  <path d="M16 19V5l-11 7z"/>
                </svg>
              </div>
            </div>

            {/* Card 7 - Photo */}
            <div className="overflow-hidden transition-all duration-300 relative" style={{ height: '400px' }}>
              <img
                src="/cares-action-4.jpg"
                alt="Volunteers working together"
                className="w-full h-full object-cover transition-all duration-300 hover:grayscale"
              />
            </div>

            {/* Card 8 - Bright Yellow */}
            <div className="p-10 transition-all duration-300 group relative flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#f4c430', height: '400px', padding: '40px' }}>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-black" style={{ color: '#552627' }}>
                  Powered by People
                </h3>
                <p className="text-sm leading-relaxed group-hover:text-black mb-4" style={{ color: '#552627' }}>
                  WINGSIDE CARES is driven by our passionate volunteers and community partners who believe that together, we can create lasting change.
                </p>
                <svg className="w-10 h-10 group-hover:text-black" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#552627' }}>
                  <path d="M16 19V5l-11 7z"/>
                </svg>
              </div>
            </div>
          </div>
      </section>

      {/* ROOTED IN THE COMMUNITY SECTION */}
      <section className="py-16 md:py-24 gutter-x bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#552627' }}>
              Rooted in the Community
            </h2>
            <p className="text-base md:text-lg max-w-3xl mx-auto mb-8 leading-relaxed" style={{ color: '#666' }}>
              Our commitment runs deep. We're not just serving food — we're building relationships, supporting local initiatives, and growing together with the communities that have welcomed us from the beginning.
            </p>
            <button
              onClick={() => setIsPopupOpen(true)}
              className="inline-block px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#f4c430', color: '#552627' }}
            >
              Partner With Us
            </button>
          </div>

          {/* Large Full-Width Image */}
          <div className="mt-12">
            <img
              src="/cares-rooted-community.jpg"
              alt="Community gathering with long tables of food"
              className="w-full h-auto rounded-2xl shadow-lg"
              style={{ borderRadius: '16px' }}
            />
          </div>
        </div>
      </section>

      {/* PARTNERSHIP CONTACT POPUP */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setIsPopupOpen(false);
              setSubmitError('');
              setSubmitSuccess(false);
            }}
          ></div>

          {/* Popup Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsPopupOpen(false);
                setSubmitError('');
                setSubmitSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#552627' }}>
                  Thank You!
                </h3>
                <p className="text-gray-600">
                  Your partnership inquiry has been submitted successfully. We'll get back to you soon!
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#552627' }}>
                  Partner With Us
                </h2>
                <p className="text-gray-600 mb-6">
                  Interested in partnering with Wingside Cares? Fill out the form below and we'll get in touch with you.
                </p>

                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{submitError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Hidden honeypot field to catch bots */}
                  <HoneypotField />

                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#552627' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#552627' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: '#552627' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="organization" className="block text-sm font-semibold mb-2" style={{ color: '#552627' }}>
                      Organization/Business Name
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Your organization name"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: '#552627' }}>
                      Partnership Interest *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                      placeholder="Tell us about your organization and how you'd like to partner with us..."
                    />
                  </div>

                  {/* Cloudflare Turnstile CAPTCHA */}
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                      onSuccess={setCaptchaToken}
                      onError={() => {
                        setSubmitError('CAPTCHA verification failed. Please try again.');
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
                    disabled={isSubmitting || !captchaToken}
                    className="w-full py-3 px-6 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#f4c430', color: '#552627' }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
