"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import FranchiseApplicationModal from '@/components/FranchiseApplicationModal';

export default function WingsideToGoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = [
    { number: '60 secs', label: 'Average pick-up time' },
    { number: '24/7', label: 'Always Open' },
    { number: '70%', label: 'Low Operating Cost' },
    { number: '99.9%', label: 'Uptime Reliability' },
  ];

  const bulletPoints = [
    { text: 'No staff required – fully automated system' },
    { text: 'Low capital expenditure compared to traditional stores' },
    { text: 'Rapid deployment and scalability' },
    { text: 'Restaurant-quality food, vending-machine convenience' },
  ];

  const locations = [
    {
      id: 1,
      title: 'Hospitals & Medical Centers',
      description: '24/7 hot meals for medical staff, visitors, and patients',
      type: 'text',
      bgColor: '#552627',
    },
    {
      id: 2,
      title: 'Universities & Colleges',
      description: 'Convenient grab-and-go for students between classes',
      type: 'text',
      bgColor: '#552627',
    },
    {
      id: 3,
      title: 'Shopping Malls',
      description: 'Quick bites for shoppers without restaurant wait times',
      type: 'text',
      bgColor: '#F7C400',
    },
    {
      id: 4,
      title: 'Transit Stations',
      description: 'Quick meals for commuters on the move',
      type: 'text',
      bgColor: '#F7C400',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[700px] md:min-h-[800px] flex flex-col justify-between">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/wingside-togo-hero.jpg"
            alt="Wingside To-Go smart food locker kiosk"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #552627 0%, #3a1a1b 100%)';
            }}
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Top Badge */}
        <div className="relative z-10 w-full gutter-x pt-8 md:pt-12">
          <span className="section-badge" style={{ backgroundColor: '#FFF3B0', color: '#552627' }}>
            Wingside ToGo
          </span>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 w-full gutter-x pb-16 md:pb-20 lg:pb-24">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
              Meet the future of food<br />retail with{' '}
              <span style={{ color: '#F7C400' }}>Wingside To-Go</span>
            </h1>
            <p className="text-sm md:text-base text-gray-200 mb-6 md:mb-8 max-w-2xl leading-snug">
              Smart food lockers delivering hot wings and cold drinks 24/7. No staff? No wait. Just grab and go.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-center py-3 md:py-4 px-6 md:px-8 text-base md:text-lg"
            >
              Partner With Us
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar Section */}
      <section className="py-12 md:py-16" style={{ backgroundColor: '#FDF5E5' }}>
        <div className="gutter-x">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" style={{ width: '70%', margin: '0 auto' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-2 text-black">
                  {stat.number}
                </div>
                <p className="text-sm md:text-base text-black font-normal">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Wingside To-Go Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-white">
        <div className="gutter-x">
          <div className="mx-auto" style={{ width: '90%' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
              {/* Left Content */}
              <div className="order-2 lg:order-1 px-8 md:px-12 py-12 md:py-16 rounded-l-3xl flex flex-col justify-center" style={{ backgroundColor: '#FDEDB2', height: '600px' }}>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-6 md:mb-8 leading-tight text-black">
                  What is Wingside To-Go?
                </h2>
                <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6 leading-relaxed">
                  Wingside To-Go is our revolutionary micro-retail solution bringing our famous wings to high-traffic locations through smart, automated food lockers.
                </p>
                <p className="text-sm md:text-base text-gray-700 mb-6 md:mb-8 leading-relaxed">
                  Think vending machine meets restaurant quality. Our temperature-controlled lockers keep hot food hot and cold drinks cold, all accessible 24/7 through our mobile app.
                </p>

                {/* Bullet Points */}
                <div className="space-y-3 md:space-y-4">
                  {bulletPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 pt-0.5">
                        {point.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Image */}
              <div className="order-1 lg:order-2" style={{ height: '600px' }}>
                <img
                  src="/wingside-togo-kiosk.jpg"
                  alt="Wingside To-Go kiosk in use"
                  className="w-full h-full rounded-r-3xl shadow-2xl object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Types Section */}
      <section className="bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {/* Row 1 */}
            {/* 1. Hospitals Text Box */}
            <div className="p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#552627', minHeight: '400px' }}>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                Hospitals & Medical Centers
              </h3>
              <p className="text-sm md:text-base text-gray-200 mb-4">
                24/7 hot meals for medical staff, visitors, and patients
              </p>
              <div className="flex items-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* 2. Hospital Image */}
            <div className="relative min-h-[400px]">
              <img
                src="/wingside-togo-hospital.jpg"
                alt="Hospital kiosk"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-gray-200');
                }}
              />
            </div>

            {/* 3. Shopping Malls Text Box */}
            <div className="p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#552627', minHeight: '400px' }}>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                Shopping Malls
              </h3>
              <p className="text-sm md:text-base text-gray-200 mb-4">
                Quick bites for shoppers without restaurant wait times
              </p>
              <div className="flex items-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* 4. Mall Image */}
            <div className="relative min-h-[400px]">
              <img
                src="/wingside-togo-mall.jpg"
                alt="Shopping mall kiosk"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-gray-200');
                }}
              />
            </div>

            {/* Row 2 */}
            {/* 5. University Image */}
            <div className="relative min-h-[400px]">
              <img
                src="/wingside-togo-university.jpg"
                alt="University kiosk"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-gray-200');
                }}
              />
            </div>

            {/* 6. Universities Text Box */}
            <div className="p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#F7C400', minHeight: '400px' }}>
              <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#552627' }}>
                Universities & Colleges
              </h3>
              <p className="text-sm md:text-base text-gray-800 mb-4">
                Convenient grab-and-go for students between classes
              </p>
              <div className="flex items-center justify-end">
                <svg className="w-6 h-6" style={{ color: '#552627' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>

            {/* 7. Transit Image */}
            <div className="relative min-h-[400px]">
              <img
                src="/wingside-togo-transit.jpg"
                alt="Transit station kiosk"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('bg-gray-200');
                }}
              />
            </div>

            {/* 8. Transit Text Box */}
            <div className="p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#F7C400', minHeight: '400px' }}>
              <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#552627' }}>
                Transit Stations
              </h3>
              <p className="text-sm md:text-base text-gray-800 mb-4">
                Quick meals for commuters on the move
              </p>
              <div className="flex items-center justify-end">
                <svg className="w-6 h-6" style={{ color: '#552627' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 lg:py-24" style={{ backgroundColor: '#FDF5E5' }}>
        <div className="gutter-x">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#552627' }}>
              Ready to Bring Wingside To-Go to Your Location?
            </h2>
            <p className="text-base md:text-lg text-gray-700 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
              Whether you manage a hospital, campus, mall, or office building, Wingside To-Go can transform your space into a 24/7 food destination.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mb-8 md:mb-10 py-3 md:py-4 px-8 md:px-10 text-base md:text-lg font-semibold rounded-full text-white transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#552627' }}
            >
              Request Installation
            </button>

            {/* Contact Information */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm md:text-base text-gray-600 mb-3">
                Questions?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <a
                  href="mailto:franchise@wingside.ng"
                  className="text-base md:text-lg font-semibold hover:text-[#F7C400] transition-colors"
                  style={{ color: '#552627' }}
                >
                  franchise@wingside.ng
                </a>
                <span className="hidden sm:inline text-gray-400">|</span>
                <a
                  href="tel:+2348090191999"
                  className="text-base md:text-lg font-semibold hover:text-[#F7C400] transition-colors"
                  style={{ color: '#552627' }}
                >
                  +234(0)809-019-1999
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Application Modal */}
      <FranchiseApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
