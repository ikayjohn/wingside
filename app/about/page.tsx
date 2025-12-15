"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const timelineElement = timelineRef.current;
      const rect = timelineElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const timelineHeight = timelineElement.offsetHeight;

      // Calculate how much of the timeline is visible
      const scrollTop = -rect.top;
      const visibleHeight = Math.min(scrollTop + windowHeight * 0.5, timelineHeight);
      const progress = Math.max(0, Math.min(100, (visibleHeight / timelineHeight) * 100));

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="py-16 md:py-20 bg-white">
        <div className="max-w-[90%] h-130 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="font-bold mb-2">
                <span className="text-3xl md:text-5xl text-[#552627]">We are </span>
                <span className="text-5xl md:text-6xl lg:text-8xl text-[#F7C400]">WINGSIDE!</span>
              </h1>
              <h2 className="font-bold mb-6">
                <span className="text-3xl md:text-5xl text-[#552627]">Proudly Powered by</span><br />
                <span className="text-5xl md:text-6xl lg:text-8xl text-[#F7C400]">WINGS!</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg">
                Wingside isn't just food, it's an experience. Crispy, saucy, and unforgeable - one bite and you're in.
              </p>
              <Link
                href="/order"
                className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
              >
                Get on the wingside
              </Link>
            </div>

            {/* Right Image */}
            <div className="relative">
              <img
                src="/wingbox1.png"
                alt="Wingside Box"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tagline Section */}
      <div className="py-12 md:py-25 bg-[#FFF8E1]">
        <div className="w-[90%] max-w-[1200px] mx-auto text-center">
          <p className="text-xl md:text-2xl text-gray-800">
            We do one thing really, really well: <strong>CHICKEN WINGS</strong>.
          </p>
          <p className="text-xl md:text-2xl text-gray-800">
            Tossed, sauced, and dripping in flavor. With 20 wild and<br></br> exciting varieties, we've got something for every craving.
          </p>
        </div>
      </div>

      {/* Timeline Section - Our Wing-derful Journey */}
      <div className="py-16 md:py-20 bg-gray-50">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block relative mb-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Our <span className="text-[#F7C400]">Wing-derful</span> Journey
              </h2>
              <div className="absolute -top-4 -right-16 bg-[#F7C400] text-xs font-bold px-3 py-1 rounded-full transform rotate-12">
                About Us
              </div>
            </div>
            <p className="text-lg md:text-xl text-gray-700">From Ghost Kitchen to Wing Kingdom!</p>
          </div>

          {/* Timeline */}
          <div className="relative" ref={timelineRef}>
            {/* Vertical Line - Background (gray) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-300 transform -translate-x-1/2 hidden lg:block"></div>

            {/* Vertical Line - Animated Progress (yellow) */}
            <div
              className="absolute left-1/2 top-0 w-1 bg-[#F7C400] transform -translate-x-1/2 hidden lg:block transition-all duration-300 ease-out"
              style={{ height: `${scrollProgress}%` }}
            ></div>

            {/* Circle Bullet Points */}
            <div className="absolute left-1/2 top-[8%] w-4 h-4 bg-white border-4 border-[#F7C400] rounded-full transform -translate-x-1/2 hidden lg:block z-10"></div>
            <div className="absolute left-1/2 top-[35%] w-4 h-4 bg-white border-4 border-[#F7C400] rounded-full transform -translate-x-1/2 hidden lg:block z-10"></div>
            <div className="absolute left-1/2 top-[62%] w-4 h-4 bg-white border-4 border-[#F7C400] rounded-full transform -translate-x-1/2 hidden lg:block z-10"></div>
            <div className="absolute left-1/2 top-[89%] w-4 h-4 bg-white border-4 border-[#F7C400] rounded-full transform -translate-x-1/2 hidden lg:block z-10"></div>

            {/* Timeline Items */}
            <div className="space-y-16">
              {/* 2018 - The Beginning */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="lg:text-right lg:pr-12">
                  <div className="bg-[#FFF8E1] rounded-3xl p-8 inline-block max-w-md relative z-10">
                    <div className="flex flex-col items-center lg:items-end gap-2 mb-4">
                      <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center text-2xl">
                        🏠
                      </div>
                      <h3 className="text-2xl font-bold text-black">2018</h3>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-[#552627]">The Beginning</h4>
                    <p className="text-gray-700 text-sm">
                      Born in Port Harcourt as a ghost kitchen, we started with nothing but a dream, a small kitchen, and an unshakeable belief that everyone deserves amazing wings.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block"></div>
              </div>

              {/* 2019 - First Wings Sold */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hidden lg:block"></div>
                <div className="lg:pl-12">
                  <div className="bg-[#FFF8E1] rounded-3xl p-8 inline-block max-w-md relative z-10">
                    <div className="flex flex-col items-center lg:items-start gap-2 mb-4">
                      <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center text-2xl">
                        🍗
                      </div>
                      <h3 className="text-2xl font-bold text-black">2019</h3>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-[#552627]">First Wings Sold!</h4>
                    <p className="text-gray-700 text-sm">
                      April 1st - and no, this isn't a joke! Our very first box of wings was sold, marking the beginning of what would become a wing revolution.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2020 - Flagship Store Opens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="lg:text-right lg:pr-12">
                  <div className="bg-[#FFF8E1] rounded-3xl p-8 inline-block max-w-md relative z-10">
                    <div className="flex flex-col items-center lg:items-end gap-2 mb-4">
                      <div className="w-12 h-12 bg-[#F7C400] rounded-full flex items-center justify-center text-2xl">
                        🏪
                      </div>
                      <h3 className="text-2xl font-bold text-black">2020</h3>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-[#552627]">Flagship Store Opens</h4>
                    <p className="text-gray-700 text-sm">
                      Our flagship store opened its doors, and suddenly cravings were officially satisfied. From ghost kitchen to real storefront - the dream was becoming reality.
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block"></div>
              </div>

              {/* Today */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hidden lg:block"></div>
                <div className="lg:pl-12">
                  <div className="bg-[#F7C400] rounded-3xl p-8 inline-block max-w-md relative z-10">
                    <div className="flex flex-col items-center lg:items-start gap-2 mb-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                        🚀
                      </div>
                      <h3 className="text-2xl font-bold text-black">Today</h3>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-[#552627]">Wings, Sandwiches & So Much More</h4>
                    <p className="text-gray-800 text-sm">
                      In-store, online, everywhere you need us! We've expanded beyond wings to offer sandwiches and more delicious options, always staying true to our commitment to quality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 md:py-20 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          {/* Mission Grid - 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title Section */}
            <div className="flex flex-col justify-top py-5">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">Our Mission</h2>
              <p className="text-lg md:text-xl text-gray-600">We're here to serve food that's</p>
            </div>

            {/* Clean Card */}
            <div className="bg-gray-100 rounded-3xl p-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Clean</h3>
              <p className="text-base md:text-lg font-semibold mb-4">Because health matters</p>
              <p className="text-gray-600 text-sm md:text-base">
                Fresh ingredients, clean preparation, and quality you can taste in every bite.
              </p>
            </div>

            {/* Fun Card */}
            <div className="bg-gray-100 rounded-3xl p-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Fun</h3>
              <p className="text-base md:text-lg font-semibold mb-4">Because boring meals are a crime</p>
              <p className="text-gray-600 text-sm md:text-base">
                Every meal should be an experience that brings joy and excitement to your day.
              </p>
            </div>

            {/* Unforgettable Card */}
            <div className="bg-gray-100 rounded-3xl p-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Unforgettable</h3>
              <p className="text-base md:text-lg font-semibold mb-4">We are flavor architects</p>
              <p className="text-gray-600 text-sm md:text-base">
                Creating taste memories that keep you coming back for more amazing experiences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-35 bg-[#F7C400]">
        <div className="w-[90%] max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Ready to Join the Wing Family?
          </h2>
          <p className="text-lg md:text-xl text-gray-800 mb-8">
            From our humble beginnings to today, every wing tells our story. Come taste the passion that started it all!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/order"
              className="inline-block bg-[#552627] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#3d1b1c] transition-colors"
            >
              Order now
            </Link>
            <Link
              href="/locations"
              className="inline-block bg-transparent border-2 border-[#552627] text-[#552627] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#552627] hover:text-white transition-colors"
            >
              Find locations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
