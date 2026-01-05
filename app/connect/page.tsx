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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
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
          {/* Logo */}
          <div className="connect-hero-logo">
            <img src="/logo-white.png" alt="Wingside" className="h-16 w-auto" />
          </div>

          <h1 className="connect-hero-title">
            <span className="text-yellow-400">Wingside</span> CONNECT
          </h1>
          <p className="connect-hero-tagline">
            MORE THAN FOOD. A MOVEMENT. A COMMUNITY. <span className="text-yellow-400">LET'S VIBE</span>
          </p>
          <p className="connect-hero-description">
            Wingside Connect is our way of bringing you into the flavor of the moment — not just through what you eat, but how you live, play, move and connect.
          </p>

          {/* Tags */}
          <div className="connect-hero-tags">
            <span className="connect-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
              Run Clubs
            </span>
            <span className="connect-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Game Nights
            </span>
            <span className="connect-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
              Jam Sessions
            </span>
            <span className="connect-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Talks & Events
            </span>
            <span className="connect-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
              Freebies & First Dips Access
            </span>
          </div>

          <button className="connect-hero-btn">Join the movement</button>
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
              <span className="connect-benefit-text">VIP meetups & exclusive vibes</span>
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
          <h2 className="connect-events-title">What's Popping Soon?</h2>

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

              <button className="connect-calendar-btn">See full calendar</button>
            </>
          )}
        </div>
      </section>

      {/* Join WingFam Section */}
      <section className="connect-join-section">
        <div className="connect-join-container">
          <h2 className="connect-join-title">
            Join the <span className="text-yellow-400">WingFam</span>
          </h2>
          <p className="connect-join-subtitle">
            Find your people, Taste the culture, Every table connects a tribe. Join in 30 seconds
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

            <button type="submit" className="connect-submit-btn">Join Now</button>

            <p className="connect-form-note">No spam. Only vibes & wings.</p>
          </form>

          <div className="connect-footer">
            <p>
              Follow us <a href="https://instagram.com/mywingside" className="connect-footer-link">@mywingside</a> |
              Contact: <a href="mailto:connect@wingside.ng" className="connect-footer-link">connect@wingside.ng</a> |
              Powered by <a href="/" className="connect-footer-link highlight">Wingside</a>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
