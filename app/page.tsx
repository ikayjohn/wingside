"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function WingsideLanding() {
  const [activeCategory, setActiveCategory] = useState('BBQ');

  const categories = ['BBQ', 'HOT', 'SPICY DRY', 'BOLD & FUN', 'SWEET', 'BOOZY'];

  // Flavors data
  const flavors = [
    {
      id: 1,
      name: 'BBQ FIRE',
      category: 'BBQ',
      description1: 'BBQ Sauce & Chili peppers.',
      description2: 'A fusion as epic as hell of flame & spicy.',
      image: '/flavor-bbqfire.png'
    },
    {
      id: 2,
      name: 'BBQ RUSH',
      category: 'BBQ',
      description1: 'BBQ Sauce & Honey.',
      description2: 'Enjoy a drip.',
      image: '/flavor-bbqrush.png'
    },
    {
      id: 3,
      name: 'DRAGON BREATH',
      category: 'HOT',
      description1: 'Classic hot sauce.',
      description2: 'Turn up the heat.',
      image: '/flavor-dragon.png'
    },
    {
      id: 4,
      name: 'BRAVEHEART',
      category: 'HOT',
      description1: 'Classic hot sauce.',
      description2: 'Turn up the heat.',
      image: '/flavor-brave.png'
    },
    {
      id: 5,
      name: 'LEMON PEPPER',
      category: 'SPICY DRY',
      description1: 'Dry spice rub.',
      description2: 'All spice, no sauce.',
      image: '/flavor-lemon.png'
    },
    {
      id: 6,
      name: 'CAMEROON RUB',
      category: 'SPICY DRY',
      description1: 'Dry spice rub.',
      description2: 'All spice, no sauce.',
      image: '/flavor-cameroon.png'
    },
    {
      id: 7,
      name: 'CARIBBEAN JERK',
      category: 'SPICY DRY',
      description1: 'Dry spice rub.',
      description2: 'All spice, no sauce.',
      image: '/flavor-caribbean.png'
    },
    {
      id: 8,
      name: 'WING OF THE NORTH',
      category: 'BOLD & FUN',
      description1: 'Adventurous mix.',
      description2: 'For the daring.',
      image: '/flavor-wingnorth.png'
    },
    {
      id: 9,
      name: 'THE ITALIAN',
      category: 'BOLD & FUN',
      description1: 'Adventurous mix.',
      description2: 'For the daring.',
      image: '/flavor-italian.png'
    },
    {
      id: 10,
      name: 'TOKYO',
      category: 'BOLD & FUN',
      description1: 'Adventurous mix.',
      description2: 'For the daring.',
      image: '/flavor-tokyo.png'
    },
    {
      id: 11,
      name: 'SWEET DREAMS',
      category: 'SWEET',
      description1: 'Sweet glaze.',
      description2: 'Perfect balance.',
      image: '/flavor-sweetdreams.png'
    },
    {
      id: 12,
      name: 'MANGO HEAT',
      category: 'SWEET',
      description1: 'Sweet glaze.',
      description2: 'Perfect balance.',
      image: '/flavor-mango.png'
    },
    {
      id: 13,
      name: 'TEQUILA WINGRISE',
      category: 'BOOZY',
      description1: 'Infused with spirits.',
      description2: 'Adult flavors.',
      image: '/flavor-tequila.png'
    }
  ];

  // Filter flavors based on active category
  const filteredFlavors = flavors.filter(flavor => flavor.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section with Video Background */}
      <section className="hero-video-section">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hero-video"
        >
          <source src="/wingbanner.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay */}
        <div className="hero-overlay"></div>
        
        {/* Hero Content */}
        <div className="hero-content">
          <h1 className="hero-video-title">
            <span className="text-white">Where </span>
            <span className="text-yellow-400">Flavor</span>
            <span className="text-white"> takes </span>
            <span className="text-yellow-400">Flight</span>
          </h1>
          <p className="hero-video-subtitle">
            Your <span className="italic">wings</span>, Your <span className="italic">way</span>
          </p>
          <p className="hero-video-description">
            20 bold flavors, endless cravings. Ready to take off?
          </p>
        </div>
      </section>


      {/* Think Inside The Box */}
      <section className="relative py-6 md:py-10 lg:py-12">
        {/* Yellow Background */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-gradient-to-br from-yellow-100 to-yellow-100 h-[180px] sm:h-[250px] md:h-[300px] lg:h-[400px] overflow-hidden">
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
                className="w-full max-w-md xl:max-w-xl h-auto float-hover"
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
                className="w-full max-w-xs h-auto float-hover"
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
                className="w-full max-w-[150px] h-auto float-hover"
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
            {filteredFlavors.length > 0 ? (
              filteredFlavors.map((flavor) => (
                <div key={flavor.id} className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">{flavor.name}</h3>
                    <p className="text-gray-600 text-sm md:text-lg mb-1 font-semibold">
                      {flavor.description1}
                    </p>
                    <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6">
                      {flavor.description2}
                    </p>
                    <Link href="/order" className="btn-outline inline-block">
                      Order Now
                    </Link>
                  </div>
                  <div className="order-1 md:order-2">
                    <img 
                      src={flavor.image} 
                      alt={flavor.name} 
                      className="w-auto h-[200px] md:h-[300px] lg:h-[400px] flavor-image"
                    />
                  </div>
                </div>
              ))
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
            <p className="text-base md:text-xl font-semibold uppercase" style={{ color: '#552627' }}>
              CORE BUSINESS
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Delivery Image */}
            <div className="flex justify-center md:justify-start">
              <img 
                src="/bikewingside1.png" 
                alt="Wingside Delivery" 
                className="w-full max-w-xs md:max-w-md h-auto"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: '#552627' }}>
                WINGSIDE<br />
                ONLINE DELIVERY
              </h2>
              <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">
                Stay in. We'll bring the wings to you.<br />
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

            <Link href="/my-account" className="btn-primary inline-block mt-4 md:mt-0 px-6 py-3 text-sm md:text-base">
              Join the wingclub
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            <div className="wc-card-img">
              <img src="/wc1.png" alt="Members Discount" />
            </div>
            <div className="wc-card-img">
              <img src="/wc2.png" alt="Points" />
            </div>
            <div className="wc-card-img">
              <img src="/wc3.png" alt="Gift" />
            </div>
            <div className="wc-card-img">
              <img src="/wc4.png" alt="Birthday Wings" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}