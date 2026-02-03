'use client';

export default function GiftsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[600px]">
        <img
          src="/gift-hero.png"
          alt="Wingside Gifts"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-22">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-[#F7C400] px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-800">Gifts & Cards</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Give the Gift of Wings
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white mb-8 max-w-3xl leading-relaxed">
              Perfect for every occasion. Share the love of wings with gift cards, special packages, and more.
            </p>

            {/* CTA Button */}
            <a
              href="#gift-options"
              className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
            >
              Explore Gift Options
            </a>
          </div>
        </div>
      </div>

      {/* Gift Cards Section */}
      <div className="py-16 md:py-24 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Category Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#552627] mb-12">
            Love
          </h2>

          {/* Grid - 4 columns x 2 rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gift Card 1 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love1.png" alt="Sweet Love" className="w-full h-auto object-cover" />
            </div>

            {/* Gift Card 2 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love2.png" alt="Romantic" className="w-full h-auto object-cover" />
            </div>

            {/* Gift Card 3 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love3.png" alt="Valentine" className="w-full h-auto object-cover" />
            </div>

            {/* Gift Card 4 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love4.png" alt="Adore You" className="w-full h-auto object-cover" />
            </div>

            {/* Gift Card 5 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love5.png" alt="Forever Love" className="w-full h-auto object-cover" />
            </div>

            {/* Gift Card 6 */}
            <div className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img src="/gift-love6.png" alt="Heartbeat" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
