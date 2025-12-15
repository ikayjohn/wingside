"use client";

import React, { useState, useEffect } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // Load cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('wingside-cart');
      if (savedCart) {
        const cart: CartItem[] = JSON.parse(savedCart);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      } else {
        setCartCount(0);
      }
    };

    // Initial load
    updateCartCount();

    // Listen for storage changes (when cart is updated on other pages)
    window.addEventListener('storage', updateCartCount);

    // Also check periodically in case cart was updated on same page
    const interval = setInterval(updateCartCount, 500);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  const pairings = [
    {
      title: 'Tiramisu + White Chocolate',
      description: 'Velvety and rich, like dessert in a cup.',
    },
    {
      title: 'Irish Cream + Chocolate',
      description: 'Deep and cozy indulgence.',
    },
    {
      title: 'Popcorn + Salted Caramel',
      description: 'Sweet and savory balance.',
    },
    {
      title: 'Pistachio + Vanilla',
      description: 'Nutty, mellow, and elegant.',
    },
    {
      title: 'Gingerbread + Caramelized Peanut',
      description: 'Spiced peanut brittle in latte form.',
    },
    {
      title: 'Pumpkin Spice + White Chocolate',
      description: 'Creamy autumn indulgence.',
    },
    {
      title: 'Tiramisu + Irish Cream',
      description: 'A luxurious blend of coffee, cream, and cocoa depth — smooth and indulgent.',
    },
    {
      title: 'Ask your barista for today\'s seasonal flavor pairings.',
      description: 'Ask for our "Pairing of the Month" — a new, a-bit-out crafted in-house.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[700px] md:h-[800px] lg:h-[900px]">
        <img
          src="/wingcafe-hero.jpg"
          alt="Wingcafé"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div className="flex justify-between items-start">
            <div className="inline-block bg-[#F7C400] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingcafé</span>
            </div>

            {/* Floating Cart Icon */}
            <Link href="/order" className="fixed top-1/2 -translate-y-1/2 right-4 md:right-8 lg:right-16 z-50">
              <div className="w-14 h-14 bg-[#F7C400] rounded-full flex items-center justify-center hover:bg-[#e5b500] transition-colors shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
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
            Minimalist • Elegant • Vibrant
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Matcha Made in Heaven */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-matcha-heaven.jpg"
                alt="matcha made in heaven"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-black px-6 py-3">
                <span className="text-[#9CCC65] font-bold text-xl md:text-2xl">matcha</span>
                <span className="text-white font-bold text-xl md:text-2xl"> made in heaven</span>
              </div>
            </div>

            {/* Matcha Magic */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-matcha-magic.jpg"
                alt="Matcha magic"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-[#9CCC65] px-6 py-3">
                <p className="text-white font-bold text-xl md:text-2xl">Matcha magic</p>
                <p className="text-white text-base md:text-lg">Your sweet green moment</p>
              </div>
            </div>

            {/* Wingcafé Brewing */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-brewing.jpg"
                alt="Wingcafé Brewing Bold Flavors"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-black px-6 py-3">
                <p className="text-[#F7C400] font-bold text-xl md:text-2xl">Wingcafé</p>
                <p className="text-white text-base md:text-lg">Brewing Bold Flavors</p>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Much Ado About Latte */}
            <div className="relative rounded-3xl overflow-hidden aspect-video transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-latte.jpg"
                alt="Much Ado About Latte"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-[#F7C400] px-6 py-3">
                <p className="text-black font-bold text-2xl md:text-3xl">Much Ado</p>
                <p className="text-black font-bold text-2xl md:text-3xl">About Latte</p>
              </div>
            </div>

            {/* Life is Greener */}
            <div className="relative rounded-3xl overflow-hidden aspect-video transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <img
                src="/wingcafe-matcha-green.jpg"
                alt="life is greener on the matcha side"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-[#9CCC65] px-6 py-3">
                <p className="text-white font-bold text-2xl md:text-3xl">life is fresher on the</p>
                <p className="text-white font-bold text-2xl md:text-3xl">wing side</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Signature Pairing Recommendations Section */}
      <div className="bg-[#F7C400] py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Signature Pairing<br />Recommendations
            </h2>
            <p className="text-black text-lg">
              Taste combinations loved by our baristas — crafted to complement your taste perfectly
            </p>
          </div>

          {/* Pairings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairings.map((pairing, index) => (
              <div
                key={index}
                className="bg-[#5D4037] hover:bg-white rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 cursor-pointer group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-1 stroke-[#F7C400] group-hover:stroke-black transition-colors duration-300"
                >
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                  <line x1="6" y1="2" x2="6" y2="4"></line>
                  <line x1="10" y1="2" x2="10" y2="4"></line>
                  <line x1="14" y1="2" x2="14" y2="4"></line>
                </svg>
                <div>
                  <h3 className="text-white group-hover:text-black font-bold text-lg mb-2 transition-colors duration-300">{pairing.title}</h3>
                  <p className="text-gray-300 group-hover:text-black text-sm transition-colors duration-300">{pairing.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
