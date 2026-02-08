'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Flavor {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  spice_level: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  sizes: {
    id: string;
    name: string;
    price: number;
    is_default: boolean;
  }[];
}

interface CartItem {
  id: string;
  name: string;
  flavor: string | string[];
  size: string;
  price: number;
  quantity: number;
  image: string;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
}

export default function ValentinesPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeFlavorCategory, setActiveFlavorCategory] = useState('BBQ');
  const router = useRouter();

  // Fixed Valentine's Day delivery date
  const valentinesDeliveryDate = '2026-02-14';

  // Flavor category mapping
  const flavorCategories: Record<string, string[]> = {
    'BOLD & FUN': ['The Italian', 'Wing of the North', 'Tokyo', 'Hot Nuts', 'The Slayer'],
    'BBQ': ['BBQ Rush', 'BBQ Fire'],
    'HOT': ['Wingferno', 'Dragon Breath', 'Braveheart', 'Mango Heat'],
    'DRY RUB': ['Lemon Pepper', 'Cameroon Rub', 'Caribbean Jerk', 'Yaji'],
    'SWEET': ['Sweet Dreams', 'Yellow Gold'],
    'BOOZY': ['Whiskey Vibes', 'Tequila Wingrise', 'Gustavo']
  };

  // Available time slots
  const timeSlots = [
    '8AM - 10AM',
    '10AM - 12PM',
    '12PM - 2PM',
    '2PM - 4PM',
    '4PM - 6PM',
    '6PM - 8PM',
    '8PM - 10PM',
  ];

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('wingside-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch (error) {
        console.error('Error parsing cart:', error);
      }
    }
  }, []);

  // Fetch product and flavors
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Valentine product
        const productResponse = await fetch('/api/products?category=valentine-special', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        const productData = await productResponse.json();

        if (productData.products && productData.products.length > 0) {
          setProduct(productData.products[0]);
          // Set price from the first (and only) size
          if (productData.products[0].sizes && productData.products[0].sizes.length > 0) {
            setProductPrice(productData.products[0].sizes[0].price);
          }
        }

        // Fetch flavors
        const flavorsResponse = await fetch('/api/flavors', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        const flavorsData = await flavorsResponse.json();

        if (flavorsData.flavors) {
          setFlavors(flavorsData.flavors.filter((f: Flavor) => f.category));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFlavorToggle = (flavorName: string) => {
    if (selectedFlavors.length < 3) {
      // Add flavor (can be duplicate)
      setSelectedFlavors([...selectedFlavors, flavorName]);
    }
  };

  const removeFlavorAt = (index: number) => {
    setSelectedFlavors(selectedFlavors.filter((_, i) => i !== index));
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem('wingside-cart', JSON.stringify(updatedCart));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handleAddToCart = () => {
    if (!product || selectedFlavors.length !== 3 || !selectedTimeSlot) {
      alert('Please select 3 flavors and time slot');
      return;
    }

    setAddingToCart(true);

    // Create cart item
    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      flavor: selectedFlavors,
      size: product.sizes[0]?.name || 'Regular',
      price: productPrice,
      quantity: quantity,
      image: product.image_url || '/wingbox1.png',
      deliveryDate: valentinesDeliveryDate,
      deliveryTime: selectedTimeSlot,
      notes: notes.trim() || undefined,
    };

    // Add to cart
    const updatedCart = [...cart, cartItem];
    setCart(updatedCart);
    localStorage.setItem('wingside-cart', JSON.stringify(updatedCart));

    setAddingToCart(false);
    setShowOrderModal(true);

    // Reset selections
    setSelectedFlavors([]);
    setQuantity(1);
    setNotes('');

    // Close modal after 3 seconds
    setTimeout(() => {
      setShowOrderModal(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Success Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center  animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#552627] mb-2">Added to Cart!</h3>
            <p className="text-gray-600 mb-6">
              Your Valentine's special has been added to your cart
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                Continue Shopping
              </button>
              <Link
                href="/order"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-semibold hover:from-red-600 hover:to-pink-600 transition-all"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/val-hero.png"
            alt="Valentine's Day"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Decorative hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-float opacity-20 text-red-400">♥</div>
          <div className="absolute top-40 right-20 text-4xl animate-float-delayed opacity-20 text-pink-400">♥</div>
          <div className="absolute bottom-32 left-1/4 text-5xl animate-float opacity-20 text-red-300">♥</div>
          <div className="absolute top-1/3 right-1/3 text-3xl animate-float-delayed opacity-20 text-pink-300">♥</div>
          <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-20 text-red-400">♥</div>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-16">
          {/* Badge at Top */}
          <div>
            <div className="inline-block bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2.5 rounded-full ">
              <span className="text-sm font-bold text-white tracking-wide">Valentine's Special</span>
            </div>
          </div>

          {/* Text Content at Bottom */}
          <div className="w-full max-w-6xl">
            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Love isn't in one flavor
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base lg:text-lg text-white/80 mb-8 max-w-3xl leading-snug font-light">
              This Valentine's, share the love with our exclusive special.
              Treat your special someone to wings that speak the language of love.
            </p>
          </div>
        </div>
      </div>

      {/* Product Section */}
      <div id="valentine-special" className="py-20 md:py-32 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
            </div>
          ) : product ? (
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Product Image */}
              <div className="order-2 md:order-1">
                <div className="relative">
                  {/* Image container */}
                  <div className="relative bg-white rounded-3xl overflow-hidden">
                    <img
                      src={product.image_url || '/wingbox1.png'}
                      alt={product.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="order-1 md:order-2 space-y-4">
                {/* Product name */}
                <div>
                  <div className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                    Limited Time Only
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#552627] mb-2">
                    {product.name}
                  </h2>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-base text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Flavor Selection */}
                <div className="bg-white rounded-xl p-4 border-2 border-pink-200">
                  <h3 className="text-lg font-bold text-[#552627] mb-1">
                    Select 3 Flavors
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {selectedFlavors.length}/3 flavors selected
                  </p>

                  {/* Flavor Categories */}
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {Object.keys(flavorCategories).map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveFlavorCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          activeFlavorCategory === category
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Flavor Options */}
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-3">
                    {flavors
                      .filter((flavor) => flavor.category === activeFlavorCategory)
                      .map((flavor) => {
                        const isDisabled = selectedFlavors.length >= 3;

                        return (
                          <button
                            key={flavor.id}
                            onClick={() => !isDisabled && handleFlavorToggle(flavor.name)}
                            disabled={isDisabled}
                            className={`p-2 rounded-lg text-left transition-all text-sm ${
                              isDisabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-50 text-gray-800 hover:bg-pink-50 hover:border-pink-300 border-2 border-transparent'
                            }`}
                          >
                            <div className="font-semibold text-sm">{flavor.name}</div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Selected Flavors Summary */}
                  {selectedFlavors.length > 0 && (
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFlavors.map((flavor, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-800 border border-pink-200"
                          >
                            {flavor}
                            <button
                              onClick={() => removeFlavorAt(index)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Date Notice */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-[#552627]">
                        Delivery: Valentine's Day
                      </p>
                      <p className="text-xs text-gray-600">
                        February 14th, 2026
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Slot & Notes Section */}
                <div className="bg-white rounded-xl p-4 border-2 border-pink-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Time Slot */}
                    <div>
                      <label className="block text-lg font-bold text-[#552627] mb-2">
                        Time Slot
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                              selectedTimeSlot === slot
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white ring-2 ring-red-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-700'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col">
                      <label className="block text-lg font-bold text-[#552627] mb-2">
                        Special Notes <span className="text-sm font-normal text-gray-500">(Optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any special instructions or requests..."
                        className="flex-1 w-full px-3 py-2.5 border-2 border-pink-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-500 transition-all resize-none"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity & Price Section */}
                <div className="bg-white rounded-xl p-4 border-2 border-pink-200">
                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white font-bold text-lg transition-all"
                      >
                        −
                      </button>
                      <span className="text-2xl font-bold text-[#552627] min-w-[50px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white font-bold text-lg transition-all"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price */}
                    {productPrice > 0 && (
                      <div className="flex items-center">
                        <span className="text-3xl font-bold text-black">
                          ₦{(productPrice * quantity).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order CTA */}
                <div>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedFlavors.length !== 3 || !selectedTimeSlot || addingToCart}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                      selectedFlavors.length !== 3 || !selectedTimeSlot || addingToCart
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:scale-105'
                    }`}
                  >
                    <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Valentine Special Available</h3>
              <p className="text-gray-600 mb-6">Check back soon for our special offerings!</p>
              <Link
                href="/order"
                className="inline-block bg-[#F7C400] text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#e5b500] transition-colors"
              >
                Browse All Menu
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 right-0 w-full md:w-96 bg-white  border-t-4 border-red-500 z-40 max-h-[70vh] flex flex-col">
          {/* Cart Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Your Cart</h3>
              <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {cart.map((item, index) => {
                const flavorDisplay = Array.isArray(item.flavor)
                  ? item.flavor.join(', ')
                  : item.flavor;

                return (
                  <div key={index} className="border-b pb-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {item.quantity}x {item.name}
                        </div>
                        {flavorDisplay && (
                          <div className="text-sm text-gray-600 mt-1">{flavorDisplay}</div>
                        )}
                        {item.deliveryDate && (
                          <div className="text-xs text-pink-600 font-semibold mt-1">
                            {new Date(item.deliveryDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        {item.deliveryTime && (
                          <div className="text-xs text-pink-600 font-semibold">
                            {item.deliveryTime}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Footer */}
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-red-600">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <Link
              href="/order"
              className="block w-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-center px-6 py-4 rounded-full font-bold text-lg hover:from-red-600 hover:to-pink-600 transition-all "
            >
              Continue to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
