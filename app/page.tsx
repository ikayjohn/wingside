"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import HeroSlideshow from '@/components/HeroSlideshow';
import { fetchSettings } from '@/lib/settings';

// Structured data for SEO - will be populated with real data
let structuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Wingside",
  "description": "Experience 20 bold wing flavors across 6 categories at Wingside. Your wings, your way.",
  "url": "https://wingside.com",
  "telephone": process.env.NEXT_PUBLIC_CONTACT_PHONE || "+234-809-019-1999",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Port Harcourt",
    "addressCountry": "NG"
  },
  "servesCuisine": "Chicken Wings",
  "priceRange": "$$",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "10:00",
    "closes": "22:00"
  },
  "menu": "https://wingside.com/order",
  "potentialAction": {
    "@type": "OrderAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://wingside.com/order"
    },
    "deliveryMethod": [
      "http://purl.org/goodrelations/v1#DeliveryModePickUp",
      "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
    ]
  }
};

interface Flavor {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  spice_level: number;
  is_active: boolean;
  display_order: number;
  show_on_homepage: boolean;
  available_for_products: boolean;
}

export default function WingsideLanding() {
  const [activeCategory, setActiveCategory] = useState('BBQ');
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeliverySection, setActiveDeliverySection] = useState(0);

  const categories = ['BBQ', 'BOLD & FUN', 'HOT', 'DRY RUB', 'SWEET', 'BOOZY'];

  // Slide data for delivery section
  const deliverySlides = [
    {
      title: 'WINGSIDE\nONLINE DELIVERY',
      description: 'Stay in, we\'ll bring the wings to you. Flavors that sing with every wing Delivered\n- before you blink.',
      ctaText: 'Order Now',
      ctaLink: '/order',
      image: '/bikewingside1.png',
      alt: 'Wingside Delivery'
    },
    {
      title: 'WINGSIDE\nHOTSPOT',
      description: 'Bring the wings to your customers. Any business with regular foot traffic can benefit from the Wingside Hotspot program.',
      ctaText: 'Learn More',
      ctaLink: '/hotspots',
      image: '/post.png',
      alt: 'Wingside Hotspot'
    },
    {
      title: 'WINGSIDE\nKIDS',
      description: 'Building early brand affinity and family loyalty through fun, food, and unforgettable experiences.',
      ctaText: 'Learn More',
      ctaLink: '/kids',
      image: '/kids-hero.png',
      alt: 'Wingside Kids'
    }
  ];

  const currentSlide = deliverySlides[activeDeliverySection % deliverySlides.length];

  // Auto-slide delivery section every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDeliverySection(prev => {
        if (prev >= 3) {
          // Reset to 0 without animation for infinite loop
          return 0;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [setActiveDeliverySection]);

  // Fetch flavors from database on mount
  const fetchFlavors = useCallback(async () => {
    try {
      const response = await fetch('/api/flavors');
      const data = await response.json();
      if (response.ok) {
        setFlavors(data.flavors || []);
      }
    } catch (error) {
      console.error('Error fetching flavors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  // Helper function to parse description into two parts
  const parseDescription = (description: string) => {
    if (!description) return { description1: '', description2: '' };
    const parts = description.split('. ');
    return {
      description1: parts[0] || '',
      description2: parts.slice(1).join('. ') || ''
    };
  };

  // Helper function to render flavor name with smaller iOS-style emojis
  const renderFlavorName = (name: string) => {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const parts = name.split(emojiRegex);

    return parts.map((part, index) => {
      if (part && part.match(emojiRegex)) {
        // Convert emoji to Twemoji CDN image URL
        const codePoint = part.codePointAt(0)?.toString(16);
        const twemojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codePoint}.png`;
        return (
          <img
            key={index}
            src={twemojiUrl}
            alt={part}
            className="inline-block w-[0.8em] h-[0.8em] align-middle mx-0.5"
            style={{ display: 'inline', verticalAlign: '-0.1em' }}
          />
        );
      }
      return part;
    });
  };

  // Filter flavors based on active category and homepage visibility
  const filteredFlavors = flavors.filter(flavor =>
    flavor.category === activeCategory &&
    flavor.show_on_homepage &&
    flavor.image_url
  );

  // Keep empty array - no more hardcoded flavors
  const fallbackFlavors: never[] = [];

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section with Slideshow */}
      <div id="main-content" tabIndex={-1}>
        <HeroSlideshow />


      {/* Think Inside The Box */}
      <section className="relative z-40 py-0 -mt-[50px] sm:-mt-[60px] md:-mt-[80px]">
        {/* Yellow Background */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-gradient-to-br from-yellow-100 to-yellow-100 h-[160px] sm:h-[200px] md:h-[250px] lg:h-[400px] overflow-hidden">
          <img
            src="/yellowpattern.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        </div>
        
        {/* Content */}
        <div className="relative w-full">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center">
            <div className="pl-16 xl:pl-[150px] pr-4 xl:pr-8">
              <h2 className="think-box-text">
                Think Inside<br />
                <span>THE BOX</span>
              </h2>
            </div>
            
            <div className="pr-4 xl:pr-8">
              <img
                src="/thinkarrow.png"
                alt="Arrow"
                className="w-24 xl:w-32 h-auto"
                  />
            </div>

            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-[540px] xl:max-w-[660px] h-auto float-hover"
                  />
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:flex lg:hidden items-center">
            <div className="pl-8 pr-4 flex flex-col gap-2">
              <h2 className="think-box-text">
                Think Inside<br />
                <span>THE BOX</span>
              </h2>
              <img
                src="/thinkarrow.png"
                alt="Arrow"
                className="w-32 h-auto"
                  />
            </div>

            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-[336px] h-auto float-hover"
                  />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center">
            <div className="pl-4 pr-2 flex flex-col gap-1 flex-shrink-0">
              <h2 className="think-box-text">
                Think Inside<br />
                <span>THE BOX</span>
              </h2>
              <img
                src="/thinkarrow.png"
                alt="Arrow"
                className="w-20 h-auto"
                  />
            </div>

            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-[317px] h-auto float-hover"
                  />
            </div>
          </div>
        </div>
      </section>


      {/* Flavors Section */}
      <section className="py-8 md:py-16 gutter-x bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-10">
            <div className="section-badge mb-3 md:mb-4">
              Our Flavors
            </div>
            <h2 className="section-title mb-3 md:mb-4">
              Explore Our Flavors
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed">
              From hot and fiery, to sweet and crispy, every bite an explosion of taste meant to spark unrestrained crave spells.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-5 mb-8 md:mb-12 overflow-x-auto pb-3 scrollbar-hide md:max-w-[80%] md:justify-between">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Flavor Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto mb-4"></div>
                <div className="text-gray-600">Loading flavors...</div>
              </div>
            </div>
          ) : filteredFlavors.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-10">
                {filteredFlavors.map((flavor) => {
                  const { description1, description2 } = parseDescription(flavor.description);
                  return (
                    <div key={flavor.id} className="flavor-card flex flex-col gap-2 md:gap-4 md:grid md:grid-cols-2 md:items-center md:max-w-[80%]">
                      <div className="order-2 md:order-1 md:ml-[30px]">
                        <h3 className="text-lg sm:text-xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-4">{renderFlavorName(flavor.name)}</h3>
                        <p className="text-gray-600 text-xs md:text-lg mb-1 md:mb-1 font-semibold">
                          {description1}
                        </p>
                        <p className="text-gray-600 text-xs md:text-lg mb-2 md:mb-6">
                          {description2}
                        </p>
                        <div className="hidden md:flex gap-2">
                          <Link href="/order" className="flavor-order-btn text-xs md:text-sm">
                            Order Now
                          </Link>
                          <Link href={`/flavors/${flavor.id}`} className="flavor-learn-more-btn text-xs md:text-sm">
                            Learn More
                          </Link>
                        </div>
                      </div>
                      <div className="order-1 md:order-2 flex justify-center md:block md:ml-[80px]">
                        <img
                          src={flavor.image_url}
                          alt={flavor.name}
                          className="w-auto h-[100px] sm:h-[120px] md:h-[260px] lg:h-[360px] flavor-image"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Order Now Button */}
              <div className="mt-8 md:hidden">
                <Link href="/order" className="btn-primary w-full text-center py-4 text-lg inline-block">
                  Order Now
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-base">No flavors available in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Delivery Section */}
      <section className="bg-white overflow-hidden" style={{ paddingTop: '90px', paddingBottom: '100px' }}>
        {/* Yellow rounded box - 95% width on mobile, 80% on larger screens, centered */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-[95%] sm:w-[80%]" style={{ maxWidth: '1200px' }}>
          {/* Header section above yellow box */}
          <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Title */}
            <div>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold whitespace-pre-line"
                style={{ color: '#552627', letterSpacing: '-1px', lineHeight: '1.1' }}
              >
                {currentSlide.title}
              </h2>
            </div>

            {/* Right: Description and CTA */}
            <div className="text-left md:text-right flex flex-col items-end">
              <p className="text-sm md:text-base text-gray-700 mb-3 text-right" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', maxWidth: '350px', width: '100%' }}>
                {currentSlide.description}
              </p>
              <Link
                href={currentSlide.ctaLink}
                className="inline-block text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: '#5D3131',
                  padding: '12px 32px',
                  borderRadius: '50px',
                  fontSize: '15px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5D3131'}
              >
                {currentSlide.ctaText}
              </Link>
            </div>
          </div>

          <div
            className="rounded-3xl relative"
            style={{
              backgroundColor: '#FFD700',
              borderRadius: '24px',
              height: '450px'
            }}
          >
            {/* Carousel Container */}
            <div className="relative" style={{ height: '450px', overflow: 'visible' }}>
            {/* Section 1: Online Delivery */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out"
              style={{
                opacity: activeDeliverySection === 0 || activeDeliverySection === 3 ? 1 : 0,
                zIndex: activeDeliverySection === 0 || activeDeliverySection === 3 ? 10 : 0
              }}
            >
              <img
                src={deliverySlides[0].image}
                alt={deliverySlides[0].alt}
                className="max-h-[425px] sm:max-h-[340px] md:max-h-[450px] lg:max-h-[580px] w-auto object-contain mt-[85px] sm:mt-[-30px] md:mt-[-100px] lg:mt-[-195px]"
              />
            </div>

            {/* Section 2: Hotspot */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out"
              style={{
                opacity: activeDeliverySection === 1 ? 1 : 0,
                zIndex: activeDeliverySection === 1 ? 10 : 0
              }}
            >
              <img
                src={deliverySlides[1].image}
                alt={deliverySlides[1].alt}
                className="max-h-[425px] sm:max-h-[340px] md:max-h-[450px] lg:max-h-[580px] w-auto object-contain mt-[85px] sm:mt-[-30px] md:mt-[-100px] lg:mt-[-195px]"
              />
            </div>

            {/* Section 3: Kids */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out"
              style={{
                opacity: activeDeliverySection === 2 ? 1 : 0,
                zIndex: activeDeliverySection === 2 ? 10 : 0
              }}
            >
              <img
                src={deliverySlides[2].image}
                alt={deliverySlides[2].alt}
                className="max-h-[425px] sm:max-h-[340px] md:max-h-[450px] lg:max-h-[580px] w-auto object-contain mt-[85px] sm:mt-[-30px] md:mt-[-100px] lg:mt-[-195px]"
              />
            </div>

            {/* Clone of Section 1 for infinite loop */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out"
              style={{
                opacity: activeDeliverySection === 3 ? 1 : 0,
                zIndex: activeDeliverySection === 3 ? 10 : 0
              }}
            >
              <img
                src={deliverySlides[0].image}
                alt={deliverySlides[0].alt}
                className="max-h-[425px] sm:max-h-[340px] md:max-h-[450px] lg:max-h-[580px] w-auto object-contain mt-[85px] sm:mt-[-30px] md:mt-[-100px] lg:mt-[-195px]"
              />
            </div>
          </div>

          {/* Navigation - Dots on left, Arrows on right */}
          <div className="flex justify-between items-center mt-6" style={{ position: 'relative', zIndex: 25 }}>
            {/* Dot Indicators - Left */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveDeliverySection(0)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeDeliverySection === 0 || activeDeliverySection === 3 ? 'bg-[#5D3131] w-8' : 'bg-gray-300'}`}
                aria-label="Go to delivery section"
              />
              <button
                onClick={() => setActiveDeliverySection(1)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeDeliverySection === 1 ? 'bg-[#5D3131] w-8' : 'bg-gray-300'}`}
                aria-label="Go to hotspot section"
              />
              <button
                onClick={() => setActiveDeliverySection(2)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeDeliverySection === 2 ? 'bg-[#5D3131] w-8' : 'bg-gray-300'}`}
                aria-label="Go to kids section"
              />
            </div>

            {/* Navigation Arrows - Right */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (activeDeliverySection === 0) {
                    setActiveDeliverySection(2);
                  } else {
                    setActiveDeliverySection(activeDeliverySection - 1);
                  }
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                style={{ backgroundColor: '#5D3131' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                onClick={() => {
                  if (activeDeliverySection >= 2) {
                    setActiveDeliverySection(3);
                    setTimeout(() => setActiveDeliverySection(0), 700);
                  } else {
                    setActiveDeliverySection(activeDeliverySection + 1);
                  }
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                style={{ backgroundColor: '#5D3131' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Wingclub Section */}
      <section className="py-8 md:py-16 bg-white" style={{ paddingTop: '180px' }}>
        <div className="wc-container">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 md:mb-8">
            <div>
              <div className="section-badge mb-2 md:mb-3">
                Eat & Earn
              </div>
              <h2 className="section-title mb-2 md:mb-3 leading-tight">
                Enjoy Exclusive Benefits<br />
                When You Join The <span className="text-yellow-400">WINGCLUB</span>
              </h2>
              <p className="text-gray-600 text-sm md:text-lg">Get on our side, Get Rewarded.</p>
            </div>

            <Link href="/wingclub" className="btn-primary inline-block mt-4 md:mt-0 px-6 py-3 text-sm md:text-base">
              Join the wingclub
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <div className="wc-card-img">
              <img src="/wc1.png" alt="Members Discount" className="w-full h-full object-cover" />
            </div>
            <div className="wc-card-img">
              <img src="/wc2.png" alt="Points" className="w-full h-full object-cover" />
            </div>
            <div className="wc-card-img">
              <img src="/wc3.png" alt="Gift" className="w-full h-full object-cover" />
            </div>
            <div className="wc-card-img">
              <img src="/wc4.png" alt="Birthday Wings" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}