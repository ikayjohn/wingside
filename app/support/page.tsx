"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'suggestion'>('faq');
  const [activeCategory, setActiveCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    'General',
    'Wingside Business',
    'Partnership',
    'Flavours',
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
    Flavours: [
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
      { question: 'How do I earn points?', answer: 'Earn 10 points for every ₦100 spent on all orders. Points are automatically added to your account after each completed purchase.' },
      { question: 'What can I do with my points?', answer: 'Redeem ₦3,000 for every 500 points earned! There\'s no limit to how many points you can earn or redeem.' },
      { question: 'What are the membership tiers?', answer: 'We have three tiers: Wing Member (0-1,000 points), Wing Leader (1,001-2,000 points), and Wingzard (2,500+ points). Higher tiers unlock exclusive perks like birthday rewards and free delivery.' },
      { question: 'How do I check my points balance?', answer: 'Log into your account dashboard to see your total points, current tier, and tier progress in real-time.' },
      { question: 'Can I refer friends?', answer: 'Yes! Share your unique referral code from your dashboard. You\'ll earn points when your friends sign up and make their first purchase.' },
      { question: 'Do points expire?', answer: 'Your points are valid for 12 months from the date earned. Keep ordering to keep them active!' },
      { question: 'What purchases earn points?', answer: 'All paid orders earn points - pickup, delivery, and dine-in. Points are calculated on the order total (excluding fees and taxes).' },
      { question: 'Do I get a welcome bonus?', answer: 'Yes! New members get 10% off their first order. Plus, Wing Members get ₦3,000 off their 10th purchase!' },
      { question: 'How do I redeem points?', answer: 'Go to your dashboard and click "Convert Points" to redeem your points for wallet credit. Minimum redemption is 500 points.' },
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
    { title: 'Contact My Local Wingside Store?', link: '/locations' },
    { title: 'Customer Assist', link: '/contact' },
  ];

  const suggestionOptions = [
    { title: 'Recommend a flavour', link: '/suggest-flavor' },
    { title: 'Other', link: '/suggest-other' },
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
            At Wingside, your experience matters to us. Whether you have a question, feedback, or need support, our team is ready to help. Reach out anytime — we'd love to hear from you.
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

        </div>
      </section>

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
