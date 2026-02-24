"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/client/csrf';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'suggestion'>('faq');
  const [activeCategory, setActiveCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [flavorForm, setFlavorForm] = useState({ submitterName: '', submitterEmail: '', name: '', description: '', spiceLevel: '', inspiration: '' });
  const [flavorSubmitted, setFlavorSubmitted] = useState(false);
  const [flavorSubmitting, setFlavorSubmitting] = useState(false);
  const [flavorError, setFlavorError] = useState('');
  const [flavorModalOpenTime, setFlavorModalOpenTime] = useState(0);

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherForm, setOtherForm] = useState({ name: '', email: '', message: '' });
  const [otherSubmitted, setOtherSubmitted] = useState(false);
  const [otherSubmitting, setOtherSubmitting] = useState(false);
  const [otherError, setOtherError] = useState('');
  const [otherModalOpenTime, setOtherModalOpenTime] = useState(0);

  const faqCategories = [
    'General',
    'Wingside Business',
    'Partnership',
    'Flavors',
    'Rewards',
    'Wingclub',
    'Other',
  ];

  const faqData: Record<string, { question: string; answer: string }[]> = {
    General: [
      { question: 'How do I order for wings?', answer: 'You can order wings through our website or mobile app. Simply browse our menu, select your preferred flavors and sizes, add to cart, and checkout.' },
      { question: 'What are the available flavors for wings?', answer: 'We offer 20 unique flavors across 6 categories including BBQ, Hot, Spicy Dry, Bold & Fun, Sweet, and Boozy.' },
      { question: 'Can I customize my wing order?', answer: 'Yes! You can customize your order by selecting different flavors, sizes, and add-ons to suit your taste.' },
      { question: 'Is there a minimum order for wings?', answer: 'The minimum order is 6 pieces of wings. Larger pack sizes are available for better value.' },
      { question: 'Do you offer any wing specials?', answer: 'Yes, we regularly have specials and promotions. Check our app or website for current deals.' },
      { question: 'How long does it take for wings to be ready?', answer: 'Typically 20-30 minutes for pickup orders. Delivery times may vary based on location.' },
      { question: 'Can I order wings for delivery?', answer: 'Yes, we offer delivery within our service areas. Delivery is free on orders above a certain amount.' },
    ],
    'Wingside Business': [
      { question: 'How can I partner with Wingside?', answer: 'Visit our Partnership page or contact our business team to discuss partnership opportunities.' },
      { question: 'Do you offer catering services?', answer: 'Yes, we offer catering for events of all sizes. Contact us for custom packages.' },
    ],
    Partnership: [
      { question: 'What is the Hotspot program?', answer: 'The Hotspot program allows businesses to earn commissions by hosting Wingside QR codes at their locations.' },
      { question: 'How do I become a Hotspot partner?', answer: 'Apply through our Hotspots page. Our team will review your application within 48 hours.' },
    ],
    Flavors: [
      { question: 'What are your most popular flavors?', answer: 'Our top flavors include Lemon Pepper, Honey BBQ, Buffalo Hot, and Dragon Breath.' },
      { question: 'Do you have spicy options?', answer: 'Yes! We have multiple spice levels from mild to extremely hot.' },
    ],
    Rewards: [
      { question: 'How do I earn points?', answer: 'Earn points on every order as a Wingclub member. Points can be converted to cash rewards.' },
      { question: 'How do I redeem my rewards?', answer: 'Redeem rewards directly in the app or at checkout on our website.' },
    ],
    Wingclub: [
      { question: 'What is Wingclub?', answer: 'Wingclub is our free loyalty program that turns your cravings into currency! Earn points on every order and redeem them for rewards, discounts, and exclusive perks.' },
      { question: 'How do I join Wingclub?', answer: 'Simply click "Get Started" on our Wingclub page or sign up through our website. Registration is completely free and you\'ll start earning points immediately!' },
      { question: 'How much does it cost to join?', answer: 'Absolutely nothing! Zilch! It\'s completely free to join. In fact, you get 10% off your first order just for signing up.' },
      { question: 'How do I earn points?', answer: 'Earn 1 point for every ₦100 spent on all orders. Points are automatically added to your account after each completed purchase.' },
      { question: 'What can I do with my points?', answer: 'Convert your points to wallet credit at ₦10 per point! For example, 100 points = ₦1,000. There\'s no limit to how many points you can earn or redeem.' },
      { question: 'What are the membership tiers?', answer: 'We have three tiers: Wing Member (0-5,000 points), Wing Leader (5,001-20,000 points), and Wingzard (20,000+ points). Higher tiers unlock exclusive perks like birthday rewards and free delivery.' },
      { question: 'How do I check my points balance?', answer: 'Log into your account dashboard to see your total points, current tier, and tier progress in real-time.' },
      { question: 'Can I refer friends?', answer: 'Yes! Share your unique referral code from your dashboard. You\'ll earn points when your friends sign up and make their first purchase.' },
      { question: 'Do points expire?', answer: 'Your points are valid for 12 months from the date earned. Keep ordering to keep them active!' },
      { question: 'What purchases earn points?', answer: 'All paid orders earn points - pickup, delivery, and dine-in. Points are calculated on the order total (excluding fees and taxes).' },
      { question: 'Do I get a welcome bonus?', answer: 'Yes! New members get 10% off their first order. Plus, Wing Members get ₦3,000 off their 10th purchase!' },
      { question: 'How do I redeem points?', answer: 'Go to your dashboard and click "Convert Points" to redeem your points for wallet credit. Minimum redemption is 100 points (₦1,000).' },
      { question: 'Can I have multiple accounts?', answer: 'No, each person can only have one Wingclub account. Multiple accounts may be suspended.' },
      { question: 'How do I cancel my membership?', answer: 'You can close your account from your profile page in the dashboard. Note that all unused points will be forfeited upon cancellation.' },
      { question: 'Is my information secure?', answer: 'Absolutely! We never share your personal data with third parties. Your information is only used to manage your loyalty account and for order processing. See our privacy policy for details.' },
      { question: 'How will I know about promotions?', answer: 'We\'ll notify you via email and in-app notifications about exclusive promotions, new rewards, and special events. No spam, we promise!' },
      { question: 'Got more questions?', answer: 'Contact us through our support page and we\'ll get back to you as soon as possible. Participation in Wingclub is subject to our full terms and conditions.' },
    ],
    Other: [
      { question: 'Do you have allergen information?', answer: 'Yes, allergen information is available for all menu items. Check individual product pages or ask our staff.' },
      { question: 'What payment methods do you accept?', answer: 'We accept cards, bank transfers, and mobile payments.' },
    ],
  };

  const contactOptions = [
    { title: 'Contact My Local Wingside Store?', link: '/contact' },
    { title: 'Customer Assist', link: '/contact' },
  ];

  const suggestionOptions = [
    { title: 'Recommend a Flavor', action: () => { setFlavorForm({ submitterName: '', submitterEmail: '', name: '', description: '', spiceLevel: '', inspiration: '' }); setFlavorSubmitted(false); setFlavorError(''); setFlavorModalOpenTime(Date.now()); setShowFlavorModal(true); } },
    { title: 'Other', action: () => { setOtherForm({ name: '', email: '', message: '' }); setOtherSubmitted(false); setOtherError(''); setOtherModalOpenTime(Date.now()); setShowOtherModal(true); } },
  ];

  const filteredFaqs = faqData[activeCategory]?.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="support-hero">
        <div className="support-hero-content">
          <h1 className="support-hero-title">
            <span className="text-yellow-400">Customer</span> Support
          </h1>
          <p className="support-hero-subtitle">We're always here for you.</p>
          <p className="support-hero-description">
            At Wingside, your experience matters to us. Whether you have a question, feedback, or need support, our team is ready to help. Reach out anytime, we'd love to hear from you.
          </p>
          <button className="support-hero-btn">Find A Store</button>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="support-tabs-section">
        <div className="support-tabs-container">
          <button
            className={`support-tab ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            Frequently Asked Question
          </button>
          <button
            className={`support-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contact Support
          </button>
          <button
            className={`support-tab ${activeTab === 'suggestion' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestion')}
          >
            Make a Suggestion
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="support-content-section">
        <div className="support-content-container">

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="support-faq-layout">
              {/* Categories Sidebar */}
              <div className="support-faq-sidebar">
                {faqCategories.map((category) => (
                  <button
                    key={category}
                    className={`support-category-btn ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* FAQ Content */}
              <div className="support-faq-content">
                {/* Search Bar */}
                <div className="support-search-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="support-search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by topic or keywords"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="support-search-input"
                  />
                </div>

                {/* FAQ List */}
                <div className="support-faq-list">
                  {filteredFaqs.map((faq, index) => (
                    <FaqItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Support Tab */}
          {activeTab === 'contact' && (
            <div className="support-contact-content">
              <h2 className="support-section-title">How can we help you?</h2>
              <div className="support-options-list">
                {contactOptions.map((option, index) => (
                  <Link key={index} href={option.link} className="support-option-card">
                    <span>{option.title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Make a Suggestion Tab */}
          {activeTab === 'suggestion' && (
            <div className="support-suggestion-content">
              <h2 className="support-section-title">Got a suggestion? Let's hear it!</h2>
              <div className="support-options-list">
                {suggestionOptions.map((option, index) => (
                  <button key={index} onClick={option.action} className="support-option-card w-full text-left">
                    <span>{option.title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Flavor Suggestion Modal */}
      {showFlavorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowFlavorModal(false)}
              className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>

            {flavorSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#F7C400] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#552627] mb-2">Thanks for the idea!</h3>
                <p className="text-gray-600 mb-6">We've received your flavor suggestion and our team will look into it. Who knows — it might end up on the menu!</p>
                <button
                  onClick={() => setShowFlavorModal(false)}
                  className="bg-[#F7C400] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-[#552627] mb-1">Suggest a Flavor</h3>
                <p className="text-gray-500 text-sm mb-6">Got a wild idea for a new wing flavor? Tell us everything.</p>

                {flavorError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{flavorError}</div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Chidi Okeke"
                        value={flavorForm.submitterName}
                        onChange={(e) => setFlavorForm({ ...flavorForm, submitterName: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Your Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={flavorForm.submitterEmail}
                        onChange={(e) => setFlavorForm({ ...flavorForm, submitterEmail: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Flavor Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Mango Habanero"
                      value={flavorForm.name}
                      onChange={(e) => setFlavorForm({ ...flavorForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Describe the Flavor</label>
                    <textarea
                      placeholder="What does it taste like? What makes it special?"
                      value={flavorForm.description}
                      onChange={(e) => setFlavorForm({ ...flavorForm, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Spice Level</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Mild', 'Medium', 'Hot', 'Extra Hot'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setFlavorForm({ ...flavorForm, spiceLevel: level })}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                            flavorForm.spiceLevel === level
                              ? 'bg-[#F7C400] border-[#F7C400] text-black'
                              : 'border-gray-200 text-gray-600 hover:border-[#F7C400]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">What inspired this?</label>
                    <input
                      type="text"
                      placeholder="e.g. A sauce I tried in Lagos"
                      value={flavorForm.inspiration}
                      onChange={(e) => setFlavorForm({ ...flavorForm, inspiration: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>
                </div>

                {/* Hidden honeypot */}
                <input type="text" name="website" style={{ display: 'none' }} readOnly value="" />

                <button
                  onClick={async () => {
                    if (!flavorForm.submitterName.trim() || !flavorForm.submitterEmail.trim() || !flavorForm.name.trim()) return;
                    setFlavorSubmitting(true);
                    setFlavorError('');
                    try {
                      const res = await fetchWithCsrf('/api/contact', {
                        method: 'POST',
                        body: JSON.stringify({
                          type: 'flavor-suggestion',
                          name: flavorForm.submitterName,
                          email: flavorForm.submitterEmail,
                          message: flavorForm.description || undefined,
                          website: '',
                          _timestamp: flavorModalOpenTime,
                          formData: {
                            flavorName: flavorForm.name,
                            description: flavorForm.description,
                            spiceLevel: flavorForm.spiceLevel,
                            inspiration: flavorForm.inspiration,
                            source: 'support_page',
                          },
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Submission failed');
                      setFlavorSubmitted(true);
                    } catch (err: any) {
                      setFlavorError(err.message || 'Something went wrong. Please try again.');
                    } finally {
                      setFlavorSubmitting(false);
                    }
                  }}
                  disabled={!flavorForm.submitterName.trim() || !flavorForm.submitterEmail.trim() || !flavorForm.name.trim() || flavorSubmitting}
                  className="mt-6 w-full bg-[#F7C400] text-black py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {flavorSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Other Suggestion Modal */}
      {showOtherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowOtherModal(false)}
              className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>

            {otherSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#F7C400] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#552627] mb-2">Got it, thanks!</h3>
                <p className="text-gray-600 mb-6">We've received your suggestion. Our team reviews all feedback and we appreciate you taking the time.</p>
                <button
                  onClick={() => setShowOtherModal(false)}
                  className="bg-[#F7C400] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-[#552627] mb-1">Share a Suggestion</h3>
                <p className="text-gray-500 text-sm mb-6">Have an idea to make Wingside better? We're all ears.</p>

                {otherError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{otherError}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Amara Nwosu"
                      value={otherForm.name}
                      onChange={(e) => setOtherForm({ ...otherForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={otherForm.email}
                      onChange={(e) => setOtherForm({ ...otherForm, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Suggestion <span className="text-red-500">*</span></label>
                    <textarea
                      placeholder="Tell us what's on your mind — menu ideas, service improvements, anything!"
                      value={otherForm.message}
                      onChange={(e) => setOtherForm({ ...otherForm, message: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400] resize-none"
                    />
                  </div>
                </div>

                {/* Hidden honeypot */}
                <input type="text" name="website" style={{ display: 'none' }} readOnly value="" />

                <button
                  onClick={async () => {
                    if (!otherForm.name.trim() || !otherForm.email.trim() || !otherForm.message.trim()) return;
                    setOtherSubmitting(true);
                    setOtherError('');
                    try {
                      const res = await fetchWithCsrf('/api/contact', {
                        method: 'POST',
                        body: JSON.stringify({
                          type: 'suggestion',
                          name: otherForm.name,
                          email: otherForm.email,
                          message: otherForm.message,
                          website: '',
                          _timestamp: otherModalOpenTime,
                          formData: { source: 'support_page' },
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Submission failed');
                      setOtherSubmitted(true);
                    } catch (err: any) {
                      setOtherError(err.message || 'Something went wrong. Please try again.');
                    } finally {
                      setOtherSubmitting(false);
                    }
                  }}
                  disabled={!otherForm.name.trim() || !otherForm.email.trim() || !otherForm.message.trim() || otherSubmitting}
                  className="mt-6 w-full bg-[#F7C400] text-black py-3 rounded-full font-semibold hover:bg-[#e5b500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {otherSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// FAQ Item Component with Accordion
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="support-faq-item">
      <button
        className="support-faq-question"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`support-faq-arrow ${isOpen ? 'open' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className="support-faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
