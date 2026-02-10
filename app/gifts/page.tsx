'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type CardDesign =
  | 'val-01.png' | 'val-02.png' | 'val-03.png' | 'val-04.png'
  | 'gift-love1.png' | 'gift-love2.png' | 'gift-love3.png'
  | 'gift-love4.png' | 'gift-love5.png' | 'gift-love6.png';
type Denomination = 15000 | 20000 | 50000;

export default function GiftsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<CardDesign | null>(null);
  const [selectedDenomination, setSelectedDenomination] = useState<Denomination | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, []);

  const handleCardClick = async (design: CardDesign) => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to login
      router.push('/login?redirect=/gifts');
      return;
    }

    // Open modal with selected design
    setSelectedDesign(design);
    setShowModal(true);
    setError('');
  };

  const handlePurchase = async () => {
    if (!selectedDenomination || !recipientName || !recipientEmail) {
      setError('Please fill in all fields and select a denomination');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      const { token, headerName } = await csrfResponse.json();

      // Call purchase API
      const response = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [headerName]: token,
        },
        body: JSON.stringify({
          denomination: selectedDenomination,
          design_image: selectedDesign,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize purchase');
      }

      // Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDesign(null);
    setSelectedDenomination(null);
    setRecipientName('');
    setRecipientEmail('');
    setError('');
  };

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

      {/* Happy Valentine's Section */}
      <div className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-[#FDF5E5]">
        <div className="max-w-7xl mx-auto">
          {/* Category Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#552627] mb-12">
            Happy Valentine's
          </h2>

          {/* Grid - 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Valentine Card 1 */}
            <div
              onClick={() => handleCardClick('val-01.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/val-01.png" alt="Valentine Gift Card 1" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Valentine Card 2 */}
            <div
              onClick={() => handleCardClick('val-02.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/val-02.png" alt="Valentine Gift Card 2" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Valentine Card 3 */}
            <div
              onClick={() => handleCardClick('val-03.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/val-03.png" alt="Valentine Gift Card 3" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Valentine Card 4 */}
            <div
              onClick={() => handleCardClick('val-04.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/val-04.png" alt="Valentine Gift Card 4" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>
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
            <div
              onClick={() => handleCardClick('gift-love1.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love1.png" alt="Sweet Love" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Gift Card 2 */}
            <div
              onClick={() => handleCardClick('gift-love2.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love2.png" alt="Romantic" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Gift Card 3 */}
            <div
              onClick={() => handleCardClick('gift-love3.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love3.png" alt="Valentine" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Gift Card 4 */}
            <div
              onClick={() => handleCardClick('gift-love4.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love4.png" alt="Adore You" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Gift Card 5 */}
            <div
              onClick={() => handleCardClick('gift-love5.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love5.png" alt="Forever Love" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>

            {/* Gift Card 6 */}
            <div
              onClick={() => handleCardClick('gift-love6.png')}
              className="relative rounded-3xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img src="/gift-love6.png" alt="Heartbeat" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-[#F7C400] text-[#552627] px-6 py-3 rounded-full font-semibold transition-opacity">
                  Purchase
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#552627]">Purchase Gift Card</h3>
              <button
                onClick={closeModal}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Selected Card Preview */}
              {selectedDesign && (
                <div className="mb-6">
                  <img
                    src={`/${selectedDesign}`}
                    alt="Selected Card Design"
                    className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                  />
                </div>
              )}

              {/* Denomination Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#552627] mb-3">
                  Choose Amount
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedDenomination(15000)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all disabled:opacity-50 ${
                      selectedDenomination === 15000
                        ? 'border-[#F7C400] bg-[#FDF5E5] text-[#552627]'
                        : 'border-gray-200 hover:border-[#F7C400] text-gray-700'
                    }`}
                  >
                    <div className="text-2xl">₦15,000</div>
                  </button>
                  <button
                    onClick={() => setSelectedDenomination(20000)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all disabled:opacity-50 ${
                      selectedDenomination === 20000
                        ? 'border-[#F7C400] bg-[#FDF5E5] text-[#552627]'
                        : 'border-gray-200 hover:border-[#F7C400] text-gray-700'
                    }`}
                  >
                    <div className="text-2xl">₦20,000</div>
                  </button>
                  <button
                    onClick={() => setSelectedDenomination(50000)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all disabled:opacity-50 ${
                      selectedDenomination === 50000
                        ? 'border-[#F7C400] bg-[#FDF5E5] text-[#552627]'
                        : 'border-gray-200 hover:border-[#F7C400] text-gray-700'
                    }`}
                  >
                    <div className="text-2xl">₦50,000</div>
                  </button>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-[#552627] mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter recipient's name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#552627] mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter recipient's email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="bg-[#FDF5E5] rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-[#552627] mb-3">Gift Card Features:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#F7C400] mr-2">✓</span>
                    <span>Delivered instantly via email to recipient</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F7C400] mr-2">✓</span>
                    <span>Unique 12-digit code for easy redemption</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F7C400] mr-2">✓</span>
                    <span>Valid for 6 months from purchase date</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F7C400] mr-2">✓</span>
                    <span>Can be used for any wings order</span>
                  </li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isLoading || !selectedDenomination || !recipientName || !recipientEmail}
                  className="flex-1 px-6 py-3 bg-[#F7C400] text-[#552627] rounded-lg font-semibold hover:bg-[#e5b500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
