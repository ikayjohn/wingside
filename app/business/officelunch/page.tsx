"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function OfficeLunchPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    teamSize: '',
    startDate: '',
    needs: ''
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
          type: 'office-lunch',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.companyName,
          message: `
Team Size: ${formData.teamSize}
Preferred Start Date: ${formData.startDate}

Needs:
${formData.needs}
          `.trim(),
          formData: {
            teamSize: formData.teamSize,
            startDate: formData.startDate,
            needs: formData.needs,
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
        name: '',
        email: '',
        phone: '',
        companyName: '',
        teamSize: '',
        startDate: '',
        needs: ''
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
          src="/officelunch-hero.jpg"
          alt="Office Lunch"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#FDEDB2] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Office Lunch</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Lunch without the<br />Lunchtime chaos
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              Personalized meals delivered when you want, how you want. Work harder, munch smarter.
            </p>

            {/* CTA Button */}
            <a
              href="#contact"
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Talk to us
            </a>
          </div>
        </div>
      </div>

      {/* Say goodbye to lunch logistics Section */}
      <div className="bg-white py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
                Say goodbye to<br />lunch logistics
              </h2>
              <p className="text-gray-700 text-base md:text-lg mb-12 leading-relaxed">
                No more lunch runs, long queues, or waiting for whatever's ready. Get personalized team meals that fit your schedule, preferences, and budget.
              </p>

              {/* Benefits Grid - 3 rows x 2 columns - 90% width */}
              <div className="w-[90%]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">Order when you want, delivered on your schedule</p>
                  </div>
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">Personalized menus for every dietary need</p>
                  </div>

                  {/* Row 2 */}
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">Skip the lunch rush chaos completely</p>
                  </div>
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">Recurring orders that run on autopilot</p>
                  </div>

                  {/* Row 3 */}
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">No minimum orders, no hassle</p>
                  </div>
                  <div className="bg-[#FDF5E5] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F7C400] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12l5 5L20 7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-black text-sm md:text-base">Team discounts that make sense</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end items-center">
              <img
                src="/officelunch-boxes.png"
                alt="Wingside Office Lunch Boxes"
                className="w-full scale-110"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Large Image Section */}
      <div className="w-full h-[500px] md:h-[700px]">
        <img
          src="/officelunch-delivery.jpg"
          alt="Office Lunch Delivery"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contact Form Section */}
      <div className="bg-white py-16 md:py-24 px-4 md:px-8 lg:px-16" id="contact">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
              Ready to ditch the chaos?
            </h2>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              Let's build your personalized office lunch plan. No commitment, just conversation.
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

          {/* Form */}
          <form onSubmit={handleFormSubmit}>
            {/* Row 1: Name | Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Contact Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400]"
                  required
                />
              </div>
            </div>

            {/* Row 2: Phone | Company Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter your company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400]"
                  required
                />
              </div>
            </div>

            {/* Row 3: Team Size | Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Team Size
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] appearance-none bg-white"
                  required
                >
                  <option value="">e.g. 10-25 people</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-10">6-10 people</option>
                  <option value="11-25">11-25 people</option>
                  <option value="26-50">26-50 people</option>
                  <option value="51-100">51-100 people</option>
                  <option value="101+">101+ people</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  placeholder="Select a day"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400]"
                  required
                />
              </div>
            </div>

            {/* Tell us about your needs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Tell us about your needs
              </label>
              <textarea
                value={formData.needs}
                onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
                placeholder="Include dietary preferences, or budget requirements"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="text-center mb-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5D4037] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#4a332b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-sm text-gray-600">
              Our team typically responds within 24 hours. Need faster assistance? Call us at{' '}
              <a href="tel:08090191999" className="text-[#F7C400] font-semibold hover:underline">
                08090191999
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
