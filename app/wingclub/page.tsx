"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WingclubPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: '/wingclubhero1.jpg',
      title: 'Where cravings pay you back',
      description: 'Join the coolest club in town. Sign up today, get a FREE gift on your first purchase, and start stacking points every time you take a bite.'
    },
    {
      image: '/wingclubhero2.jpg',
      title: 'Where cravings pay you back',
      description: 'Join the coolest club in town. Sign up today, get a FREE gift on your first purchase, and start stacking points every time you take a bite.'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Slider Section */}
      <div className="relative h-[750px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Content */}
            <div className="relative h-full w-[90%] mx-auto flex flex-col justify-center">
              {/* Wingclub Badge */}
              <div className="mb-6">
                <span className="inline-block bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium">
                  Wingclub
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 lg:whitespace-nowrap">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="text-white text-lg md:text-xl mb-8 max-w-full md:max-w-3xl lg:max-w-4xl">
                {slide.description}
              </p>

              {/* CTA Button */}
              <div>
                <Link
                  href="/my-account"
                  className="inline-block bg-[#F7C400] text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 right-8 flex items-center gap-4 text-white">
              <button
                onClick={prevSlide}
                className="hover:text-[#F7C400] transition-colors font-semibold"
              >
                PREV
              </button>
              <span className="font-semibold">
                {currentSlide + 1}/{slides.length}
              </span>
              <button
                onClick={nextSlide}
                className="hover:text-[#F7C400] transition-colors font-semibold"
              >
                NEXT
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How it works Section */}
      <div className="bg-[#5D2E2F] py-16 md:py-20">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F7C400] mb-4">
              How it works
            </h2>
            <p className="text-white text-base md:text-lg max-w-2xl mx-auto">
              It's basically turning your cravings into currency, best part, this currency is valid across our entire store. The Wingside universal currency we call it.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {/* Step 1: Order */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <h3 className="text-[#F7C400] font-bold text-lg mb-2">Order</h3>
              <p className="text-white text-sm">Place your wing order online or in-store</p>
            </div>

            {/* Step 2: Earn Points */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="#F7C400" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className="text-[#F7C400] font-bold text-lg mb-2">Earn Points</h3>
              <p className="text-white text-sm">Get 1 point for every ₦100 spent</p>
            </div>

            {/* Step 3: Unlock Perks */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                  <rect x="2" y="7" width="20" height="5"></rect>
                  <line x1="12" y1="22" x2="12" y2="7"></line>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
              </div>
              <h3 className="text-[#F7C400] font-bold text-lg mb-2">Unlock Perks</h3>
              <p className="text-white text-sm">Redeem points for rewards & discounts</p>
            </div>

            {/* Step 4: Keep Earning */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </div>
              <h3 className="text-[#F7C400] font-bold text-lg mb-2">Keep Earning</h3>
              <p className="text-white text-sm">Keep earning, keep enjoying!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Tiers Section */}
      <div className="py-16 md:py-20 bg-white">
        <div className="w-[90%] mx-auto">
          {/* Section Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-gray-300">
            Reward Tiers
          </h2>

          {/* Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Wing Member - Blue */}
            <div className="relative bg-[#D6E9F5] rounded-3xl p-8 overflow-hidden min-h-[400px]">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-2xl font-bold text-black">Wing Member</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <ul className="space-y-2 mb-16 text-base text-black">
                  <li>• 10% off first order</li>
                  <li>• 1 point for every ₦100 spent</li>
                  <li>• ₦3000 off your 10th purchase</li>
                  <li>• Redeem ₦3000 for every 500 points earned.</li>
                </ul>
                <p className="text-base text-black font-semibold">(0-1000 points)</p>
              </div>
              {/* Decorative Shape */}
              <div className="absolute bottom-0 right-0 w-64 h-64 translate-x-12 translate-y-12">
                <img src="/ellipse.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Wing Leader - Yellow */}
            <div className="relative bg-[#FFF8E1] rounded-3xl p-8 overflow-hidden min-h-[400px]">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-2xl font-bold text-black">Wing Leader</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <ul className="space-y-2 mb-16 text-base text-black">
                  <li>• All Freshman perks</li>
                  <li>• Birthday Wings - because cake is overrated.</li>
                </ul>
                <p className="text-base text-black font-semibold">(1001- 2000 points)</p>
              </div>
              {/* Decorative Shape */}
              <div className="absolute bottom-0 right-0 w-64 h-64 translate-x-12 translate-y-12">
                <img src="/star.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Wingzard - Purple */}
            <div className="relative bg-[#EDE7F6] rounded-3xl p-8 overflow-hidden min-h-[400px]">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-2xl font-bold text-black">Wingzard</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F7C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <ul className="space-y-2 mb-16 text-base text-black">
                  <li>• All Pro perks</li>
                  <li>• Free delivery (your wallet says thanks)</li>
                  <li>• VIP access to exclusive events</li>
                </ul>
                <p className="text-base text-black font-semibold">(2500+ points)</p>
              </div>
              {/* Decorative Shape */}
              <div className="absolute bottom-0 right-0 w-64 h-64 translate-x-12 translate-y-12">
                <img src="/subtract.png" alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Drooling CTA Section */}
      <div className="py-16 md:py-20 bg-white">
        <div className="w-[70%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
            {/* Left Content */}
            <div className="relative">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-1.0">
                Stop drooling,<br />
                Start earning.
              </h2>
              <Link
                href="/my-account"
                className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Center Burst Decoration */}
            <div className="absolute left-1/2 top-1/6 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 pointer-events-none z-10">
              <img
                src="/clubburst1.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Decorative Badge - positioned below left content */}
            <div className="absolute bottom-0 left-125 w-32 h-32 lg:w-40 lg:h-40 z-20">
              <img
                src="/clubbadge1.png"
                alt="Wingclub Badge"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Right Image */}
            <div className="relative z-0">
              <img
                src="/wingclubearn1.jpg"
                alt="Join Wingclub"
                className="w-full h-auto rounded-3xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}