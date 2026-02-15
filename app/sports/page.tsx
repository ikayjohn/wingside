'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface SportsEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  image_url: string;
  is_active: boolean;
}

export default function SportsPage() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SportsEvent | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('sports_events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    interest: '',
    website: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formStartTime] = useState(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sports-community',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          _formStartTime: formStartTime,
          message: `Interest: ${formData.interest}`,
          formData: {
            interest: formData.interest,
            source: 'sports-page'
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: data.message || 'Thanks for joining the Wingside Sports Community!' });
        setFormData({ fullName: '', email: '', phone: '', interest: '', website: '' });
      } else {
        throw new Error(data.error || 'Failed to submit form');
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[750px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/sports-bar-bg.jpg"
            alt="Sports bar background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Wingside <span className="text-[#F7C400]">SPORTS</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Watch your favorite teams in style with wings and cold beers
          </p>
          <button className="bg-[#F7C400] text-[#552627] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FFC107] transition-colors">
            Reserve Your Spot
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pt-32 pb-32 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'tv', title: 'Premium HD Screens', desc: 'Watch every game in crystal-clear, stadium-level quality' },
              { icon: 'star', title: 'VIP Seating Lounge', desc: 'Relax in premium comfort with guaranteed prime views' },
              { icon: 'message', title: 'Live Game Commentary', desc: 'Real-time reactions, banter, and insights from fellow fans' },
              { icon: 'pizza', title: 'Game Day Menu', desc: 'Exclusive matchday deals on wings, drinks, and specials' },
              { icon: 'booth', title: 'Private VIP Booths', desc: 'Elevated seating experience for groups and special occasions' },
              { icon: 'users', title: 'Fan Community Vibe', desc: 'Connect, network, and celebrate with true sports enthusiasts' },
            ].map((feature, idx) => {
              const icons = {
                tv: (
                  <img src="/sports-premium-hd-screens.svg" alt="Premium HD Screens" className="w-12 h-12" />
                ),
                star: (
                  <img src="/sports-vip-seating-lounge.svg" alt="VIP Seating Lounge" className="w-12 h-12" />
                ),
                message: (
                  <img src="/sports-live-game-commentary.svg" alt="Live Game Commentary" className="w-12 h-12" />
                ),
                pizza: (
                  <img src="/sports-game-day-menu.svg" alt="Game Day Menu" className="w-12 h-12" />
                ),
                booth: (
                  <img src="/sports-private-vip-booths.svg" alt="Private VIP Booths" className="w-12 h-12" />
                ),
                users: (
                  <img src="/sports-fan-community-vibe.svg" alt="Fan Community Vibe" className="w-12 h-12" />
                ),
              };

              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-[#552627] mb-4">{icons[feature.icon as keyof typeof icons]}</div>
                <h3 className="text-lg font-bold text-[#552627] uppercase mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Wing5 Leagues Section */}
      <section className="pt-32 pb-32 bg-[#FFF9E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#F7C400] text-[#552627] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Play & Compete
          </span>
          <h2 className="text-5xl md:text-6xl font-bold text-[#552627] mb-4">Wing5 Leagues</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-12">
            Join our thriving 5-a-side football community. Play, compete, and enjoy wings after every match!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Wingside Premier League',
                desc: '5-a-side football league with weekly matches',
                schedule: '🗓 Every Saturday & Sunday',
                features: ['12 guaranteed matches', 'Official jerseys', 'Prizes for top 3', 'Free wings after each game']
              },
              {
                title: 'Corporate Champions Cup',
                desc: 'Company vs company 5-a-side tournament',
                schedule: '🗓 Monthly tournaments',
                features: ['Single-day tournament', 'Branded jerseys', 'Trophy & medals', 'Post-match buffet']
              },
              {
                title: 'Weekend Warriors',
                desc: 'Casual pickup games and friendly matches',
                schedule: '🗓 Monthly tournaments',
                features: ['Drop-in format', 'All skill levels', 'Team formation help', 'Hassle-free participation']
              },
            ].map((league, idx) => {
              const getLeagueIcon = (title: string) => {
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return `/sports-${slug}.svg`;
              };

              return (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-3">
                  <img src={getLeagueIcon(league.title)} alt={league.title} className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-bold text-[#552627] mb-2 text-center">{league.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{league.desc}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#552627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-[#552627] font-semibold">{league.schedule.replace('🗓 ', '')}</span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 mt-4">Benefits:</p>
                <ul className="space-y-2 mb-6">
                  {league.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center text-sm text-gray-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-bold cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl font-bold text-[#552627] mb-4 text-center">Upcoming Sport Events</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Mark your calendar for these exciting viewing parties and tournaments
          </p>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627]"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-[15px] overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-transform"
                >
                  <div className="relative h-64 bg-gray-200 rounded-[15px]">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover rounded-[15px]"
                      loading="eager"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = '/sports-bar-bg.jpg';
                        target.alt = 'Image not available';
                        console.error('Image failed to load:', event.image_url);
                      }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-[#F7C400] text-[#552627] px-6 py-2 rounded-full font-bold text-sm">
                        View Details
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pt-5 pb-4">
                    <h3 className="text-xl font-bold text-[#552627] mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 mt-5">
                      <svg className="w-4 h-4 text-[#552627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-[#552627] font-semibold">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Community Join Form */}
      <section className="pt-[50px] pb-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl font-bold text-[#552627] mb-12 text-center">
            Join the <span className="text-[#F7C400]">Wingside</span> Sports Community
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Whether you're a die-hard fan or just love good company, join our community today!
          </p>
          {submitMessage && (
            <div
              className={`mb-6 px-4 py-3 rounded-lg text-center ${
                submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {submitMessage.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number (WhatsApp Preferable)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent outline-none"
            />
            <select
              required
              value={formData.interest}
              onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent outline-none bg-white"
            >
              <option value="">What Excites You Most?</option>
              <option value="watching-live-sports">Watching Live Sports</option>
              <option value="socializing">Socializing & Meeting New People</option>
              <option value="food-drinks">Great Food & Drinks</option>
              <option value="tournaments">Joining Sports Tournaments</option>
              <option value="all">All of the Above!</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F7C400] text-[#552627] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#FFC107] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Joining...' : 'Join Now'}
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            By joining, you agree to our{' '}
            <Link href="/terms" className="text-[#F7C400] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#F7C400] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Event Image */}
            <div className="relative">
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* Event Details */}
            <div className="p-6 md:p-8">
              <div className="mb-4">
                <p className="text-sm text-[#F7C400] font-semibold mb-2">
                  📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-[#552627] mb-4">
                  {selectedEvent.title}
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button className="flex-1 bg-[#F7C400] hover:bg-[#FFC107] text-[#552627] px-8 py-4 rounded-full font-bold text-lg transition-colors">
                  Reserve Your Spot
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-8 py-4 border-2 border-[#552627] text-[#552627] rounded-full font-bold text-lg hover:bg-[#552627] hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
