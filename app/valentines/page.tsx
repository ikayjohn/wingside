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

interface ProductSelection {
  flavors: string[];
  quantity: number;
  notes: string;
  timeSlot: string;
}

export default function ValentinesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeFlavorCategory, setActiveFlavorCategory] = useState('BBQ');
  const [activeProductModal, setActiveProductModal] = useState<string | null>(null);
  
  const [productSelections, setProductSelections] = useState<Record<string, ProductSelection>>({});
  
  const router = useRouter();

  const valentinesDeliveryDate = '2026-02-14';

  const flavorCategories: Record<string, string[]> = {
    'BOLD & FUN': ['The Italian', 'Wing of the North', 'Tokyo', 'Hot Nuts', 'The Slayer'],
    'BBQ': ['BBQ Rush', 'BBQ Fire'],
    'HOT': ['Wingferno', 'Dragon Breath', 'Braveheart', 'Mango Heat'],
    'DRY RUB': ['Lemon Pepper', 'Cameroon Rub', 'Caribbean Jerk', 'Yaji'],
    'SWEET': ['Sweet Dreams', 'Yellow Gold'],
    'BOOZY': ['Whiskey Vibes', 'Tequila Wingrise', 'Gustavo']
  };

  const timeSlots = [
    '8AM - 10AM',
    '10AM - 12PM',
    '12PM - 2PM',
    '2PM - 4PM',
    '4PM - 6PM',
    '6PM - 8PM',
    '8PM - 10PM',
  ];

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

  useEffect(() => {
    async function fetchData() {
      try {
        const productResponse = await fetch('/api/products?category=valentine-special', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        const productData = await productResponse.json();

        if (productData.products && productData.products.length > 0) {
          setProducts(productData.products);
          
          const initialSelections: Record<string, ProductSelection> = {};
          productData.products.forEach((product: Product) => {
            initialSelections[product.id] = {
              flavors: [],
              quantity: 1,
              notes: '',
              timeSlot: ''
            };
          });
          setProductSelections(initialSelections);
        }

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

  const updateProductSelection = (productId: string, updates: Partial<ProductSelection>) => {
    setProductSelections(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...updates }
    }));
  };

  const handleFlavorToggle = (productId: string, flavorName: string) => {
    const selection = productSelections[productId];
    if (selection && selection.flavors.length < 3) {
      updateProductSelection(productId, {
        flavors: [...selection.flavors, flavorName]
      });
    }
  };

  const removeFlavorAt = (productId: string, index: number) => {
    const selection = productSelections[productId];
    if (selection) {
      updateProductSelection(productId, {
        flavors: selection.flavors.filter((_, i) => i !== index)
      });
    }
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

  const requiresFlavors = (productName: string) => {
    const nonWingProducts = ['rose flower', 'gift box', 'handwritten card', 'handwritten card & envelope'];
    return !nonWingProducts.some(name => productName.toLowerCase().includes(name));
  };

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const selection = productSelections[productId];

    if (!product || !selection) {
      alert('Product not found');
      return;
    }

    const needsFlavors = requiresFlavors(product.name);
    
    if (needsFlavors && selection.flavors.length !== 3) {
      alert('Please select 3 flavors');
      return;
    }

    if (!selection.timeSlot) {
      alert('Please select a delivery time slot');
      return;
    }

    if (product.name.toLowerCase().includes('handwritten card') && !selection.notes.trim()) {
      alert('Please enter your handwritten note');
      return;
    }

    setAddingToCart(true);

    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      flavor: needsFlavors ? selection.flavors : [],
      size: product.sizes[0]?.name || 'Regular',
      price: product.sizes[0]?.price || 0,
      quantity: selection.quantity,
      image: product.image_url || '/wingbox1.png',
      deliveryDate: valentinesDeliveryDate,
      deliveryTime: selection.timeSlot,
      notes: selection.notes.trim() || undefined,
    };

    const updatedCart = [...cart, cartItem];
    setCart(updatedCart);
    localStorage.setItem('wingside-cart', JSON.stringify(updatedCart));

    setAddingToCart(false);
    setActiveProductModal(null);
    setShowOrderModal(true);

    updateProductSelection(productId, {
      flavors: [],
      quantity: 1,
      notes: '',
      timeSlot: ''
    });

    setTimeout(() => {
      setShowOrderModal(false);
    }, 3000);
  };

  const openProductModal = (productId: string) => {
    setActiveProductModal(productId);
  };

  const closeProductModal = () => {
    setActiveProductModal(null);
  };

  const activeProduct = products.find(p => p.id === activeProductModal);
  const activeSelection = activeProductModal ? productSelections[activeProductModal] : null;

  return (
    <div className="min-h-screen bg-white relative">
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-fadeIn">
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

      {activeProduct && activeSelection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] animate-fadeIn flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#552627]">Customize Your Order</h2>
              <button
                onClick={closeProductModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <img
                      src={activeProduct.image_url || '/wingbox1.png'}
                      alt={activeProduct.name}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <h3 className="text-lg font-bold text-[#552627] mt-3 mb-1">{activeProduct.name}</h3>
                    {activeProduct.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{activeProduct.description}</p>
                    )}
                    <p className="text-xl font-bold text-black">
                      ₦{((activeProduct.sizes[0]?.price || 0) * activeSelection.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                    {requiresFlavors(activeProduct.name) && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-[#552627]">
                            Select 3 Flavors
                          </h3>
                          <span className="text-xs text-gray-600">
                            {activeSelection.flavors.length}/3 selected
                          </span>
                        </div>

                        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                          {Object.keys(flavorCategories).map((category) => (
                            <button
                              key={category}
                              onClick={() => setActiveFlavorCategory(category)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                activeFlavorCategory === category
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-5 gap-2 mb-2">
                          {flavors
                            .filter((flavor) => flavor.category === activeFlavorCategory)
                            .map((flavor) => {
                              const isSelected = activeSelection.flavors.includes(flavor.name);
                              const isDisabled = activeSelection.flavors.length >= 3 && !isSelected;

                              return (
                                <button
                                  key={flavor.id}
                                  onClick={() => !isDisabled && handleFlavorToggle(activeProduct.id, flavor.name)}
                                  disabled={isDisabled}
                                  className={`p-2 rounded-lg text-left transition-all text-xs ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white ring-2 ring-red-300'
                                      : isDisabled
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-white text-gray-800 hover:bg-pink-50 border border-gray-200 hover:border-pink-300'
                                  }`}
                                >
                                  <div className="font-semibold leading-tight">{flavor.name}</div>
                                </button>
                              );
                            })}
                        </div>

                        {activeSelection.flavors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {activeSelection.flavors.map((flavor, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-pink-500 px-2 py-1 rounded-full text-xs font-medium text-white"
                              >
                                {flavor}
                                <button
                                  onClick={() => removeFlavorAt(activeProduct.id, index)}
                                  className="text-white hover:text-red-200 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`grid gap-3 ${!activeProduct.name.toLowerCase().includes('gift box') && !activeProduct.name.toLowerCase().includes('rose flower') ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        <div>
                          <label className="block text-sm font-bold text-[#552627] mb-2">
                            Delivery Time Slot
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => updateProductSelection(activeProduct.id, { timeSlot: slot })}
                                className={`px-2 py-2 rounded-lg font-semibold text-xs transition-all ${
                                  activeSelection.timeSlot === slot
                                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white ring-2 ring-red-300'
                                    : 'bg-white text-gray-700 hover:bg-pink-100 hover:text-pink-700 border border-gray-200'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {!activeProduct.name.toLowerCase().includes('gift box') && !activeProduct.name.toLowerCase().includes('rose flower') && (
                          <div>
                            <label className="block text-sm font-bold text-[#552627] mb-2">
                              {activeProduct.name.toLowerCase().includes('handwritten card') ? (
                                <>Handwritten Note <span className="text-red-500">*</span></>
                              ) : activeProduct.name.toLowerCase().includes('valentine package') ? (
                                <>Handwritten Note <span className="text-xs font-normal text-gray-500">(Optional)</span></>
                              ) : (
                                <>Notes <span className="text-xs font-normal text-gray-500">(Optional)</span></>
                              )}
                            </label>
                            <textarea
                              value={activeSelection.notes}
                              onChange={(e) => updateProductSelection(activeProduct.id, { notes: e.target.value })}
                              placeholder={
                                activeProduct.name.toLowerCase().includes('handwritten card') || activeProduct.name.toLowerCase().includes('valentine package')
                                  ? "Enter your handwritten note..."
                                  : "Special instructions..."
                              }
                              className={`w-full px-3 py-2 border border-pink-300 rounded-lg text-xs focus:ring-2 focus:ring-pink-300 focus:border-pink-500 transition-all resize-none ${
                                activeProduct.name.toLowerCase().includes('handwritten card') ? 'h-[150px]' : 'h-[80px]'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateProductSelection(activeProduct.id, { quantity: Math.max(1, activeSelection.quantity - 1) })}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white font-bold text-base transition-all"
                            >
                              −
                            </button>
                            <span className="text-xl font-bold text-[#552627] min-w-[40px] text-center">
                              {activeSelection.quantity}
                            </span>
                            <button
                              onClick={() => updateProductSelection(activeProduct.id, { quantity: activeSelection.quantity + 1 })}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white font-bold text-base transition-all"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-gray-600">Quantity</span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-600">Total</div>
                          <div className="text-2xl font-bold text-black">
                            ₦{((activeProduct.sizes[0]?.price || 0) * activeSelection.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 border border-red-200">
                      <div className="flex items-center gap-2 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 flex-shrink-0">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <p className="font-semibold text-[#552627]">
                          Delivery: Valentine's Day (February 14th, 2026)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={closeProductModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold text-base hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddToCart(activeProduct.id)}
                  disabled={
                    (requiresFlavors(activeProduct.name) && activeSelection.flavors.length !== 3) ||
                    !activeSelection.timeSlot ||
                    addingToCart
                  }
                  className={`flex-1 px-6 py-3 rounded-full font-bold text-base transition-all duration-300 ${
                    (requiresFlavors(activeProduct.name) && activeSelection.flavors.length !== 3) ||
                    !activeSelection.timeSlot ||
                    addingToCart
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 hover:scale-105'
                  }`}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/val-hero.png"
            alt="Valentine's Day"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-float opacity-20 text-red-400">♥</div>
          <div className="absolute top-40 right-20 text-4xl animate-float-delayed opacity-20 text-pink-400">♥</div>
          <div className="absolute bottom-32 left-1/4 text-5xl animate-float opacity-20 text-red-300">♥</div>
          <div className="absolute top-1/3 right-1/3 text-3xl animate-float-delayed opacity-20 text-pink-300">♥</div>
          <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-20 text-red-400">♥</div>
        </div>

        <div className="relative h-full flex flex-col justify-between px-4 md:px-8 lg:px-16 py-10 md:py-16">
          <div>
            <div className="inline-block bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2.5 rounded-full">
              <span className="text-sm font-bold text-white tracking-wide">Valentine's Special</span>
            </div>
          </div>

          <div className="w-full max-w-6xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Love isn't in one flavor
            </h1>

            <p className="text-sm md:text-base lg:text-lg text-white/80 mb-8 max-w-3xl leading-snug font-light">
              This Valentine's, share the love with our exclusive special.
              Treat your special someone to wings that speak the language of love.
            </p>
          </div>
        </div>
      </div>

      <div className="py-20 md:py-32 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-white to-pink-50">
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product) => {
                const productPrice = product.sizes[0]?.price || 0;

                return (
                  <div key={product.id} className="bg-white rounded-3xl overflow-hidden border border-pink-200 flex flex-col">
                    <div className="relative flex-shrink-0">
                      <img
                        src={product.image_url || '/wingbox1.png'}
                        alt={product.name}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                          Limited Time Only
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <h2 className="text-lg md:text-xl font-bold text-[#552627] mb-2">
                          {product.name}
                        </h2>
                        {product.description && (
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-bold text-black">
                            ₦{productPrice.toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => openProductModal(product.id)}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-sm hover:from-red-600 hover:to-pink-600 hover:scale-105 transition-all duration-300"
                        >
                          Customize Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {cart.length > 0 && (
        <div className="fixed bottom-0 right-0 w-full md:w-96 bg-white border-t-4 border-red-500 z-40 max-h-[70vh] flex flex-col">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Your Cart</h3>
              <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

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

          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-red-600">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <Link
              href="/order"
              className="block w-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-center px-6 py-4 rounded-full font-bold text-lg hover:from-red-600 hover:to-pink-600 transition-all"
            >
              Continue to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
