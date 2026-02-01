"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CartItem {
  id: number;
  name: string;
  flavor: string | string[];
  size: string;
  price: number;
  quantity: number;
  image: string;
  rice?: string | string[];
  drink?: string | string[];
  milkshake?: string;
}

export default function WingcafePage() {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-scroll carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let scrollPos = 0;

    const scroll = () => {
      scrollPos += 0.5;

      // Reset to start when reaching halfway point for infinite effect
      const maxScroll = carousel.scrollWidth / 2;
      if (scrollPos >= maxScroll) {
        scrollPos = 0;
      }

      carousel.scrollTo({
        left: scrollPos,
        behavior: 'auto'
      });

      requestAnimationFrame(scroll);
    };

    requestAnimationFrame(scroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[700px] md:h-[800px] lg:h-[900px]">
        <img
          src="/wingcafe-hero.jpg" loading="eager"
          alt="Wingcafé"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div className="flex justify-between items-start">
            <div className="inline-block bg-[#F7C400] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingcafé</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Now Brewing... Bold Flavors
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              Experience the perfect blend of minimalist charm and vibrant taste
            </p>

            {/* CTA Button */}
            <Link
              href="/order"
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Explore our menu
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">
            Every sip full of flavor
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Matcha Made in Heaven */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-match.png" loading="lazy"
                alt="matcha made in heaven"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-[44px] left-6 text-left">
                <p className="text-[#552627] font-bold text-[40px] md:text-[48px] leading-[0.85]">matcha made<br />in heaven</p>
              </div>
            </div>

            {/* Matcha Magic */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/order-affogato-pop.jpg" loading="lazy"
                alt="Affogato"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-[44px] right-6 text-right">
                <p className="text-white font-bold text-[40px] md:text-[48px] leading-[0.85]">Affogato<br />believe how<br />good this is</p>
              </div>
            </div>

            {/* Wingcafé Brewing */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/latte-duo.png" loading="lazy"
                alt="Wingcafé Brewing Bold Flavors"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-[44px] left-6">
                <p className="text-[#552627] font-bold text-4xl md:text-5xl leading-[0.85]">A whole latte</p>
                <p className="text-[#552627] font-bold text-4xl md:text-5xl leading-[0.85]">goodness</p>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Much Ado About Latte */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-hot.png" loading="lazy"
                alt="Much Ado About Latte"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-[44px] left-6 text-left">
                <p className="text-[#552627] font-bold text-[40px] md:text-[48px] leading-[0.85]">Brewed for</p>
                <p className="text-[#552627] font-bold text-[40px] md:text-[48px] leading-[0.85]">the bold</p>
              </div>
            </div>

            {/* Life is Greener */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-matcha-green.jpg" loading="lazy"
                alt="life is greener on the matcha side"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-[44px] left-6 text-left">
                <p className="text-[#552627] font-bold text-[40px] md:text-[48px] leading-[0.85]">life is fresher on the</p>
                <p className="text-[#552627] font-bold text-[40px] md:text-[48px] leading-[0.85]">wing side</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Much Ado About Latte Carousel */}
      <div className="bg-gray-100 py-16 md:py-24">
        <div className="max-w-full mx-auto px-4 md:px-8 lg:px-16">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
              Much Ado About Latte
            </h2>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Carousel */}
            <div ref={carouselRef} className="overflow-x-auto hide-scrollbar">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {/* First set */}
                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-caramel-latte.jpg" alt="Caramel Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Caramel Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Sweet caramel perfection</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-chai-latte.jpg" alt="Chai Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Chai Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Spiced warmth in every sip</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-cinnamon-roll-latte.jpg" alt="Cinnamon Roll Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Cinnamon Roll Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Fresh-baked cinnamon goodness</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-gingerbread-latte.jpg" alt="Gingerbread Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Gingerbread Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Holiday spice in a cup</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-hazelnut-latte.jpg" alt="Hazelnut Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Hazelnut Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Nutty indulgence</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-irish-cream-latte.jpg" alt="Irish Cream Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Irish Cream Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Creamy, rich, and bold</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-maple-latte.jpg" alt="Maple Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Maple Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Pure maple sweetness</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-pistachio-latte.jpg" alt="Pistachio Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Pistachio Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Elegant nutty flavor</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-pumpkin-pie-latte.jpg" alt="Pumpkin Pie Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Pumpkin Pie Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Fall favorite comfort</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-salted-caramel-latte.jpg" alt="Salted Caramel Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Salted Caramel Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Sweet and savory balance</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-tiramisu-latte.jpg" alt="Tiramisu Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Tiramisu Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Dessert in a cup</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-vanilla-latte.jpg" alt="Vanilla Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Vanilla Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Classic simplicity</p>
                  </div>
                </div>

                {/* Duplicate set for infinite scroll */}
                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-caramel-latte.jpg" alt="Caramel Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Caramel Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Sweet caramel perfection</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-chai-latte.jpg" alt="Chai Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Chai Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Spiced warmth in every sip</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-cinnamon-roll-latte.jpg" alt="Cinnamon Roll Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Cinnamon Roll Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Fresh-baked cinnamon goodness</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-gingerbread-latte.jpg" alt="Gingerbread Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Gingerbread Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Holiday spice in a cup</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-hazelnut-latte.jpg" alt="Hazelnut Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Hazelnut Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Nutty indulgence</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-irish-cream-latte.jpg" alt="Irish Cream Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Irish Cream Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Creamy, rich, and bold</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-maple-latte.jpg" alt="Maple Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Maple Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Pure maple sweetness</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-pistachio-latte.jpg" alt="Pistachio Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Pistachio Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Elegant nutty flavor</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-pumpkin-pie-latte.jpg" alt="Pumpkin Pie Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Pumpkin Pie Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Fall favorite comfort</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-salted-caramel-latte.jpg" alt="Salted Caramel Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Salted Caramel Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Sweet and savory balance</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-tiramisu-latte.jpg" alt="Tiramisu Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Tiramisu Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Dessert in a cup</p>
                  </div>
                </div>

                <div className="relative w-[400px] md:w-[500px] h-[500px] md:h-[600px] flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer">
                  <img src="/order-vanilla-latte.jpg" alt="Vanilla Latte" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-white font-bold text-2xl md:text-3xl">Vanilla Latte</h3>
                    <p className="text-white/90 text-sm md:text-base mt-2">Classic simplicity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
