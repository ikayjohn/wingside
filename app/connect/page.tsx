"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  spotify_playlist_url: string | null;
  spotify_description: string | null;
}

export default function WingsideConnectPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [rsvpData, setRsvpData] = useState({
    name: '',
    email: '',
    phone: '',
    attending: 'yes',
    stayUpdated: false,
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    interest: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRsvpInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setRsvpData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openEventModal = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    setRsvpMessage(null);
    setRsvpData({ name: '', email: '', phone: '', attending: 'yes', stayUpdated: false });
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setRsvpLoading(true);
    setRsvpMessage(null);

    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          event_title: selectedEvent.title,
          name: rsvpData.name,
          email: rsvpData.email,
          phone: rsvpData.phone,
          attending: rsvpData.attending,
          stay_updated: rsvpData.stayUpdated,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit RSVP');
      }

      setRsvpMessage({ type: 'success', text: 'RSVP submitted successfully! See you there!' });
      setRsvpData({ name: '', email: '', phone: '', attending: 'yes', stayUpdated: false });

      setTimeout(() => {
        closeEventModal();
      }, 2000);
    } catch (error: any) {
      setRsvpMessage({ type: 'error', text: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'connect',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: `Interest: ${formData.interest}`,
          formData: {
            interest: formData.interest,
            source: 'connect_page'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitMessage({ type: 'success', text: data.message || 'Welcome to Wingconnect! We\'ll be in touch soon.' });
      setFormData({ fullName: '', email: '', phone: '', interest: '' });

      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch events from database
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (data.events) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Convert Spotify URL to embed URL
  const getSpotifyEmbedUrl = (url: string | null) => {
    if (!url) return null;

    // Handle different Spotify URL formats
    // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M -> embed format
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch) {
      return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
    }

    // If already embed URL, return as is
    if (url.includes('/embed/')) {
      return url;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="connect-hero">
        <div className="connect-hero-overlay"></div>
        <img src="/connect-hero.jpg" alt="Wingside Connect" className="connect-hero-bg" />

        <div className="connect-hero-content">
          <h1 className="connect-hero-title">
            <span className="text-yellow-400">Wingside</span> CONNECT
          </h1>
          <p className="connect-hero-tagline">
            MORE THAN FOOD. A MOVEMENT. A COMMUNITY.
          </p>

          {/* Tags */}
          <div className="connect-hero-tags">
            <span className="connect-tag">
              <img src="/running.svg" alt="" width="18" height="18" style={{filter: 'brightness(0) invert(1)'}} />
              Run Clubs
            </span>
            <span className="connect-tag">
              <img src="/game.svg" alt="" width="18" height="18" style={{filter: 'brightness(0) invert(1)'}} />
              Game Nights
            </span>
            <span className="connect-tag">
              <img src="/jam.svg" alt="" width="18" height="18" style={{filter: 'brightness(0) invert(1)'}} />
              Jam Sessions
            </span>
            <span className="connect-tag">
              <img src="/talks.svg" alt="" width="18" height="18" style={{filter: 'brightness(0) invert(1)'}} />
              Talks & Events
            </span>
            <span className="connect-tag">
              <img src="/gifts.svg" alt="" width="18" height="18" style={{filter: 'brightness(0) invert(1)'}} />
              Freebies & First Dips Access
            </span>
          </div>

          <button
            className="connect-hero-btn"
            onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Join the movement
          </button>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="connect-why-section">
        <div className="connect-why-container">
          <div className="connect-why-left">
            <span className="connect-badge">Why Join Us</span>
            <h2 className="connect-why-title">
              Be More Than<br />Just a Customer
            </h2>
            <div className="connect-trophy">
              <img src="/trophy.png" alt="Trophy" />
            </div>
          </div>

          <div className="connect-why-right">
            <div className="connect-benefit connect-benefit-1">
              <span className="connect-benefit-icon red">★</span>
              <span className="connect-benefit-text">Early access to drops & events</span>
            </div>
            <div className="connect-benefit connect-benefit-2">
              <span className="connect-benefit-icon yellow">★</span>
              <span className="connect-benefit-text">Exclusive events</span>
            </div>
            <div className="connect-benefit connect-benefit-3">
              <span className="connect-benefit-icon orange">≡</span>
              <span className="connect-benefit-text">Earn rewards for showing up</span>
            </div>
            <div className="connect-benefit connect-benefit-4">
              <span className="connect-benefit-icon blue">●</span>
              <span className="connect-benefit-text">Vote on flavors & merch</span>
            </div>

            {/* Decorative stars */}
            <div className="connect-star connect-star-1">✦</div>
            <div className="connect-star connect-star-2">✦</div>
            <div className="connect-star connect-star-3">✦</div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="connect-events-section">
        <div className="connect-events-container">
          <span className="connect-events-badge">Upcoming events</span>
          <h2 className="connect-events-title">What's Popping?</h2>

          {eventsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No upcoming events yet. Stay tuned!</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 mb-8 ${
                events.length === 1 ? 'grid-cols-1' :
                events.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                events.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="connect-event-card cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openEventModal(event)}
                  >
                    <div className="connect-event-image">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} />
                      ) : (
                        <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="connect-event-info">
                      <div className="connect-event-date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {formatDate(event.event_date)}
                        {event.event_time && <span> at {event.event_time}</span>}
                      </div>
                      <h3 className="connect-event-title">{event.title}</h3>
                      <div className="connect-event-location">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={closeEventModal}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Image */}
            {selectedEvent.image_url && (
              <div className="relative h-64 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={closeEventModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              {!selectedEvent.image_url && (
                <div className="flex justify-between items-start mb-4">
                  <div></div>
                  <button
                    onClick={closeEventModal}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}

              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>

              {/* Event Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="font-medium">
                    {formatDate(selectedEvent.event_date)}
                    {selectedEvent.event_time && ` at ${selectedEvent.event_time}`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Spotify Playlist Section */}
              {selectedEvent.spotify_playlist_url && (
                <div className="mb-6">
                  {selectedEvent.spotify_description && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-green-600 flex-shrink-0">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedEvent.spotify_description}
                          </p>
                          <a
                            href="https://open.spotify.com/user/syumuqwbg8blrmxrgi29964y9?si=43e02ade617946a7"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            Follow us on Spotify
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Embedded Spotify Player */}
                  {getSpotifyEmbedUrl(selectedEvent.spotify_playlist_url) && (
                    <div className="rounded-xl overflow-hidden">
                      <iframe
                        src={getSpotifyEmbedUrl(selectedEvent.spotify_playlist_url)!}
                        width="100%"
                        height="380"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl"
                      ></iframe>
                    </div>
                  )}
                </div>
              )}

              {/* RSVP Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">RSVP for this event</h3>

                <form onSubmit={handleRsvpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={rsvpData.name}
                      onChange={handleRsvpInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={rsvpData.email}
                      onChange={handleRsvpInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={rsvpData.phone}
                      onChange={handleRsvpInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Will you be attending the event? *
                    </label>
                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          value="yes"
                          checked={rsvpData.attending === 'yes'}
                          onChange={handleRsvpInputChange}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 border-2 rounded-lg text-center font-medium transition-all ${
                          rsvpData.attending === 'yes'
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}>
                          Yes
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          value="maybe"
                          checked={rsvpData.attending === 'maybe'}
                          onChange={handleRsvpInputChange}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 border-2 rounded-lg text-center font-medium transition-all ${
                          rsvpData.attending === 'maybe'
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}>
                          Maybe
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          value="no"
                          checked={rsvpData.attending === 'no'}
                          onChange={handleRsvpInputChange}
                          className="sr-only"
                        />
                        <div className={`px-4 py-2 border-2 rounded-lg text-center font-medium transition-all ${
                          rsvpData.attending === 'no'
                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}>
                          No
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="stayUpdated"
                        checked={rsvpData.stayUpdated}
                        onChange={handleRsvpInputChange}
                        className="mt-1 w-5 h-5 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700">
                        Would you like to stay updated on events happening at Wingside?
                      </span>
                    </label>
                  </div>

                  {rsvpMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        rsvpMessage.type === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rsvpMessage.text}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={rsvpLoading}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rsvpLoading ? 'Submitting...' : 'Confirm RSVP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Add to calendar functionality
                        const event = selectedEvent;
                        const startDate = new Date(event.event_date);
                        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

                        const title = encodeURIComponent(event.title);
                        const details = encodeURIComponent(event.description || '');
                        const location = encodeURIComponent(event.location);
                        const dates = `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

                        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;

                        window.open(googleCalendarUrl, '_blank');
                      }}
                      className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Add to Calendar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join WingFam Section */}
      <section id="join-form" className="connect-join-section">
        <div className="connect-join-container">
          <h2 className="connect-join-title">
            Join <span className="text-yellow-400">Wingconnect</span>
          </h2>
          <p className="connect-join-subtitle">
            Find your people, taste the culture, sign up in 30 seconds
          </p>

          <form onSubmit={handleSubmit} className="connect-join-form">
            <div className="connect-form-field">
              <label className="connect-form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="connect-form-input"
              />
            </div>

            <div className="connect-form-field">
              <label className="connect-form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="connect-form-input"
              />
            </div>

            <div className="connect-form-field">
              <label className="connect-form-label">Phone Number (WhatsApp Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+234 XXX XXX XXXX"
                className="connect-form-input"
              />
            </div>

            <div className="connect-form-field">
              <label className="connect-form-label">What excites you most?</label>
              <div className="connect-select-wrapper">
                <select
                  name="interest"
                  value={formData.interest}
                  onChange={handleInputChange}
                  className="connect-form-select"
                >
                  <option value="">Select the one that applies</option>
                  <option value="events">Events & Meetups</option>
                  <option value="gaming">Game Nights</option>
                  <option value="fitness">Run Clubs & Fitness</option>
                  <option value="music">Jam Sessions</option>
                  <option value="freebies">Freebies & Early Access</option>
                </select>
                <div className="connect-select-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="connect-submit-btn"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Joining...' : 'Join Now'}
            </button>

            {submitMessage && (
              <div
                className={`text-center py-3 px-4 rounded ${
                  submitMessage.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            <p className="connect-form-note">No spam. Only vibes & wings.</p>
          </form>

          <div className="connect-footer">
            <p>
              Follow us <a href="https://instagram.com/mywingside" className="connect-footer-link connect-footer-link-brown">@mywingside</a> |
              Contact: <a href="mailto:connect@wingside.ng" className="connect-footer-link connect-footer-link-brown">connect@wingside.ng</a> |
              Powered by <a href="/" className="connect-footer-link highlight">Wingside</a>
            </p>
          </div>
        </div>
      </section>

      {/* Spotify Section */}
      <section className="connect-spotify-section">
        <div className="connect-spotify-container">
          <div className="connect-spotify-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <h2 className="connect-spotify-title">
            You like us enough to connect with us,<br />
            let's enjoy music together.
          </h2>
          <a
            href="https://open.spotify.com/user/syumuqwbg8blrmxrgi29964y9?si=43e02ade617946a7"
            target="_blank"
            rel="noopener noreferrer"
            className="connect-spotify-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Follow us on Spotify
          </a>
        </div>
      </section>

    </div>
  );
}
