"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroSlideshow from '@/components/HeroSlideshow';

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
  const [activeCategory, setActiveCategory] = useState('HOT');
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['HOT', 'BBQ', 'DRY RUB', 'BOLD & FUN', 'SWEET', 'BOOZY'];

  // Fetch flavors from database on mount
  useEffect(() => {
    fetchFlavors();
  }, []);

  async function fetchFlavors() {
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
  }

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

      {/* Hero Section with Slideshow */}
      <HeroSlideshow />


      {/* Think Inside The Box */}
      <section className="relative py-0 -mt-[80px]">
        {/* Yellow Background */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-gradient-to-br from-yellow-100 to-yellow-100 h-[180px] sm:h-[250px] md:h-[300px] lg:h-[400px] overflow-hidden">
          <img
            src="/yellowpattern.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            loading="eager"
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
                loading="eager"
              />
            </div>
            
            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-md xl:max-w-xl h-auto float-hover"
                loading="eager"
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
                loading="eager"
              />
            </div>
            
            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-xs h-auto float-hover"
                loading="eager"
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
                loading="eager"
              />
            </div>
            
            <div className="flex-1 flex justify-end">
              <img
                src="/thinkbox.png"
                alt="Wingside Box"
                className="w-full max-w-[150px] h-auto float-hover"
                loading="eager"
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
            <h2 className="section-title mb-1">
              20 Amazing Flavors, 6 categories.
            </h2>
            <p className="section-title mb-3 md:mb-4">
              Infinite Cravings.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed">
              From hot and fiery, to sweet and crispy, every bite an explosion of taste meant to spark unrestrained crave spells.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 md:mb-12 overflow-x-auto pb-3 scrollbar-hide">
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
          <div className="space-y-6 md:space-y-10">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto mb-4"></div>
                  <div className="text-gray-600">Loading flavors...</div>
                </div>
              </div>
            ) : filteredFlavors.length > 0 ? (
              filteredFlavors.map((flavor) => {
                const { description1, description2 } = parseDescription(flavor.description);
                return (
                  <div key={flavor.id} className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                    <div className="order-2 md:order-1">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">{renderFlavorName(flavor.name)}</h3>
                      <p className="text-gray-600 text-sm md:text-lg mb-1 font-semibold">
                        {description1}
                      </p>
                      <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6">
                        {description2}
                      </p>
                      <Link href="/order" className="btn-outline inline-block">
                        Order Now
                      </Link>
                    </div>
                    <div className="order-1 md:order-2">
                      <img
                        src={flavor.image_url}
                        alt={flavor.name}
                        className="w-auto h-[200px] md:h-[300px] lg:h-[400px] flavor-image"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base">No flavors available in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="py-8 md:py-16 gutter-x bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <hr></hr>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Delivery Image */}
            <div className="flex justify-center md:justify-start">
              <img
                src="/bikewingside1.png"
                alt="Wingside Delivery"
                className="w-full max-w-xs md:max-w-md h-auto"
                loading="lazy"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: '#552627' }}>
                WINGSIDE<br />
                ONLINE DELIVERY
              </h2>
              <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">
                Stay in. We&apos;ll bring the wings to you.<br />
                Flavors that sing with every wing Delivered before you blink.
              </p>
              <Link 
                href="/order"
                className="delivery-btn"
              >
                Order Now
              </Link>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-end gap-3 mt-8 md:mt-12">
            <button className="arrow-nav-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className="arrow-nav-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Wingclub Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="wc-container">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 md:mb-8">
            <div>
              <h2 className="section-title mb-2 md:mb-3 leading-tight">
                Enjoy huge discounts by<br />
                joining the <span className="text-yellow-400">WINGCLUB</span>
              </h2>
              <p className="text-gray-600 text-sm md:text-lg">Get on our side, Get Rewarded.</p>
            </div>

            <Link href="/wingclub" className="btn-primary inline-block mt-4 md:mt-0 px-6 py-3 text-sm md:text-base">
              Join the wingclub
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <div className="wc-card-img">
              <img src="/wc1.png" alt="Members Discount" loading="lazy" />
            </div>
            <div className="wc-card-img">
              <img src="/wc2.png" alt="Points" loading="lazy" />
            </div>
            <div className="wc-card-img">
              <img src="/wc3.png" alt="Gift" loading="lazy" />
            </div>
            <div className="wc-card-img">
              <img src="/wc4.png" alt="Birthday Wings" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}