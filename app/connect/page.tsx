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
}

export default function WingsideConnectPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
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
              <div className="connect-events-grid">
                {events.map((event) => (
                  <div key={event.id} className="connect-event-card">
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

              <Link href="/connect/events" className="connect-calendar-btn">See full calendar</Link>
            </>
          )}
        </div>
      </section>

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
