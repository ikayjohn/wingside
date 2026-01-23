"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import FranchiseApplicationModal from '@/components/FranchiseApplicationModal';

export default function FranchisingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Feature cards data
  const features = [
    {
      title: "Proven Business Model",
      description: "Join a brand that's been making waves since 2018 with a tested recipe for success"
    },
    {
      title: "Comprehensive Training",
      description: "From wing prep to customer service, we'll teach you everything you need to soar"
    },
    {
      title: "Marketing Support",
      description: "National campaigns, social media content, and local marketing assistance"
    },
    {
      title: "Ongoing Support",
      description: "Dedicated franchise support team available 7 days a week"
    },
    {
      title: "Brand Recognition",
      description: "Leverage our established brand reputation and loyal customer base"
    },
    {
      title: "Quality Assurance",
      description: "Proprietary recipes, supplier relationships, and quality control systems"
    }
  ];

  // Process steps data
  const steps = [
    {
      number: 1,
      title: "Submit Application",
      description: "Fill out our comprehensive franchise application form with your details"
    },
    {
      number: 2,
      title: "Initial Review",
      description: "Our team reviews your application and financial qualifications"
    },
    {
      number: 3,
      title: "Discovery Day",
      description: "Visit our flagship store, meet the team, and experience the Wingside way"
    },
    {
      number: 4,
      title: "Territory Selection",
      description: "Work with our team to identify the perfect location for your franchise"
    },
    {
      number: 5,
      title: "Sign Agreement",
      description: "Review and sign the franchise agreement to make it official"
    },
    {
      number: 6,
      title: "Training Program",
      description: "Complete our 4-week intensive training covering all operations"
    },
    {
      number: 7,
      title: "Store Setup",
      description: "Build out your location with our guidance on design and equipment"
    },
    {
      number: 8,
      title: "Grand Opening",
      description: "Launch your Wingside franchise with full marketing and operational support"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex flex-col justify-between">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/franchise-hero.jpg"
            alt="Business meeting with diverse professionals"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a gradient background if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #552627 0%, #3a1a1b 100%)';
            }}
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Top Badge */}
        <div className="relative z-10 w-full gutter-x pt-8 md:pt-12">
          <span
            className="section-badge"
            style={{ backgroundColor: '#FFF3B0', color: '#552627' }}
          >
            Franchising
          </span>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 w-full gutter-x pb-16 md:pb-20 lg:pb-24">
          <div className="max-w-4xl">
            {/* Headings */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3 leading-none">
              Franchise Opportunity
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-none">
              Own Your Flight Path
            </h2>

            {/* Subheading */}
            <p className="text-xs md:text-sm text-gray-200 mb-6 md:mb-8 max-w-2xl leading-snug">
              Join Nigeria's fastest-growing wing brand and bring crispy, saucy perfection to your community. Where Flavor Takes Flight – now under your wings.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary text-center py-3 md:py-4 px-6 md:px-8 flex items-center justify-center"
              >
                Apply for Franchise
              </button>
              <Link
                href="#how-it-works"
                className="inline-block text-center py-3 md:py-4 px-6 md:px-8 border border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#552627] transition-all duration-300 flex items-center justify-center"
              >
                Learn the process
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-white">
        <div className="gutter-x">
          <div className="mx-auto" style={{ width: '95%' }}>
            {/* Section Header */}
            <div className="mb-12 md:mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-none text-black">
                What Makes Us<br />Different?
              </h2>
              <p className="text-sm md:text-base text-black leading-relaxed">
                We're not just serving wings – we're building a movement. Here's what you<br />get when you join the flock.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 md:p-8 rounded-lg border border-black hover:shadow-lg transition-shadow duration-300"
                >
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-black">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-black leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 lg:py-24 bg-gray-100">
        <div className="gutter-x">
          <div className="mx-auto" style={{ width: '90%' }}>
            {/* Section Header */}
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-3 text-gray-800">
                How it works
              </h2>
              <p className="text-sm md:text-base text-gray-800 max-w-4xl mx-auto leading-relaxed whitespace-nowrap">
                From application to grand opening, here is your path to owning a Wingside franchise in 8 simple steps.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="p-6 md:p-8 bg-white rounded-3xl hover:bg-[#F7C400] transition-colors duration-300"
                >
                  {/* Step Number and Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold bg-gray-800 flex-shrink-0">
                      {step.number}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                      {step.title}
                    </h3>
                  </div>

                  {/* Step Description */}
                  <p className="text-xs md:text-sm text-gray-800 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Timeline Note */}
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-base md:text-lg font-semibold text-black">
                Timeline: From application to opening typically takes 4-6 months
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="py-16 md:py-20 lg:py-24" style={{ backgroundColor: '#FDF5E5' }}>
        <div className="gutter-x">
          <div className="mx-auto text-center" style={{ width: '80%' }}>
            {/* Heading */}
            <h2 className="text-[45px] md:text-[54px] lg:text-[64px] font-bold mb-4 md:mb-6 leading-none" style={{ color: '#552627' }}>
              Ready to Spread Your Wings?
            </h2>

            {/* Subheading */}
            <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              Join the Wingside family and bring our signature flavors to your community. Let's build something amazing together.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-block font-semibold rounded-full transition-all duration-300 mb-8 md:mb-10"
              style={{
                backgroundColor: '#F7C400',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem',
              }}
            >
              Start Your Application
            </button>

            {/* Contact Information */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm md:text-base text-gray-600 mb-2">
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
