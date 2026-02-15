"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface Location {
  id: number;
  name: string;
  badge?: string;
  address: string;
  city: string;
  rating: number;
  reviews: number;
  thumbnail: string;
  image: string;
  phone: string;
  distance: string;
  hours: string;
  mapsUrl: string;
}

export default function WingpostPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formStartTime] = useState(Date.now());
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    spaceType: '',
    message: '',
    website: '',
  });

  // Fetch locations from API
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/wingpost-locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data.locations || []);
        // Auto-select first location
        if (data.locations && data.locations.length > 0) {
          setSelectedLocation(data.locations[0]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wingpost',
          name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          company: formData.companyName,
          website: formData.website,
          _timestamp: formStartTime,
          message: `
Address: ${formData.address}
Space Type: ${formData.spaceType}

Message:
${formData.message}
          `.trim(),
          formData: {
            address: formData.address,
            spaceType: formData.spaceType,
            message: formData.message,
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
        setIsPartnerFormOpen(false);
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          spaceType: '',
          message: '',
          website: '',
        });
        setSubmitMessage(null);
      }, 2000);
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const filteredLocations = locations.filter(location => {
    return searchQuery === '' ||
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loadingLocations) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7C400] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Wingpost Locations...</p>
        </div>
      </div>
    );
  }

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
          src="/wingpost-hero-machine.jpg"
          alt="Wingpost"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'right center' }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#FDEDB2] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingpost</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Salad, sandwiches & more
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              Set up a WingPost for ready-to-eat light meals right where you need it.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#find-location"
                className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
              >
                Find a post near you
              </a>
              <button
                onClick={() => setIsPartnerFormOpen(true)}
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-black transition-colors"
              >
                Partner with us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bring Wingpost to Your Space Section */}
      <div className="bg-[#FDF5E5] py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3">
              BRING WINGPOST TO<br />YOUR SPACE
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Text Content */}
            <div className="bg-[#FDEDB2] rounded-l-3xl p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">
                Food made simple.
              </h3>
              <p className="text-gray-800 mb-4">
                WingPost is our convenient way to enjoy fresh meals.
              </p>
              <p className="text-gray-800 mb-4">
                Think of it as your go-to kiosk placed in offices, hospitals, campuses and complex buildings. Each post is refreshed daily.
              </p>
              <p className="text-gray-800">
                Walk up, choose what you crave, pay instantly, and enjoy. It's food made simple.
              </p>
            </div>

            {/* Image */}
            <div className="rounded-r-3xl overflow-hidden h-full">
              <img
                src="/wingpost-machine.png"
                alt="Wingpost Machine"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lifestyle Image Section */}
      <div className="w-full">
        <img
          src="/wingpost-lifestyle.jpg"
          alt="Wingpost Experience"
          className="w-full h-[700px] md:h-[900px] object-cover"
        />
      </div>

      {/* Collaboration Section */}
      <div className="bg-white py-16 md:py-24 px-4 md:px-8 lg:px-16" id="partner">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4 max-w-4xl mx-auto leading-tight">
            We collaborate with organizations and communities to make fresh food easy to access.
          </h2>
          <p className="text-center text-gray-700 mb-12 text-lg">
            For Spaces where people work, live, and connect.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-8 h-[540px]">
            {/* Left Image */}
            <div className="rounded-l-3xl overflow-hidden h-full">
              <img
                src="/wingpost-workspace-1.jpg"
                alt="Workspace"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Center Content */}
            <div className="bg-[#F7C400] p-8 flex flex-col justify-center items-center text-center h-full">
              <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">
                Workspaces to Hospitals and Residential<br />Buildings.
              </h3>
              <button
                onClick={() => setIsPartnerFormOpen(true)}
                className="bg-[#5D4037] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#4a332b] transition-colors"
              >
                Partner with us
              </button>
            </div>

            {/* Right Image */}
            <div className="rounded-r-3xl overflow-hidden h-full">
              <img
                src="/wingpost-workspace-2.jpg"
                alt="Residential"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Finder Section */}
      <div className="bg-gray-50 py-16 md:py-24 px-4 md:px-8 lg:px-16" id="find-location">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Location List */}
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Find a WingPost Near You</h2>

              {/* Search Bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full border border-gray-300 focus:outline-none focus:border-[#F7C400] text-gray-700"
                />
                <svg
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>

              <p className="text-gray-600 text-sm mb-6">Showing {filteredLocations.length} near you</p>

              {/* Location Cards */}
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                      selectedLocation?.id === location.id
                        ? 'border-2 border-[#F7C400] shadow-md'
                        : 'border border-gray-200 hover:border-[#F7C400] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-black">{location.name}</h3>
                          {location.badge && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                              {location.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                        <p className="text-sm text-gray-600">{location.city}</p>
                      </div>
                      <img
                        src={location.thumbnail}
                        alt={location.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Location Details */}
            {selectedLocation && (
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 sticky top-8 h-fit">
                {/* Location Image */}
                <div className="relative aspect-[4/3]">
                  <img
                    src={selectedLocation.image}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details Content */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-black mb-4">{selectedLocation.name}</h2>

                  {/* Address */}
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div>
                      <p className="text-gray-700">{selectedLocation.address}</p>
                      <p className="text-gray-700">{selectedLocation.city}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p className="text-gray-700">{selectedLocation.phone}</p>
                  </div>

                  {/* Hours */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      Hours
                    </h3>
                    <p className="text-gray-900 font-medium">{selectedLocation.hours}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <a
                      href={selectedLocation.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#5D4037] text-white font-semibold py-4 rounded-full hover:bg-[#4a332b] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 11l19-9-9 19-2-8-8-2z"></path>
                      </svg>
                      Get Direction
                    </a>
                    <a
                      href={`tel:${selectedLocation.phone}`}
                      className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 rounded-full hover:border-[#F7C400] hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Call Location
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner Form Modal */}
      {isPartnerFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsPartnerFormOpen(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Partner with Wingpost</h2>
                  <p className="text-gray-600">Fill out the form below and we'll get back to you shortly.</p>

                  {submitMessage && (
                    <div className={`mt-4 px-4 py-3 rounded-lg ${
                      submitMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage.text}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsPartnerFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Honeypot field */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company/Organization Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Contact Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Phone & Space Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                      placeholder="08012345678"
                    />
                  </div>

                  <div>
                    <label htmlFor="spaceType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Space Type *
                    </label>
                    <select
                      id="spaceType"
                      name="spaceType"
                      required
                      value={formData.spaceType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="Office/Workspace">Office/Workspace</option>
                      <option value="Hospital/Healthcare">Hospital/Healthcare</option>
                      <option value="School/University">School/University</option>
                      <option value="Residential Complex">Residential Complex</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Shopping Mall">Shopping Mall</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Location Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors"
                    placeholder="Enter your location address"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F7C400] transition-colors resize-none"
                    placeholder="Tell us more about your space..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPartnerFormOpen(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-[#F7C400] text-black font-semibold rounded-full hover:bg-[#e5b500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
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
