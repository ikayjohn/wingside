"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function CateringPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventType: '',
    numberOfPeople: '',
    eventDate: '',
    moreDetails: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'catering',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: `
Event Type: ${formData.eventType}
Number of People: ${formData.numberOfPeople}
Event Date: ${formData.eventDate}

Details:
${formData.moreDetails}
          `.trim(),
          formData: {
            eventType: formData.eventType,
            numberOfPeople: formData.numberOfPeople,
            eventDate: formData.eventDate,
            moreDetails: formData.moreDetails,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitMessage({ type: 'success', text: data.message });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        eventType: '',
        numberOfPeople: '',
        eventDate: '',
        moreDetails: ''
      });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="bg-white px-4 md:px-8 lg:px-16 py-6">
        <Link href="/business" className="inline-flex items-center gap-2 text-black hover:text-[#F7C400] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-medium">Back to Wingside Business</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative h-[700px] md:h-[800px] lg:h-[900px]">
        <img
          src="/catering-hero.jpg"
          alt="Wingside Catering"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#FDEDB2] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingside Catering</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              You bring the guests, we'll<br />bring the flavours
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              Whether its birthdays, funerals, farewells, or "just because", we&apos;ve got you covered
            </p>

            {/* CTA Button */}
            <a
              href="#contact"
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Get a quote
            </a>
          </div>
        </div>
      </div>

      {/* Perfect for every occassion Section - 90% width */}
      <div className="bg-white py-16 md:py-24">
        <div className="w-[90%] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
              Perfect for every gatherings
            </h2>
          </div>

          {/* Occasions Grid - 2 rows x 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-x-4 md:gap-y-0">
            {/* Row 1 - Birthday Parties */}
            <div className="bg-[#FFD6D6] rounded-3xl overflow-hidden relative h-[280px] md:h-[220px]">
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Birthday Parties</h3>
                <p className="text-black text-sm">Make it a wing-derful celebration.</p>
              </div>
              <div className="absolute bottom-0 right-0 w-40%] h-[70%]">
                <img src="/catering-birthday.png" alt="Birthday" className="w-full h-full object-contain object-bottom" loading="lazy" />
              </div>
            </div>

            {/* Row 1 - Corporate Events */}
            <div className="bg-[#F5E6D3] rounded-3xl overflow-hidden relative h-[280px] md:h-[320px]">
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Corporate Events</h3>
                <p className="text-black text-sm">Impress clients with flavor.</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[75%]">
                <img src="/catering-corporate.png" alt="Corporate" className="w-full h-full object-cover object-bottom" loading="lazy" />
              </div>
            </div>

            {/* Row 1 - Graduations */}
            <div className="bg-[#FFDDC1] rounded-3xl overflow-hidden relative h-[280px] md:h-[220px]">
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Graduations</h3>
                <p className="text-black text-sm">Celebrate achievements<br /> with wings.</p>
              </div>
              <div className="absolute bottom-0 right-0 w-[50%] h-[80%]">
                <img src="/catering-graduation.png" alt="Graduation" className="w-full h-full object-contain object-bottom" loading="lazy" />
              </div>
            </div>

            {/* Row 2 - Weddings */}
            <div className="bg-[#FFF4E6] rounded-3xl overflow-hidden relative h-[280px] md:h-[320px] md:self-end md:-mt-[80px]">
              <div className="absolute top-6 right-6 z-10 text-right">
                <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Weddings</h3>
                <p className="text-black text-sm">Love at first bite.</p>
              </div>
              <div className="absolute bottom-0 left-0 w-[75%] h-[85%]">
                <img src="/catering-wedding.png" alt="Wedding" className="w-full h-full object-contain object-bottom" loading="lazy" />
              </div>
            </div>

            {/* Row 2 - Sports Gaming */}
            <div className="bg-[#FFE4CC] rounded-3xl overflow-hidden relative h-[280px] md:h-[220px] md:self-end md:-mt-[80px]">
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl md:text-2xl font-bold text-black mb-1">Sports Gaming</h3>
                <p className="text-black text-sm">Game day fuel for the win.</p>
              </div>
              <div className="absolute bottom-0 right-0 w-[75%] h-[70%]">
                <img src="/catering-sports.png" alt="Sports" className="w-full h-full object-contain object-bottom" loading="lazy" />
              </div>
            </div>

            {/* Row 2 - Date Nights */}
            <div className="bg-[#FF6B8A] rounded-3xl overflow-hidden relative h-[280px] md:h-[320px] md:self-end md:-mt-[80px]">
              <div className="absolute top-6 right-6 z-10 text-right">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Date Nights</h3>
                <p className="text-white text-sm">Couples portions and<br />mood lighting.</p>
              </div>
              <div className="absolute bottom-0 left-0 w-[55%] h-[85%]">
                <img src="/catering-date.png" alt="Date Night" className="w-full h-full object-contain object-bottom" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form Section */}
      <div className="bg-[#FDF5E5] py-16 md:py-24 px-4 md:px-8 lg:px-16" id="contact">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
              We are here for you
            </h2>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              Let&apos;s create the perfect menu for your occasions.
            </p>

            {submitMessage && (
              <div className={`px-6 py-4 rounded-lg ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {submitMessage.text}
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Event Type *
                </label>
                <select
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                >
                  <option value="">Select event type</option>
                  <option value="Birthday Party">Birthday Party</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Graduation">Graduation</option>
                  <option value="Sports Event">Sports Event</option>
                  <option value="Date Night">Date Night</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Number of People *
                </label>
                <input
                  type="text"
                  required
                  value={formData.numberOfPeople}
                  onChange={(e) => setFormData({...formData, numberOfPeople: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                  placeholder="e.g., 50-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* More Details */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Additional Details
              </label>
              <textarea
                value={formData.moreDetails}
                onChange={(e) => setFormData({...formData, moreDetails: e.target.value})}
                rows={5}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] focus:border-transparent resize-none bg-white"
                placeholder="Tell us more about your event, dietary requirements, flavor preferences, etc."
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#5D4037] text-white px-12 py-4 rounded-full font-semibold text-lg hover:bg-[#4a332b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Get a Quote'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
