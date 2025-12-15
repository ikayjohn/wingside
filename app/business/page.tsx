"use client";

import React from 'react';
import Link from 'next/link';

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[700px] md:h-[800px] lg:h-[900px]">
        <img
          src="/business-hero.jpg"
          alt="Wingside Business"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#FDEDB2] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Wingside Business</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Because hungry employees <br />don't innovate.
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              We fuel creativity, how else do you think top businesses shine? Wingside Business keeps your team powered, happy, and way more productive (you can thank us later)
            </p>

            {/* CTA Button */}
            <Link
              href="/order"
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Let's make it happen
            </Link>
          </div>
        </div>
      </div>

      {/* Our Programs Section */}
      <div className="py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-300 mb-16">
            Our Programs
          </h2>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Wingpost */}
            <Link href="/business/wingpost" className="block group cursor-pointer">
              <div className="mb-6 rounded-3xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                <img
                  src="/business-wingpost.jpg"
                  alt="Wingpost"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-[#F7C400] transition-colors">Wingpost</h3>
              <p className="text-gray-700 text-base md:text-lg">
                Snack station meets magic. We set up in your office (for free!) with sandwiches, salads, parfaits & more. You pick what we stock. They eat. Everyone wins.
              </p>
            </Link>

            {/* Wingside Office Lunch */}
            <Link href="/business/officelunch" className="block group cursor-pointer">
              <div className="mb-6 rounded-3xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                <img
                  src="/business-office-lunch.jpg"
                  alt="Wingside Office Lunch"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-[#F7C400] transition-colors">Wingside Office Lunch</h3>
              <p className="text-gray-700 text-base md:text-lg">
                Lunch without the lunchtime chaos. Personalized meals delivered when you want, how you want. Work harder, munch smarter.
              </p>
            </Link>

            {/* Wingside Meetings */}
            <Link href="/business/meetings" className="block group cursor-pointer">
              <div className="mb-6 rounded-3xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                <img
                  src="/business-meetings.jpg"
                  alt="Wingside Meetings"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-[#F7C400] transition-colors">Wingside Meetings</h3>
              <p className="text-gray-700 text-base md:text-lg">
                From a quick huddle to a 500-person conference, we've got the spread that keeps everyone focused (and full). Zero stress, maximum flavor.
              </p>
            </Link>

            {/* Wingside Catering */}
            <Link href="/business/catering" className="block group cursor-pointer">
              <div className="mb-6 rounded-3xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                <img
                  src="/business-catering.jpg"
                  alt="Wingside Catering"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-[#F7C400] transition-colors">Wingside Catering</h3>
              <p className="text-gray-700 text-base md:text-lg">
                Birthday parties, company dinners, farewells, or anything you can possibly think of. We're able to provide you with customized menu options to fit your guests, and your budget.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
