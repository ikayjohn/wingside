"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartnershipsPage() {
  const [activeFilter, setActiveFilter] = useState("All Partners");

  const partners = [
    // Row 1
    { name: "Netflix", category: "Streaming", color: "#E50914" },
    { name: "Spotify", category: "Streaming", color: "#1DB954" },
    { name: "Amazon", category: "Shopping", color: "#FF9900" },
    { name: "Target", category: "Shopping", color: "#CC0000" },
    { name: "PlayStation", category: "Gaming", color: "#003791" },
    { name: "Xbox", category: "Gaming", color: "#107C10" },
    { name: "DoorDash", category: "Lifestyle", color: "#FF3008" },
    { name: "Uber", category: "Lifestyle", color: "#000000" },
    // Row 2
    { name: "Apple Music", category: "Streaming", color: "#FA243C" },
    { name: "Prime Video", category: "Streaming", color: "#00A8E1" },
    { name: "Disney+", category: "Streaming", color: "#113CCF" },
    { name: "Bolt", category: "Lifestyle", color: "#48DA95" },
    { name: "Hulu", category: "Streaming", color: "#1CE783" },
    { name: "Walmart", category: "Shopping", color: "#0071CE" },
    { name: "Starbucks", category: "Lifestyle", color: "#00704A" },
    { name: "ShopRite", category: "Shopping", color: "#FF6600" },
  ];

  const filteredPartners =
    activeFilter === "All Partners"
      ? partners
      : partners.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO SECTION */}
      <section
        className="relative min-h-[600px] flex items-center"
        style={{ backgroundColor: "#5c3a3a" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20 w-full">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#f4e4b8", color: "#5c3a3a" }}
            >
              Now available with 250 partner brands
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="block" style={{ color: "#f4c430" }}>
              Your Wings
            </span>
            <span className="block text-white">Go Further</span>
          </h1>

          {/* Subtext */}
          <p
            className="text-xl md:text-2xl mb-10 max-w-2xl"
            style={{ color: "#f4e4b8" }}
          >
            Turn your Wingside points into streaming subscriptions, shopping
            credits, gaming passes, and more.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              style={{
                backgroundColor: "#f4c430",
                color: "#5c3a3a",
              }}
            >
              Explore Partners
            </button>
            <Link href="/wingclub">
              <button
                className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-white text-white transition-all hover:scale-105"
                style={{ backgroundColor: "transparent" }}
              >
                Join the WingClub
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{ backgroundColor: "#f4e4b8" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-start mb-16">
            <h2
              className="text-4xl md:text-5xl font-black max-w-md"
              style={{ color: "#5c3a3a" }}
            >
              How it works
            </h2>
            <p
              className="text-lg mt-6 md:mt-0 max-w-md"
              style={{ color: "#5c3a3a" }}
            >
              From earning to spending, your WingClub journey is simple and
              straightforward.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "#f4e4b8" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#5c3a3a" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
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
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "#f4e4b8" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#5c3a3a" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
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
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "#f4e4b8" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#5c3a3a" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
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
      <section className="bg-white py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <h2
                className="text-4xl md:text-5xl font-black mb-6"
                style={{ color: "#5c3a3a" }}
              >
                More than a restaurant card
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Your WingClub card opens doors to a world of possibilities. From
                streaming your favorite shows to gaming with friends, your
                points give you the freedom to enjoy what you love.
              </p>
              <p className="text-lg text-gray-600">
                Redeem points for subscriptions, shopping credits, gaming
                passes, and much more. It's your rewards, your way.
              </p>
            </div>

            {/* Right Column - Card Display */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-600 text-sm mb-2">WingClub Balance</p>
                <p className="text-4xl font-black" style={{ color: "#f4c430" }}>
                  2,450
                </p>
              </div>

              <h3 className="font-bold text-lg mb-4" style={{ color: "#5c3a3a" }}>
                Redeem for:
              </h3>

              <div className="space-y-4">
                {/* Netflix */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#E50914" }}
                  >
                    <span className="text-white text-xl">🎬</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-800">Netflix Subscription</p>
                    <p className="text-sm text-gray-600">20 points/month</p>
                  </div>
                </div>

                {/* Shopping */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#9333EA" }}
                  >
                    <span className="text-white text-xl">🛍️</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-800">Shopping Credit</p>
                    <p className="text-sm text-gray-600">100 points = $1</p>
                  </div>
                </div>

                {/* Xbox */}
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#107C10" }}
                  >
                    <span className="text-white text-xl">🎮</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-800">Xbox Streaming</p>
                    <p className="text-sm text-gray-600">50 points/month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHERE YOU CAN USE YOUR POINTS SECTION */}
      <section style={{ backgroundColor: "#5c3a3a" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Where You Can Use Your Points
            </h2>
            <p className="text-xl" style={{ color: "#f4e4b8" }}>
              Explore partner brands across streaming, shopping, gaming, and
              more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Streaming Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <div className="h-48 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <span className="text-white text-6xl">📺</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: "#5c3a3a" }}>
                  Streaming & Entertainment
                </h3>
                <p className="text-gray-600">
                  Netflix, Hulu, Disney+, HBO Max, and more
                </p>
              </div>
            </div>

            {/* Shopping Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white text-6xl">🛍️</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: "#5c3a3a" }}>
                  Shopping & Lifestyle
                </h3>
                <p className="text-gray-600">
                  Amazon, Target, Walmart, Starbucks, and more
                </p>
              </div>
            </div>

            {/* Gaming Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <span className="text-white text-6xl">🎮</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: "#5c3a3a" }}>
                  Digital & Gaming
                </h3>
                <p className="text-gray-600">
                  Xbox, PlayStation, Apple Music, and more
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR PARTNERS SECTION */}
      <section className="bg-white py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-4xl md:text-5xl font-black mb-4"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredPartners.map((partner, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl p-6 flex flex-col items-center justify-center shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer bg-white border-2 border-gray-100"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-white font-bold text-xs"
                  style={{ backgroundColor: partner.color }}
                >
                  {partner.name.substring(0, 2).toUpperCase()}
                </div>
                <p className="font-semibold text-sm text-center" style={{ color: "#5c3a3a" }}>
                  {partner.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section style={{ backgroundColor: "#ffd700" }}>
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-24 text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-6"
            style={{ color: "#2c1810" }}
          >
            Earn Once. Spend Everywhere.
          </h2>
          <p className="text-xl mb-10" style={{ color: "#5c3a3a" }}>
            Join thousands of members who are getting more from their rewards
            with WingClub.
          </p>
          <Link href="/wingclub">
            <button
              className="px-10 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: "#2c1810" }}
            >
              Join WingClub
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
