"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Types
interface CartItem {
  id: number;
  name: string;
  flavor: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  flavors: string[];
  sizes: { name: string; price: number }[];
  badge?: string;
}

export default function OrderPage() {
  const [activeCategory, setActiveCategory] = useState('Wings');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: number]: string }>({});
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: string }>({});
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const categories = ['Wings', 'Coffee', 'Sandwiches', 'Wraps', 'Salads', 'Milkshakes', 'Drinks', 'Meal Deals', 'Party Packs'];

  const products: Product[] = [
    {
      id: 1,
      name: 'BBQ',
      category: 'Wings',
      image: '/order-bbq.png',
      flavors: ['BBQ Fire', 'BBQ Rush'],
      sizes: [
        { name: 'Rookie Pack', price: 4500 },
        { name: 'Regular Pack', price: 6500 },
        { name: 'Pro Pack', price: 8500 },
        { name: 'Veteran Pack', price: 12000 },
        { name: 'Troll Product', price: 15000 },
      ],
      badge: 'Bestseller',
    },
    {
      id: 2,
      name: 'HOT',
      category: 'Wings',
      image: '/order-hot.png',
      flavors: ['Brave Heart', 'Dragon Breath'],
      sizes: [
        { name: 'Rookie Pack', price: 4500 },
        { name: 'Regular Pack', price: 6500 },
        { name: 'Pro Pack', price: 8500 },
        { name: 'Veteran Pack', price: 12000 },
        { name: 'Troll Product', price: 15000 },
      ],
    },
    {
      id: 3,
      name: 'SPICY DRY',
      category: 'Wings',
      image: '/order-spicydry.png',
      flavors: ['Lemon Pepper', 'Cameroon Rub', 'Caribbean Jerk'],
      sizes: [
        { name: 'Rookie Pack', price: 4500 },
        { name: 'Regular Pack', price: 6500 },
        { name: 'Pro Pack', price: 8500 },
        { name: 'Veteran Pack', price: 12000 },
        { name: 'Troll Product', price: 15000 },
      ],
    },
    {
      id: 4,
      name: 'BOLD & FUN',
      category: 'Wings',
      image: '/order-boldfun.png',
      flavors: ['Italian', 'Tokyo', 'Wing of the North', 'Hot Nuts'],
      sizes: [
        { name: 'Rookie Pack', price: 4500 },
        { name: 'Regular Pack', price: 6500 },
        { name: 'Pro Pack', price: 8500 },
        { name: 'Veteran Pack', price: 12000 },
        { name: 'Troll Product', price: 15000 },
      ],
    },
    {
      id: 5,
      name: 'Latte',
      category: 'Coffee',
      image: '/order-latte.png',
      flavors: ['Vanilla', 'Caramel', 'Hazelnut'],
      sizes: [
        { name: 'Small', price: 1500 },
        { name: 'Medium', price: 2000 },
        { name: 'Large', price: 2500 },
      ],
    },
    {
      id: 6,
      name: 'Chicken Sandwich',
      category: 'Sandwiches',
      image: '/order-sandwich.png',
      flavors: ['Classic', 'Spicy', 'BBQ'],
      sizes: [
        { name: 'Regular', price: 3500 },
        { name: 'Large', price: 4500 },
      ],
    },
  ];

  const filteredProducts = products.filter(product => product.category === activeCategory);

  const handleFlavorSelect = (productId: number, flavor: string) => {
    setSelectedFlavors(prev => ({ ...prev, [productId]: flavor }));
  };

  const handleSizeSelect = (productId: number, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

  const getProductPrice = (product: Product): number => {
    const selectedSize = selectedSizes[product.id] || product.sizes[0].name;
    const size = product.sizes.find(s => s.name === selectedSize);
    return size?.price || product.sizes[0].price;
  };

  const addToCart = (product: Product) => {
    const flavor = selectedFlavors[product.id] || product.flavors[0];
    const size = selectedSizes[product.id] || product.sizes[0].name;
    const quantity = quantities[product.id] || 1;
    const price = getProductPrice(product);

    const existingItemIndex = cart.findIndex(
      item => item.id === product.id && item.flavor === flavor && item.size === size
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        flavor,
        size,
        price,
        quantity,
        image: product.image,
      }]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦');
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
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

      {/* Category Tabs */}
      <section className="px-4 md:px-8 lg:px-16">
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`order-category-tab ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products and Cart Grid */}
      <section className="px-4 md:px-8 lg:px-16 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="order-product-card">
                  {/* Product Image */}
                  <div className="relative mb-4">
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {product.badge}
                      </span>
                    )}
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Name */}
                  <h3 className="font-bold text-lg mb-3">{product.name}</h3>

                  {/* Select Flavour */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Select Flavour</p>
                    <div className="flex flex-wrap gap-2">
                      {product.flavors.map((flavor) => (
                        <button
                          key={flavor}
                          onClick={() => handleFlavorSelect(product.id, flavor)}
                          className={`order-flavor-btn ${selectedFlavors[product.id] === flavor ? 'active' : ''}`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Size:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => handleSizeSelect(product.id, size.name)}
                          className={`order-size-btn ${selectedSizes[product.id] === size.name ? 'active' : ''}`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">{formatPrice(getProductPrice(product))}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="order-qty-btn"
                      >
                        −
                      </button>
                      <span className="font-semibold w-6 text-center">{quantities[product.id] || 1}</span>
                      <button 
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="order-qty-btn order-qty-btn-plus"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button 
                    onClick={() => addToCart(product)}
                    className="order-add-btn"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:w-80">
            <div className="order-cart-card sticky top-4">
              <h3 className="font-bold text-lg mb-4">Your Cart</h3>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm mb-6">
                  Looks like you haven't added any delicious wings yet. Time to take flight with some amazing flavors!
                </p>
              ) : (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name} ({item.flavor})</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              <button className="order-checkout-btn">
                Continue to Checkout
              </button>

              {/* Icons */}
              <div className="flex justify-center gap-8 mt-6 pt-6 border-t">
                <div className="flex flex-col items-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <span className="text-xs mt-1">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="text-xs mt-1">Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}