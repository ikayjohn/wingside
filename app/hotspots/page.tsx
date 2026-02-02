"use client";

import React from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/client/csrf';

export default function WingsideHotspotsPage() {

  const businessTypes = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
      ),
      label: 'Salons & Spas'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6.5 6.5 11 11"/>
          <path d="m21 21-1-1"/>
          <path d="m3 3 1 1"/>
          <path d="m18 22 4-4"/>
          <path d="m2 6 4-4"/>
          <path d="m3 10 7-7"/>
          <path d="m14 21 7-7"/>
        </svg>
      ),
      label: 'Gyms & Fitness'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
      label: 'Cafes & Lounges'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: 'Apartment Complexes'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      ),
      label: 'Retail Stores'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 12h4m-2-2v4m14-2h-6"/>
        </svg>
      ),
      label: 'Recreation Centers'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      label: '...and more',
      highlight: true
    },
  ];

  const benefits = [
    {
      title: 'Exclusive Customer Perks',
      description: 'Offer your customers special Wingside discounts through QR codes.',
    },
    {
      title: 'Zero Cost Marketing',
      description: 'Get branded materials and signage at no cost to your business.',
    },
    {
      title: 'Revenue Share Opportunity',
      description: 'Earn commissions on orders generated from your location.',
    },
    {
      title: 'Enhanced Brand Visibility',
      description: 'Co-marketing opportunities and social media features.',
    },
  ];

  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      title: 'Apply to be a Partner',
      description: 'Fill out our simple application form with your business details',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      title: 'Get Approved',
      description: 'Our team reviews your application within 48 hours',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      title: 'Receive Marketing Kit',
      description: 'We provide QR codes, posters, table tents, and digital assets',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      title: 'Start Earning',
      description: 'Display materials and watch your customers enjoy exclusive deals',
    },
  ];

  const materials = [
    'Custom QR codes with your unique tracking link',
    'Premium poster designs (A3 & A4 sizes)',
    'Table tents and counter displays',
    'Digital assets for social media',
    'Window clings and decals',
    'Branded merchandise (optional)',
  ];

  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetchWithCsrf('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          type: 'hotspot',
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.businessName,
          message: data.message || undefined,
          formData: {
            businessType: data.businessType,
            source: 'hotspots_page'
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setSubmitMessage({ type: 'success', text: result.message || 'Application submitted successfully! We\'ll contact you within 48 hours.' });

      // Reset form and close modal after delay
      setTimeout(() => {
        setShowForm(false);
        setSubmitMessage(null);
        (e.target as HTMLFormElement).reset();
      }, 2000);

    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.message || 'Failed to submit application. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative min-h-[750px] flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <img src="/hotspots-hero.jpg" alt="Wingside Hotspot" className="absolute inset-0 w-full h-full object-cover z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-20"></div>

        <div className="relative z-30 p-6 md:p-16 lg:p-[60px]">
          <span className="inline-block px-4 py-1.5 bg-white/15 border border-white/30 rounded-full text-sm text-white">
            Partnership Program
          </span>
        </div>

        <div className="relative z-30 p-6 md:p-16 lg:p-[60px] max-w-[600px]">
          <h1 className="text-[2rem] font-bold text-white mb-4 md:text-[3rem]">
            <span className="text-[#F7C400]">Wingside</span> Hotspot
          </h1>
          <p className="text-sm text-white/90 mb-6 leading-relaxed max-w-[400px]">
            Transform your business into a customer magnet with zero-cost marketing and exclusive perks for your clients.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3.5 bg-[#F7C400] text-gray-900 font-semibold text-sm rounded-full hover:bg-[#EAB308] transition-colors">
              Become a Hotspot Partner
            </button>
            <button className="px-6 py-3.5 bg-gray-900 text-white font-semibold text-sm rounded-full hover:bg-gray-800 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Who Can Become Section */}
      <section className="py-24 px-6 md:py-28 md:px-[60px]" style={{ backgroundColor: '#FFFCF2' }}>
        <div className="w-[80%] mx-auto flex flex-col gap-12 md:flex-row md:items-center md:gap-12">
          <div className="flex-1">
            <h2 className="text-[2.25rem] font-bold text-gray-900 mb-6 leading-[1.1] md:text-[3rem]">
              Who can become<br />a HOTSPOT?
            </h2>
            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              Any business with regular foot traffic can benefit from the Wingside Hotspot program.
            </p>

            <div className="flex flex-wrap gap-3">
              {businessTypes.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm rounded-full font-medium text-[#552627]"
                  style={{ backgroundColor: '#FDEDB2' }}
                >
                  <span className="text-[#552627]">{type.icon}</span>
                  {type.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <img src="/hotspot-qr.png" alt="QR Code" className="max-w-[300px] mb-6 md:max-w-[350px]" />
              <p className="text-base font-semibold text-gray-600 tracking-widest">SCAN · ORDER · ENJOY</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-24 px-6 md:py-28 md:px-[60px]" style={{ backgroundColor: '#FFFCF2' }}>
        <div className="w-[80%] mx-auto">
          <h2 className="text-[1.75rem] font-bold text-gray-900 text-center mb-10 md:text-[2.25rem]">
            What you get?
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 md:px-[60px] pt-24 pb-40 md:pt-28 md:pb-48" style={{ backgroundColor: '#FFFCF2' }}>
        <div className="w-[70%] mx-auto flex flex-col gap-8 md:flex-row md:gap-16">
          <div className="flex-shrink-0">
            <h2 className="text-[2.25rem] font-bold text-gray-900 mb-2 md:text-[3rem]">How it works</h2>
            <p className="text-base text-gray-600">Get started in 4 easy steps</p>
          </div>

          <div className="flex-1 grid grid-cols-1 gap-10 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={index} className="p-0">
                <div className="text-gray-900 mb-3">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Materials Section */}
      <section className="py-24 px-6 md:py-28 md:px-[60px]" style={{ backgroundColor: '#542526' }}>
        <div className="w-[80%] mx-auto flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-[2rem] font-bold text-white mb-8 leading-tight md:text-[2.5rem]">
              Marketing<br />Materials Provided
            </h2>

            <ul className="list-none p-0 m-0">
              {materials.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-base text-white/90 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 flex justify-center -mt-[15%]">
            <img src="/hotspot-materials.jpg" alt="Marketing Materials" className="max-w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-white md:py-20 md:px-[60px]">
        <div className="w-[80%] mx-auto text-center">
          <h2 className="text-[2.25rem] font-bold text-gray-900 mb-6 md:text-[3rem]">
            Ready to Become a Wingside Hotspot?
          </h2>
          <p className="text-base text-gray-600 mb-10 leading-relaxed">
            Join hundreds of successful businesses already benefiting from our partnership program.<br />
            It's free, easy, and profitable.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-[#F7C400] text-gray-900 font-semibold text-base rounded-full hover:bg-[#EAB308] transition-colors"
            >
              Apply now
            </button>
            <Link href="/contact">
              <button className="px-8 py-4 bg-transparent text-gray-900 font-semibold text-base border-2 border-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-colors">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hotspot Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Apply to Become a Hotspot</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                  >
                    <option value="">Select your business type</option>
                    <option value="salon-spa">Salon & Spa</option>
                    <option value="gym-fitness">Gym & Fitness</option>
                    <option value="cafe-lounge">Cafe & Lounge</option>
                    <option value="apartment">Apartment Complex</option>
                    <option value="retail">Retail Store</option>
                    <option value="recreation">Recreation Center</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F7C400] focus:border-transparent"
                    placeholder="Tell us about your business..."
                  />
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-[#F7C400] text-gray-900 font-semibold text-base rounded-full hover:bg-[#EAB308] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
