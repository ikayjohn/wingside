"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function MeetingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventType: '',
    numberOfPeople: '',
    eventDate: '',
    serviceType: '',
    mealPreference: '',
    moreDetails: ''
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meetings',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: `
Event Type: ${formData.eventType}
Number of People: ${formData.numberOfPeople}
Event Date: ${formData.eventDate}
Service Type: ${formData.serviceType}
Meal Preference: ${formData.mealPreference}

Details:
${formData.moreDetails}
          `.trim(),
          formData: {
            eventType: formData.eventType,
            numberOfPeople: formData.numberOfPeople,
            eventDate: formData.eventDate,
            serviceType: formData.serviceType,
            mealPreference: formData.mealPreference,
            moreDetails: formData.moreDetails,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitMessage({ type: 'success', text: data.message });

      // Close modal and reset form after delay
      setTimeout(() => {
        setIsFormOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          eventType: '',
          numberOfPeople: '',
          eventDate: '',
          serviceType: '',
          mealPreference: '',
          moreDetails: ''
        });
        setSubmitMessage(null);
      }, 2000);
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
          src="/meetings-hero.jpg"
          alt="Wingside Meetings"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#FDEDB2] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingside Meetings</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Boosting team productivity one meal at a time
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              From quick huddles to full-blown conferences, Wingside keeps your team full of ideas and wings to execute.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </div>

      {/* Where Great Ideas Take Flight Section */}
      <div className="bg-[#FDF5E5] py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
            WHERE GREAT IDEAS<br />TAKE FLIGHT
          </h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Every big idea starts with a spark — and sometimes, that spark comes with a side of spicy honey glaze. At Wingside, we believe meetings shouldn't taste boring. Whether it's your Monday brainstorm or a 500-person product launch, our spreads turn routine sessions into mini flavor festivals.
          </p>
        </div>
      </div>

      {/* Built for Every Kind of Gathering Section */}
      <div className="bg-white pt-16 md:pt-24">
        {/* Section Header */}
        <div className="mb-12 w-[90%] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black">
              Built for every kind<br />of meetings.
            </h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold hover:bg-[#e5b500] transition-colors"
            >
              Bring us in
            </button>
          </div>
        </div>

        {/* Grid of Meeting Types - 2 rows x 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {/* Row 1: Quick Huddles (Brown overlay left + Image right) */}
            <div className="md:col-span-1 bg-[#5D4037] p-8 flex flex-col justify-center min-h-[300px]">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Quick Huddles</h3>
              <p className="text-white text-base md:text-lg mb-4">
                Perfect for those last-minute check-ins. Finger-licking good wings and bites that keep hands busy and minds moving.
              </p>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#F7C400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="md:col-span-1 min-h-[300px]">
              <img
                src="/meetings-quick-huddles.jpg"
                alt="Quick Huddles"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Row 1: Workshops & Trainings (Image left + Brown overlay right) */}
            <div className="md:col-span-1 bg-[#5D4037] p-8 flex flex-col justify-center min-h-[300px] order-3 md:order-none">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Workshops & Trainings</h3>
              <p className="text-white text-base md:text-lg mb-4">
                Keep participants alert and engaged with energy-packed meals designed to last the whole day.
              </p>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#F7C400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="md:col-span-1 min-h-[300px] order-4 md:order-none">
              <img
                src="/meetings-workshops.jpg"
                alt="Workshops & Trainings"
                className="w-full h-full object-cover"
              />
            </div>


            {/* Row 2: Team Lunches (Image left + Yellow overlay right) */}
            <div className="md:col-span-1 min-h-[300px]">
              <img
                src="/meetings-team-lunches.jpg"
                alt="Team Lunches"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-1 bg-[#F7C400] p-8 flex flex-col justify-center min-h-[300px]">
              <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">Team Lunches</h3>
              <p className="text-black text-base md:text-lg mb-4">
                Level up your lunchtime — wings, wraps, and sides that refuel without slowing anyone down.
              </p>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Row 2: Corporate Events (Image left + Yellow overlay right) */}
            <div className="md:col-span-1 min-h-[300px] order-8 md:order-none">
              <img
                src="/meetings-corporate-events.jpg"
                alt="Corporate Events"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-1 bg-[#F7C400] p-8 flex flex-col justify-center min-h-[300px] order-7 md:order-none">
              <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">Corporate Events</h3>
              <p className="text-black text-base md:text-lg mb-4">
                Feeding the big crowd? We've got wings, sides, and sauces ready to impress every guest in the room.
              </p>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#FDF5E5] py-16 md:py-24 px-4 md:px-8 lg:px-16" id="contact">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
            Feed your team
          </h2>
          <p className="text-gray-700 text-base md:text-lg mb-8 leading-relaxed">
            Fill out a quick form and our team will handle the rest
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-block bg-[#5D4037] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#4a332b] transition-colors"
          >
            Talk to us
          </button>
        </div>
      </div>

      {/* Quote Request Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 md:p-12">
              {/* Close Button */}
              <button
                onClick={() => setIsFormOpen(false)}
                className="float-right text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>

              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  Let's spice up your meetings
                </h2>
              </div>

              <p className="text-gray-700 mb-6 text-center">
                Fill the form below, so we can reach you with your quote
              </p>

              {submitMessage && (
                <div className={`mb-6 px-6 py-4 rounded-lg ${
                  submitMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleFormSubmit}>
                {/* Row 1: Full Name | Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Contact Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400]"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400]"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Phone | Event Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Type of Event
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400] appearance-none bg-white"
                      required
                    >
                      <option value="">Select event type</option>
                      <option value="Quick Huddles">Quick Huddles</option>
                      <option value="Workshops & Trainings">Workshops & Trainings</option>
                      <option value="Team Lunches">Team Lunches</option>
                      <option value="Corporate Events">Corporate Events</option>
                      <option value="Conference">Conference</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Number of People | Event Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Number of People
                    </label>
                    <select
                      value={formData.numberOfPeople}
                      onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400] appearance-none bg-white"
                      required
                    >
                      <option value="">Number of guest</option>
                      <option value="1-10">1-10 people</option>
                      <option value="11-25">11-25 people</option>
                      <option value="26-50">26-50 people</option>
                      <option value="51-100">51-100 people</option>
                      <option value="101-250">101-250 people</option>
                      <option value="251-500">251-500 people</option>
                      <option value="500+">500+ people</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400]"
                      required
                    />
                  </div>
                </div>

                {/* Row 4: Service Type | Meal Preference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Service Type
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400] appearance-none bg-white"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Buffet">Buffet</option>
                      <option value="Individual Meals">Individual Meals</option>
                      <option value="Family Style">Family Style</option>
                      <option value="Cocktail Reception">Cocktail Reception</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Meal Preference
                    </label>
                    <select
                      value={formData.mealPreference}
                      onChange={(e) => setFormData({ ...formData, mealPreference: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#F7C400] appearance-none bg-white"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Wings Only">Wings Only</option>
                      <option value="Wings & Sides">Wings & Sides</option>
                      <option value="Full Menu">Full Menu</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* More Details */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    More Details
                  </label>
                  <textarea
                    value={formData.moreDetails}
                    onChange={(e) => setFormData({ ...formData, moreDetails: e.target.value })}
                    placeholder="Provide us with more details about this event"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:border-[#F7C400] resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#F7C400] text-black px-16 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
