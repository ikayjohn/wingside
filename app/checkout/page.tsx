"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    deliveryArea: '',
    firstName: '',
    lastName: '',
    phone: '',
    streetAddress: '',
    streetAddress2: '',
    city: 'Port Harcourt',
    email: '',
    createAccount: false,
    agreeTerms: false,
  });

  const [promoCode, setPromoCode] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wingside-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Reset delivery area when switching between delivery and pickup
  useEffect(() => {
    setFormData(prev => ({ ...prev, deliveryArea: '' }));
  }, [orderType]);

  // Delivery fee mapping
  const deliveryFees: { [key: string]: number } = {
    'pickup-autograph': 0,
    'pickup-gra': 0,
    'new-gra': 1000,
    'd-line': 1000,
    'stadium-road': 1000,
    'old-gra': 1000,
    'town': 1000,
    'borokiri': 1200,
    'olu-obasanjo': 1200,
    'diobu-mile-1': 1200,
    'diobu-mile-2': 1300,
    'diobu-mile-3': 1400,
    'trans-amadi': 1500,
    'shell-ra': 1500,
    'elelenwo': 1600,
    'rumuola': 1700,
    'rumuokwuta': 1800,
    'rumuigbo': 1900,
    'nkpogu': 1900,
    'peter-odili': 2000,
    'woji': 2100,
    'rumuomasi': 2200,
    'rumuodara': 2300,
    'oginigba': 2300,
    'rumuibekwe': 2300,
    'rumuodomaya': 2400,
    'rumuokoro': 2700,
    'rumunduru': 2900,
    'eliozu': 3000,
    'eliowhani': 3100,
    'mgbuoba': 3200,
    'okuru': 3200,
    'akpajo': 3200,
    'choba': 3500,
    'alakahia': 3700,
    'aluu': 4000,
    'igwuruta': 4500,
    'omagwa': 4500,
    'airport-road': 5000,
  };

  // Delivery area display names
  const deliveryAreaNames: { [key: string]: string } = {
    'pickup-autograph': 'Pickup – Wingside, Autograph Mall',
    'pickup-gra': 'Pickup – Wingside, 24 King Perekule Street, GRA',
    'new-gra': 'New GRA',
    'd-line': 'D-Line',
    'stadium-road': 'Stadium Road',
    'old-gra': 'Old GRA',
    'town': 'Town',
    'borokiri': 'Borokiri',
    'olu-obasanjo': 'Olu Obasanjo',
    'diobu-mile-1': 'Diobu Mile 1',
    'diobu-mile-2': 'Diobu Mile 2',
    'diobu-mile-3': 'Diobu Mile 3',
    'trans-amadi': 'Trans-Amadi',
    'shell-ra': 'Shell RA',
    'elelenwo': 'Elelenwo (near side)',
    'rumuola': 'Rumuola',
    'rumuokwuta': 'Rumuokwuta',
    'rumuigbo': 'Rumuigbo',
    'nkpogu': 'Nkpogu',
    'peter-odili': 'Peter Odili Road',
    'woji': 'Woji',
    'rumuomasi': 'Rumuomasi',
    'rumuodara': 'Rumuodara',
    'oginigba': 'Oginigba',
    'rumuibekwe': 'Rumuibekwe',
    'rumuodomaya': 'Rumuodomaya',
    'rumuokoro': 'Rumuokoro',
    'rumunduru': 'Rumunduru',
    'eliozu': 'Eliozu',
    'eliowhani': 'Eliowhani',
    'mgbuoba': 'Mgbuoba',
    'okuru': 'Okuru',
    'akpajo': 'Akpajo',
    'choba': 'Choba',
    'alakahia': 'Alakahia',
    'aluu': 'Aluu',
    'igwuruta': 'Igwuruta',
    'omagwa': 'Omagwa',
    'airport-road': 'Airport Road',
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.075;
  const tax = subtotal * taxRate;
  const deliveryFee = formData.deliveryArea ? (deliveryFees[formData.deliveryArea] || 0) : 0;
  const total = subtotal + tax + deliveryFee;

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const newCart = prev.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      localStorage.setItem('wingside-cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('wingside-cart', JSON.stringify(newCart));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle order submission
    console.log('Order submitted:', { formData, cartItems, total });
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[900px] overflow-hidden">
        <img
          src="/order-hero.png"
          alt="Wings and more"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-start text-center text-white px-4 pt-12 md:pt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-yellow-400">WINGS</span> and so<br />
            "<span className="italic">munch</span>" more.
          </h1>
        </div>
      </section>

      {/* Description */}
      <section className="py-12 md:py-18 px-4 text-center">
        <p className="text-lg md:text-3xl text-gray-700 max-w-5xl mx-auto leading-relaxed">
          From expertly crafted espresso drinks and specialty lattes to<br className="hidden md:block" />
          refreshing iced teas, nutritious smoothies, and light café snacks.<br className="hidden md:block" />
          Every item is made fresh with premium ingredients.
        </p>
      </section>

      {/* Checkout Form Section */}
      <section className="py-8 md:py-12 gutter-x">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Left Column - Billing Details */}
              <div>
                {/* Delivery/Pickup Selection */}
                <div className="delivery-pickup-selector">
                  {/* Delivery Option */}
                  <div
                    className={`delivery-pickup-card ${orderType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    <div className="delivery-pickup-radio">
                      <div className={`radio-dot ${orderType === 'delivery' ? 'active' : ''}`}></div>
                    </div>
                    <div className="delivery-pickup-icon delivery-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="5.5" cy="17.5" r="3.5"></circle>
                        <circle cx="18.5" cy="17.5" r="3.5"></circle>
                        <path d="M5.5 14h7.5"></path>
                        <path d="M15 7l2 8h3l-2-8h-3z"></path>
                        <path d="M8 7l5 7"></path>
                        <path d="M13 14l5-7"></path>
                      </svg>
                    </div>
                    <h3 className="delivery-pickup-title">Delivery</h3>
                    <p className="delivery-pickup-desc">We'll bring it to your door</p>
                    <div className="delivery-pickup-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      20-30 mins
                    </div>
                  </div>

                  {/* Pickup Option */}
                  <div
                    className={`delivery-pickup-card ${orderType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setOrderType('pickup')}
                  >
                    <div className="delivery-pickup-radio">
                      <div className={`radio-dot ${orderType === 'pickup' ? 'active' : ''}`}></div>
                    </div>
                    <div className="delivery-pickup-icon pickup-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <h3 className="delivery-pickup-title">Pick Up</h3>
                    <p className="delivery-pickup-desc">Collect from our store</p>
                    <div className="delivery-pickup-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      20-30 mins
                    </div>
                  </div>
                </div>

                {/* Delivery Area / Pickup Store */}
                <div className="mb-8">
                  <label className="checkout-label">
                    {orderType === 'delivery' ? 'Delivery Area' : 'Pickup Store'}
                  </label>
                  <div className="relative">
                    <select
                      name="deliveryArea"
                      value={formData.deliveryArea}
                      onChange={handleInputChange}
                      className="checkout-select"
                    >
                      <option value="">
                        {orderType === 'delivery' ? 'Choose delivery area' : 'Choose pickup location'}
                      </option>
                      {orderType === 'pickup' ? (
                        <>
                          <option value="pickup-autograph">Wingside, Autograph Mall — FREE</option>
                          <option value="pickup-gra">Wingside, 24 King Perekule Street, GRA — FREE</option>
                        </>
                      ) : (
                        <>
                          <option value="new-gra">New GRA — ₦1,000</option>
                          <option value="d-line">D-Line — ₦1,000</option>
                          <option value="stadium-road">Stadium Road — ₦1,000</option>
                          <option value="old-gra">Old GRA — ₦1,000</option>
                          <option value="town">Town — ₦1,000</option>
                          <option value="borokiri">Borokiri — ₦1,200</option>
                          <option value="olu-obasanjo">Olu Obasanjo — ₦1,200</option>
                          <option value="diobu-mile-1">Diobu Mile 1 — ₦1,200</option>
                          <option value="diobu-mile-2">Diobu Mile 2 — ₦1,300</option>
                          <option value="diobu-mile-3">Diobu Mile 3 — ₦1,400</option>
                          <option value="trans-amadi">Trans-Amadi — ₦1,500</option>
                          <option value="shell-ra">Shell RA — ₦1,500</option>
                          <option value="elelenwo">Elelenwo (near side) — ₦1,600</option>
                          <option value="rumuola">Rumuola — ₦1,700</option>
                          <option value="rumuokwuta">Rumuokwuta — ₦1,800</option>
                          <option value="rumuigbo">Rumuigbo — ₦1,900</option>
                          <option value="nkpogu">Nkpogu — ₦1,900</option>
                          <option value="peter-odili">Peter Odili Road — ₦2,000</option>
                          <option value="woji">Woji — ₦2,100</option>
                          <option value="rumuomasi">Rumuomasi — ₦2,200</option>
                          <option value="rumuodara">Rumuodara — ₦2,300</option>
                          <option value="oginigba">Oginigba — ₦2,300</option>
                          <option value="rumuibekwe">Rumuibekwe — ₦2,300</option>
                          <option value="rumuodomaya">Rumuodomaya — ₦2,400</option>
                          <option value="rumuokoro">Rumuokoro — ₦2,700</option>
                          <option value="rumunduru">Rumunduru — ₦2,900</option>
                          <option value="eliozu">Eliozu — ₦3,000</option>
                          <option value="eliowhani">Eliowhani — ₦3,100</option>
                          <option value="mgbuoba">Mgbuoba — ₦3,200</option>
                          <option value="okuru">Okuru — ₦3,200</option>
                          <option value="akpajo">Akpajo — ₦3,200</option>
                          <option value="choba">Choba — ₦3,500</option>
                          <option value="alakahia">Alakahia — ₦3,700</option>
                          <option value="aluu">Aluu — ₦4,000</option>
                          <option value="igwuruta">Igwuruta — ₦4,500</option>
                          <option value="omagwa">Omagwa — ₦4,500</option>
                          <option value="airport-road">Airport Road — ₦5,000</option>
                        </>
                      )}
                    </select>
                    <div className="checkout-select-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h2 className="text-lg font-bold mb-4">Delivery Details</h2>

                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="checkout-label">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label className="checkout-label">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-4">
                    <label className="checkout-label">Contact Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="checkout-input"
                    />
                  </div>

                  {/* Street Address */}
                  <div className="mb-4">
                    <label className="checkout-label">Street Address</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      placeholder="House number and street address"
                      className="checkout-input"
                    />
                  </div>

                  {/* City & Email Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="checkout-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        readOnly
                        className="checkout-input bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="checkout-label">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@mail.com"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Create Account Checkbox */}
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      name="createAccount"
                      id="createAccount"
                      checked={formData.createAccount}
                      onChange={handleInputChange}
                      className="checkout-checkbox"
                    />
                    <label htmlFor="createAccount" className="text-sm text-gray-700">
                      Create an account
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <div className="checkout-summary-card">
                  <h2 className="text-lg font-bold mb-6">Order Summary</h2>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Your cart is empty</p>
                        <Link href="/order" className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 inline-block">
                          Go to Order Page
                        </Link>
                      </div>
                    ) : (
                      cartItems.map((item, index) => {
                        const flavorDisplay = Array.isArray(item.flavor)
                          ? item.flavor.join(', ')
                          : item.flavor;
                        const riceDisplay = Array.isArray(item.rice)
                          ? item.rice.join(', ')
                          : item.rice;
                        const drinkDisplay = Array.isArray(item.drink)
                          ? item.drink.join(', ')
                          : item.drink;

                        return (
                          <div key={index} className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.size}</p>
                              {flavorDisplay !== 'Regular' && (
                                <p className="text-xs text-gray-400 mt-0.5">{flavorDisplay}</p>
                              )}
                              {riceDisplay && (
                                <p className="text-xs text-gray-400 mt-0.5">Rice: {riceDisplay}</p>
                              )}
                              {drinkDisplay && (
                                <p className="text-xs text-gray-400 mt-0.5">Drink: {drinkDisplay}</p>
                              )}
                              {item.milkshake && (
                                <p className="text-xs text-gray-400 mt-0.5">Milkshake: {item.milkshake}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, -1)}
                                  className="checkout-qty-btn"
                                >
                                  −
                                </button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, 1)}
                                  className="checkout-qty-btn checkout-qty-btn-plus"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-medium min-w-[80px] text-right">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                aria-label="Remove item"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Subtotal */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Tax (7.5%)</span>
                    <span className="text-sm font-medium">{formatPrice(tax)}</span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="mb-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <circle cx="5.5" cy="17.5" r="3.5"></circle>
                          <circle cx="18.5" cy="17.5" r="3.5"></circle>
                          <path d="M2 5h8.5l3 7H22l-3 5H9"></path>
                          <path d="M9 12h3.5"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Delivery Fee</span>
                      </div>
                      <span className={`text-sm font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                        {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    {formData.deliveryArea && (
                      <p className="text-xs text-gray-400 mt-1 ml-6">
                        {deliveryAreaNames[formData.deliveryArea] || formData.deliveryArea}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <line x1="12" y1="22" x2="12" y2="7"></line>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Promo Code</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="checkout-input flex-1"
                      />
                      <button
                        type="button"
                        className="checkout-apply-btn"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Total */}
                  <div className="flex justify-between mb-6">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg">{formatPrice(total)}</span>
                  </div>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    className="checkout-submit-btn"
                  >
                    Place Order
                  </button>

                  {/* Trust Badges */}
                  <div className="flex justify-center gap-8 mt-6">
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <span className="text-xs text-gray-500">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                      <span className="text-xs text-gray-500">Fast Delivery</span>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 mt-6">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="checkout-checkbox mt-0.5"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-gray-600">
                      I have read and agree to the website{' '}
                      <Link href="/terms" className="text-blue-600 underline">
                        terms and conditions
                      </Link>
                      {' '}*
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}