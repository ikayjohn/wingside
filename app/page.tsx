"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function WingsideLanding() {
  const [activeCategory, setActiveCategory] = useState('HOT');

  const categories = ['HOT', 'BBQ', 'SPICY DRY', 'BOLD & FUN', 'SWEET', 'BOOZY'];

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

  // Flavors data
  const flavors = [
    // HOT
    {
      id: 1,
      name: 'WINGFERNO 🌶️🌶️🌶️🌶️',
      category: 'HOT',
      description1: 'Piping hot peppers',
      description2: 'Something special for the insane…',
      image: '/flavor-wingferno.png'
    },
    {
      id: 2,
      name: 'DRAGON BREATH 🌶️🌶️🌶️',
      category: 'HOT',
      description1: 'Hot peppers & more hot peppers',
      description2: 'Draaaagon!!! Your mushroom clouds will come for all of us…',
      image: '/flavor-dragon.png'
    },
    {
      id: 3,
      name: 'BRAVEHEART 🌶️🌶️',
      category: 'HOT',
      description1: 'Habaneros & hot chili',
      description2: 'Feel the heat, feel the burn.',
      image: '/flavor-brave.png'
    },
    {
      id: 4,
      name: 'MANGO HEAT 🌶️',
      category: 'HOT',
      description1: 'Mango purée & hot peppers',
      description2: 'All sweet, all heat…',
      image: '/flavor-mango.png'
    },
    // BOLD & FUN
    {
      id: 5,
      name: 'ITALIAN',
      category: 'BOLD & FUN',
      description1: 'Garlic & cheese',
      description2: 'The ideal choice for sophisticated palates',
      image: '/flavor-italian.png'
    },
    {
      id: 6,
      name: 'WING OF THE NORTH',
      category: 'BOLD & FUN',
      description1: 'Spicy dates & dates',
      description2: 'Dont ask, dont tell',
      image: '/flavor-wingnorth.png'
    },
    {
      id: 7,
      name: 'TOKYO',
      category: 'BOLD & FUN',
      description1: 'Soy sauce & sweet chili',
      description2: 'From Asia with love',
      image: '/flavor-tokyo.png'
    },
    {
      id: 8,
      name: 'HOT NUTS',
      category: 'BOLD & FUN',
      description1: 'Peanuts & hot chili',
      description2: 'Delicious amazingness',
      image: '/flavor-hotnuts.png'
    },
    {
      id: 9,
      name: 'YAJI',
      category: 'BOLD & FUN',
      description1: 'Its in the name',
      description2: 'Born and raised in Nigeria',
      image: '/flavor-yaji.png'
    },
    {
      id: 10,
      name: 'THE SLAYER',
      category: 'BOLD & FUN',
      description1: 'Garlic & herbs',
      description2: 'Keeps the vampires away…',
      image: '/flavor-slayer.png'
    },
    // BBQ
    {
      id: 11,
      name: 'BBQ RUSH',
      category: 'BBQ',
      description1: 'BBQ sauce & honey',
      description2: 'Sweet ol BBQ',
      image: '/flavor-bbqrush.png'
    },
    {
      id: 12,
      name: 'BBQ FIRE 🌶️',
      category: 'BBQ',
      description1: 'BBQ sauce & hot peppers',
      description2: 'A flavorful hot fire mix of sweet & spicy',
      image: '/flavor-bbqfire.png'
    },
    // SPICY DRY
    {
      id: 13,
      name: 'LEMON PEPPER',
      category: 'SPICY DRY',
      description1: 'Its all in the name',
      description2: 'Tangy deliciousness',
      image: '/flavor-lemon.png'
    },
    {
      id: 14,
      name: 'CAMEROON RUB',
      category: 'SPICY DRY',
      description1: 'Cameroon pepper & herbs',
      description2: 'Part dry, part spicy, whole lotta good',
      image: '/flavor-cameroon.png'
    },
    {
      id: 15,
      name: 'CARIBBEAN JERK',
      category: 'SPICY DRY',
      description1: 'Tropical spice mix',
      description2: 'Mild peppers you love…',
      image: '/flavor-caribbean.png'
    },
    // SWEET
    {
      id: 16,
      name: 'SWEET DREAMS',
      category: 'SWEET',
      description1: 'Cola & garlic sauce',
      description2: 'Sweet with heat on heat',
      image: '/flavor-sweetdreams.png'
    },
    {
      id: 17,
      name: 'YELLOW GOLD',
      category: 'SWEET',
      description1: 'Honey & mustard',
      description2: 'Sweet & sassy with soothing buttery flavour',
      image: '/flavor-yellowgold.png'
    },
    // BOOZY
    {
      id: 18,
      name: 'WHISKEY VIBES',
      category: 'BOOZY',
      description1: 'Whiskey & hot sauce',
      description2: 'Booze is intellectual',
      image: '/flavor-whiskeyvibes.png'
    },
    {
      id: 19,
      name: 'TEQUILA WINGRISE',
      category: 'BOOZY',
      description1: 'Tequila & citrus',
      description2: 'Now you can eat your tequila too',
      image: '/flavor-tequila.png'
    },
    {
      id: 20,
      name: 'GUSTAVO',
      category: 'BOOZY',
      description1: 'Beer & barbecue sauce',
      description2: 'Hot wings, cold dings',
      image: '/flavor-gustavo.png'
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
            {filteredFlavors.length > 0 ? (
              filteredFlavors.map((flavor) => (
                <div key={flavor.id} className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">{renderFlavorName(flavor.name)}</h3>
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
                      loading="lazy"
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