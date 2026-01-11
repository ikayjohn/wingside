"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnershipPage() {
  const [activeFilter, setActiveFilter] = useState("All Partners");

  const partners = [
    // Streaming
    { name: "Netflix", category: "Streaming", logo: "/logo-netflix.svg" },
    { name: "Showmax", category: "Streaming", logo: "/logo-showmax.png" },
    { name: "Prime Video", category: "Streaming", logo: "/logo-prime-video.svg" },
    { name: "YouTube", category: "Streaming", logo: "/logo-youtube.svg" },
    { name: "Spotify", category: "Streaming", logo: "/logo-spotify.svg" },
    { name: "Apple Music", category: "Streaming", logo: "/logo-apple-music.svg" },
    { name: "Audiomack", category: "Streaming", logo: "/logo-audiomack.svg" },
    // Shopping
    { name: "Jumia", category: "Shopping", logo: "/logo-jumia.png" },
    { name: "Konga", category: "Shopping", logo: "/logo-konga.png" },
    { name: "Shoprite", category: "Shopping", logo: "/logo-shoprite.jpg" },
    { name: "Temu", category: "Shopping", logo: "/logo-temu.svg" },
    { name: "Aliexpress", category: "Shopping", logo: "/logo-aliexpress.svg" },
    { name: "Shein", category: "Shopping", logo: "/logo-shein.svg" },
    // Gaming
    { name: "PlayStation", category: "Gaming", logo: "/logo-playstation.svg" },
    { name: "Xbox", category: "Gaming", logo: "/logo-xbox.svg" },
    { name: "Call of Duty", category: "Gaming", logo: "/logo-call-of-duty.svg" },
    // Lifestyle
    { name: "DSTV", category: "Lifestyle", logo: "/logo-dstv.svg" },
    { name: "MTN Play", category: "Lifestyle", logo: "/logo-mtn-play.svg" },
    { name: "Bolt", category: "Lifestyle", logo: "/logo-bolt.png" },
    { name: "Glovo", category: "Lifestyle", logo: "/logo-glovo.svg" },
    { name: "Chowdeck", category: "Lifestyle", logo: "/logo-chowdeck.svg" },
    { name: "Uber", category: "Lifestyle", logo: "/logo-uber.svg" },
    { name: "Indriver", category: "Lifestyle", logo: "/logo-indrive.svg" },
    { name: "Genesis Cinema", category: "Lifestyle", logo: "/logo-genesis.png" },
  ];

  const filteredPartners =
    activeFilter === "All Partners"
      ? partners
      : partners.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO SECTION */}
      <section
        className="relative h-[750px] flex items-end bg-cover bg-center"
        style={{
          backgroundImage: "url('/partnership-hero.jpg')",
          backgroundColor: "#5c3a3a"
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 w-[90%] mx-auto px-6 pb-20 font-sans">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#f4e4b8", color: "#5c3a3a" }}
            >
              Now available with 25+ partner brands
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-sans">
            <span className="text-[#F7C400]">
              Your Wings
            </span>
            <span className="text-white"> Go Further</span>
          </h1>

          {/* Subtext */}
          <p
            className="text-[18px] md:text-[22px] mb-10 max-w-2xl text-white font-sans"
          >
            Turn your Wingside points into streaming subscriptions, shopping
            credits, gaming passes, and more.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => document.getElementById('partners-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: "#F7C400",
                color: "#5c3a3a",
              }}
            >
              Explore Partners
            </button>
            <Link href="/wingclub">
              <button
                className="px-8 py-4 rounded-full font-bold text-lg border-2 border-white text-white transition-all hover:scale-105 cursor-pointer"
                style={{ backgroundColor: "transparent" }}
              >
                Join the WingClub
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{ backgroundColor: "#FDEDB2" }}>
        <div className="max-w-6xl mx-auto px-6 py-[130px] md:py-[146px]">
          <div className="flex flex-col md:flex-row justify-between items-start mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold max-w-md"
              style={{ color: "#5c3a3a" }}
            >
              How it works
            </h2>
            <p
              className="text-lg mt-6 md:mt-0 max-w-md"
              style={{ color: "#000000" }}
            >
              From earning to spending, your WingClub journey is simple and
              straightforward.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="mb-6">
                <img
                  src="/partnership-earn.png"
                  alt="Earn Points"
                  className="w-16 h-16"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#5c3a3a" }}
              >
                Earn Points
              </h3>
              <p className="text-gray-600">
                Every order at Wingside earns you WingClub points.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="mb-6">
                <img
                  src="/partnership-points.png"
                  alt="Choose Value"
                  className="w-16 h-16"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#5c3a3a" }}
              >
                Choose Value
              </h3>
              <p className="text-gray-600">
                Your points live on your WingClub card. Safe, flexible, and
                ready to use.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="mb-6">
                <img
                  src="/partnership-spend.png"
                  alt="Spend Anywhere"
                  className="w-16 h-16"
                />
              </div>
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#5c3a3a" }}
              >
                Spend Anywhere
              </h3>
              <p className="text-gray-600">
                Use your points at Wingside or redeem them with partner brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MORE THAN A RESTAURANT CARD SECTION */}
      <section style={{ backgroundColor: "#FFFCF2" }} className="py-[130px] md:py-[146px]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            {/* Left Column */}
            <div>
              <h2
                className="text-[32px] md:text-[38px] font-semibold mb-6 text-black"
              >
                More than a Restaurant Card
              </h2>
              <p className="text-xl text-black mb-6">
                Your WingClub card opens doors to a world of possibilities. From
                streaming your favorite shows to gaming with friends, your
                points give you the freedom to enjoy what you love.
              </p>
              <p className="text-lg text-black">
                Redeem points for subscriptions, shopping credits, gaming
                passes, and much more. It's your rewards, your way.
              </p>
            </div>

            {/* Right Column - Card Display */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100 max-w-[400px]">
              <div className="mb-6 pb-6 border-b border-gray-200 text-center">
                <p className="text-gray-600 text-sm mb-2 font-bold">WingClub Balance</p>
                <p className="text-4xl font-semibold" style={{ color: "#5c3a3a" }}>
                  2,450
                </p>
                <p className="text-gray-500 text-sm">points</p>
              </div>

              <h3 className="font-semibold text-sm mb-4 text-gray-600">
                Redeem for:
              </h3>

              <div className="space-y-4">
                {/* Netflix */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#E50914" }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">Netflix Subscription</p>
                    <p className="text-sm text-gray-600">1,200 points/month</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>

                {/* Shopping */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#9333EA" }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">Shopping Credit</p>
                    <p className="text-sm text-gray-600">500 points = $5</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>

                {/* Music Streaming */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">Music Streaming</p>
                    <p className="text-sm text-gray-600">900 points/month</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHERE YOU CAN USE YOUR POINTS SECTION */}
      <section style={{ backgroundColor: "#542526" }}>
        <div className="max-w-6xl mx-auto px-6 py-[130px] md:py-[146px]">
          <div className="text-center mb-16 font-sans">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              Where You Can Use Your Points
            </h2>
            <p className="text-xl text-white">
              Explore partner brands across streaming, shopping, gaming, and
              more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Streaming Card */}
            <div className="rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer bg-white">
              <div className="h-48 relative p-[10px]">
                <img
                  src="/partnership-streaming.jpg"
                  alt="Streaming & Entertainment"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="px-6 pb-6 pt-3">
                <h3 className="text-xl font-semibold mb-2 text-black">
                  Streaming & Entertainment
                </h3>
                <p className="text-black">
                  Turn your WingClub points into streaming subscriptions and digital entertainment.
                </p>
              </div>
            </div>

            {/* Shopping Card */}
            <div className="rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer bg-white">
              <div className="h-48 relative p-[10px]">
                <img
                  src="/partnership-shopping.jpg"
                  alt="Shopping & Lifestyle"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="px-6 pb-6 pt-3">
                <h3 className="text-xl font-semibold mb-2 text-black">
                  Shopping & Lifestyle
                </h3>
                <p className="text-black">
                  Use your WingClub card beyond food — from online shopping to lifestyle services.
                </p>
              </div>
            </div>

            {/* Gaming Card */}
            <div className="rounded-2xl overflow-hidden hover:scale-105 transition-transform cursor-pointer bg-white">
              <div className="h-48 relative p-[10px]">
                <img
                  src="/partnership-gaming.jpg"
                  alt="Digital & Gaming"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="px-6 pb-6 pt-3">
                <h3 className="text-xl font-semibold mb-2 text-black">
                  Digital & Gaming
                </h3>
                <p className="text-black">
                  From game credits to digital content, your WingClub points keep you playing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR PARTNERS SECTION */}
      <section id="partners-section" className="py-[130px] md:py-[146px]" style={{ backgroundColor: "#FFFCF2" }}>
        <div className="w-[90%] mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-4xl md:text-5xl font-semibold mb-4"
              style={{ color: "#5c3a3a" }}
            >
              Our Partners
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Browse our current partners and see how many points you need to
              redeem.
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3">
              {["All Partners", "Streaming", "Shopping", "Gaming", "Lifestyle"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      activeFilter === filter
                        ? "text-black"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    style={
                      activeFilter === filter
                        ? { backgroundColor: "#f4c430" }
                        : {}
                    }
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-0">
            {filteredPartners.map((partner, index) => {
              const largestLogos = ["Audiomack", "PlayStation", "Chowdeck", "MTN Play"];
              const largerLogos = ["Indriver", "Prime Video"];
              const smallerLogos = ["Xbox", "Spotify", "Apple Music", "YouTube"];
              const isLargest = largestLogos.includes(partner.name);
              const isLarger = largerLogos.includes(partner.name);
              const isSmaller = smallerLogos.includes(partner.name);
              const logoSize = isLargest ? "w-36 h-36" : isLarger ? "w-28 h-28" : isSmaller ? "w-20 h-20" : "w-24 h-24";

              return (
                <div
                  key={index}
                  className="h-32 flex flex-col items-center justify-center hover:scale-110 transition-all cursor-pointer"
                >
                  <div className={`${logoSize} flex items-center justify-center`}>
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section style={{ backgroundColor: "#F7C400" }}>
        <div className="max-w-4xl mx-auto px-6 py-[130px] md:py-[146px] text-center">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: "#542526" }}
          >
            Earn Once. Spend Everywhere.
          </h2>
          <p className="text-xl mb-10 text-black">
            Join thousands of members who are getting more from their rewards
            with WingClub.
          </p>
          <Link href="/wingclub">
            <button
              className="px-10 py-4 rounded-full font-bold text-lg text-white transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: "#542526" }}
            >
              Join WingClub
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
