"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface CartItem {
  id: string;
  name: string;
  flavor: string | string[];
  size: string;
  price: number;
  quantity: number;
  image: string;
  rice?: string | string[];
  drink?: string | string[];
  milkshake?: string;
  cake?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  image: string;
  flavors: string[];
  sizes: { name: string; price: number }[];
  badge?: string;
  flavorCount?: number;
  wingCount?: string;
  flavorLabel?: string;
  riceOptions?: { name: string; price: number }[];
  riceCount?: number;
  drinkOptions?: string[];
  drinkCount?: number;
  milkshakeOptions?: string[];
  cakeOptions?: string[];
  description?: string;
}

const wingCafeSubcategories = [
  'Coffee Classics',
  'Everyday Sips',
  'Toasted & Spiced Lattes',
  'Gourmet & Dessert-Inspired Lattes',
  'Matcha Lattes',
  'Chai Lattes',
  'Hot Smelts',
  'Teas',
  'Wingfreshers',
  'Milkshakes',
  'Signature Pairings'
];

export default function OrderPage() {
  const [activeCategory, setActiveCategory] = useState('Wings');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string[]>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedRice, setSelectedRice] = useState<Record<string, string[]>>({});
  const [selectedDrinks, setSelectedDrinks] = useState<Record<string, string[]>>({});
  const [selectedMilkshakes, setSelectedMilkshakes] = useState<Record<string, string>>({});
  const [selectedCakes, setSelectedCakes] = useState<Record<string, string>>({});
  const [selectedFlavorCategory, setSelectedFlavorCategory] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['Wings', 'Sides', 'Sandwiches', 'Wraps', 'Salads', 'Wing Cafe', 'Pastries', 'Wingside Special', 'Drinks', 'Meal Deals', 'Kids'];

  // Flavor category mapping
  const flavorCategories = {
    'HOT': ['Wingferno', 'Dragon Breath', 'Braveheart', 'Mango Heat'],
    'BBQ': ['BBQ Rush', 'BBQ Fire'],
    'DRY RUB': ['Lemon Pepper', 'Cameroon Rub', 'Caribbean Jerk', 'Yaji'],
    'BOLD & FUN': ['The Italian', 'Wing of the North', 'Tokyo', 'Hot Nuts', 'The Slayer'],
    'SWEET': ['Sweet Dreams', 'Yellow Gold'],
    'BOOZY': ['Whiskey Vibes', 'Tequila Wingrise', 'Gustavo']
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wingside-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wingside-cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch products from API on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (data.products) {
          // Transform API data to match expected format
          const transformedProducts = data.products.map((p: any) => ({
            id: p.id, // Keep as UUID string
            name: p.name,
            category: p.category?.name || 'Wings',
            subcategory: p.subcategory,
            image: p.image_url || p.image,
            flavors: p.flavors || [],
            sizes: p.sizes || [],
            badge: p.badge,
            flavorCount: p.max_flavors || 1,
            wingCount: p.wing_count,
            flavorLabel: p.flavorLabel, // Use camelCase from API
            description: p.description,
          }));
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);


  const filteredProducts = products
    .filter(product => {
      if (product.category !== activeCategory) return false;
      if (activeCategory === 'Wing Cafe' && activeSubcategory && product.subcategory !== activeSubcategory) return false;
      return true;
    })
    .sort((a, b) => {
      // Get the lowest price for each product
      const minPriceA = Math.min(...a.sizes.map(s => s.price));
      const minPriceB = Math.min(...b.sizes.map(s => s.price));
      return minPriceA - minPriceB;
    });

  // Reset subcategory when changing main category
  useEffect(() => {
    if (activeCategory === 'Wing Cafe' && !activeSubcategory) {
      setActiveSubcategory(wingCafeSubcategories[0]);
    } else if (activeCategory !== 'Wing Cafe') {
      setActiveSubcategory('');
    }
  }, [activeCategory, activeSubcategory]);

  const handleFlavorCategorySelect = (productId: string, category: string) => {
    setSelectedFlavorCategory(prev => ({
      ...prev,
      [productId]: prev[productId] === category ? '' : category
    }));
  };

  const categoryHasSelectedFlavors = (productId: string, category: string): boolean => {
    const selectedFlavorsList = selectedFlavors[productId] || [];
    const categoryFlavors = flavorCategories[category as keyof typeof flavorCategories] || [];
    return selectedFlavorsList.some(flavor => categoryFlavors.includes(flavor));
  };

  const handleFlavorSelect = (productId: string, flavor: string, maxCount: number = 1) => {
    setSelectedFlavors(prev => {
      const current = prev[productId] || [];

      if (maxCount === 1) {
        // For single selection, clicking a flavor selects it (replaces current selection)
        const index = current.indexOf(flavor);
        if (index > -1) {
          // Already selected, deselect if clicking the same flavor
          return { ...prev, [productId]: [] };
        } else {
          // Select the new flavor (replaces any existing selection)
          return { ...prev, [productId]: [flavor] };
        }
      } else {
        // For multiple selection, allow adding same flavor multiple times
        if (current.length < maxCount) {
          // Add flavor (duplicates allowed)
          return { ...prev, [productId]: [...current, flavor] };
        }
        // Silently prevent adding more if at limit
        return prev;
      }
    });
  };

  const handleFlavorRemove = (productId: string, flavor: string) => {
    setSelectedFlavors(prev => {
      const current = prev[productId] || [];
      const index = current.indexOf(flavor);

      if (index > -1) {
        // Remove only one instance of this flavor
        const newFlavors = [...current];
        newFlavors.splice(index, 1);
        return { ...prev, [productId]: newFlavors };
      }
      return prev;
    });
  };

  const handleSizeSelect = (productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleRiceSelect = (productId: string, rice: string, maxCount: number = 1) => {
    setSelectedRice(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : (prev[productId] ? [prev[productId] as string] : []);

      if (maxCount === 1) {
        // For single selection
        return { ...prev, [productId]: [rice] };
      } else {
        // For multiple selection, allow adding same rice multiple times
        if (current.length < maxCount) {
          return { ...prev, [productId]: [...current, rice] };
        }
        // Silently prevent adding more if at limit
        return prev;
      }
    });
  };

  const handleRiceRemove = (productId: string, rice: string) => {
    setSelectedRice(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : [];
      const index = current.indexOf(rice);

      if (index > -1) {
        const newRice = [...current];
        newRice.splice(index, 1);
        return { ...prev, [productId]: newRice };
      }
      return prev;
    });
  };

  const handleDrinkSelect = (productId: string, drink: string, maxCount: number = 1) => {
    setSelectedDrinks(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : (prev[productId] ? [prev[productId] as string] : []);

      if (maxCount === 1) {
        // For single selection
        return { ...prev, [productId]: [drink] };
      } else {
        // For multiple selection, allow adding same drink multiple times
        if (current.length < maxCount) {
          return { ...prev, [productId]: [...current, drink] };
        }
        // Silently prevent adding more if at limit
        return prev;
      }
    });
  };

  const handleDrinkRemove = (productId: string, drink: string) => {
    setSelectedDrinks(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : [];
      const index = current.indexOf(drink);

      if (index > -1) {
        const newDrinks = [...current];
        newDrinks.splice(index, 1);
        return { ...prev, [productId]: newDrinks };
      }
      return prev;
    });
  };

  const handleMilkshakeSelect = (productId: string, milkshake: string) => {
    setSelectedMilkshakes(prev => ({ ...prev, [productId]: milkshake }));
  };

  const handleCakeSelect = (productId: string, cake: string) => {
    setSelectedCakes(prev => ({ ...prev, [productId]: cake }));
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

  const getProductPrice = (product: Product): number => {
    const selectedSize = selectedSizes[product.id] || product.sizes[0]?.name || '';
    const size = product.sizes.find(s => s.name === selectedSize);
    let basePrice = size?.price || product.sizes[0]?.price || 0;

    // Add rice price if applicable
    if (product.riceOptions) {
      const selectedRiceOption = selectedRice[product.id];
      if (selectedRiceOption && selectedRiceOption.length > 0) {
        const riceOption = product.riceOptions.find(r => r.name === selectedRiceOption[0]);
        if (riceOption) {
          basePrice += riceOption.price;
        }
      }
    }

    return basePrice;
  };

  const addToCart = (product: Product) => {
    let selectedFlavorArray = selectedFlavors[product.id] || [];
    const flavorCount = product.flavorCount || 1;

    // Auto-select flavor for simple items (single flavor products)
    if (selectedFlavorArray.length === 0 && product.flavors.length === 1) {
      selectedFlavorArray = [product.flavors[0]];
    }

    // Check if at least one flavor is selected (only for products with flavors)
    if (product.flavors.length > 0 && selectedFlavorArray.length === 0) {
      return; // Silently prevent adding to cart
    }

    // Check if not exceeding max flavors
    if (selectedFlavorArray.length > flavorCount) {
      return; // Silently prevent adding to cart
    }

    const flavor = flavorCount === 1 ? selectedFlavorArray[0] : selectedFlavorArray;
    const size = selectedSizes[product.id] || product.sizes[0]?.name || '';
    const quantity = quantities[product.id] || 1;
    const price = getProductPrice(product);
    const rice = product.riceOptions ? selectedRice[product.id] : undefined;
    const drink = product.drinkOptions ? selectedDrinks[product.id] : undefined;
    const milkshake = product.milkshakeOptions ? selectedMilkshakes[product.id] : undefined;
    const cake = product.cakeOptions ? selectedCakes[product.id] : undefined;

    const flavorKey = Array.isArray(flavor) ? flavor.join(',') : flavor;
    const riceKey = Array.isArray(rice) ? rice.join(',') : rice;
    const drinkKey = Array.isArray(drink) ? drink.join(',') : drink;

    const existingItemIndex = cart.findIndex(
      item => {
        const itemFlavorKey = Array.isArray(item.flavor) ? item.flavor.join(',') : item.flavor;
        const itemRiceKey = Array.isArray(item.rice) ? item.rice.join(',') : item.rice;
        const itemDrinkKey = Array.isArray(item.drink) ? item.drink.join(',') : item.drink;

        return item.id === product.id &&
               itemFlavorKey === flavorKey &&
               item.size === size &&
               itemRiceKey === riceKey &&
               itemDrinkKey === drinkKey &&
               item.milkshake === milkshake &&
               item.cake === cake;
      }
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
        ...(rice && { rice }),
        ...(drink && { drink }),
        ...(milkshake && { milkshake }),
        ...(cake && { cake }),
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
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

      {/* Wing Cafe Subcategory Tabs */}
      {activeCategory === 'Wing Cafe' && (
        <section className="px-4 md:px-8 lg:px-16 mb-4">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {wingCafeSubcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => setActiveSubcategory(subcat)}
                className={`order-flavor-btn ${activeSubcategory === subcat ? 'active' : ''}`}
              >
                {subcat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products and Cart Grid */}
      <section className="px-4 md:px-8 lg:px-16 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found in this category.</p>
              </div>
            ) : (
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
                      className="w-full aspect-[2/1] object-cover rounded-lg"
                      style={{ contentVisibility: 'auto' }}
                    />
                  </div>

                  {/* Product Name */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    {product.wingCount && (
                      <p className="text-sm font-normal text-gray-600">{product.wingCount}</p>
                    )}
                  </div>

                  {/* Select Flavor */}
                  {(product.flavors.length > 1 || (product.flavorCount && product.flavorCount > 1)) && (
                    <div className="mb-4">
                      {/* Category-based selection for products with many flavor options */}
                      {product.flavors.length >= 10 ? (
                        <>
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-gray-700">
                              Select Flavor Category
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Choose a category to see available flavors
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {Object.keys(flavorCategories).map((category) => {
                              const isOpen = selectedFlavorCategory[product.id] === category;
                              const hasSelectedFlavors = categoryHasSelectedFlavors(product.id, category);
                              return (
                                <button
                                  key={category}
                                  onClick={() => handleFlavorCategorySelect(product.id, category)}
                                  className={`order-flavor-btn ${isOpen ? 'active' : ''} flex items-center gap-1`}
                                  style={hasSelectedFlavors && !isOpen ? { backgroundColor: '#FEF3C7' } : undefined}
                                >
                                  <span>{category}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s ease'
                                    }}
                                  >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </button>
                              );
                            })}
                          </div>

                          {/* Show flavors dropdown when category is selected */}
                          {selectedFlavorCategory[product.id] && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                {selectedFlavorCategory[product.id]} Flavors:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {flavorCategories[selectedFlavorCategory[product.id] as keyof typeof flavorCategories].map((flavor) => {
                                  const selectedCount = (selectedFlavors[product.id] || []).filter(f => f === flavor).length;
                                  const isSelected = selectedCount > 0;

                                  return (
                                    <div key={flavor} className="relative inline-flex items-center gap-1">
                                      <button
                                        onClick={() => handleFlavorSelect(product.id, flavor, product.flavorCount || 1)}
                                        className={`order-flavor-btn ${isSelected ? 'active' : ''}`}
                                      >
                                        {flavor}
                                        {selectedCount > 1 && (
                                          <span className="ml-1.5 text-xs font-bold bg-yellow-500 text-black rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
                                            {selectedCount}
                                          </span>
                                        )}
                                      </button>
                                      {isSelected && (product.flavorCount && product.flavorCount > 1) && (
                                        <button
                                          onClick={() => handleFlavorRemove(product.id, flavor)}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                          aria-label="Remove one"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Default flavor selection for other products */
                        <>
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-gray-700">
                              {product.flavorLabel || `Select Flavor${product.flavorCount && product.flavorCount > 1 ? 's' : ''}`}
                            </p>
                            {product.flavorCount && product.flavorCount > 1 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Pick {product.flavorCount} - mix & match as you like! ({(selectedFlavors[product.id] || []).length}/{product.flavorCount})
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {product.flavors.map((flavor) => {
                              const selectedCount = (selectedFlavors[product.id] || []).filter(f => f === flavor).length;
                              const isSelected = selectedCount > 0;

                              return (
                                <div key={flavor} className="relative inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleFlavorSelect(product.id, flavor, product.flavorCount || 1)}
                                    className={`order-flavor-btn ${isSelected ? 'active' : ''}`}
                                  >
                                    {flavor}
                                    {selectedCount > 1 && (
                                      <span className="ml-1.5 text-xs font-bold bg-yellow-500 text-black rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
                                        {selectedCount}
                                      </span>
                                    )}
                                  </button>
                                  {isSelected && (product.flavorCount && product.flavorCount > 1) && (
                                    <button
                                      onClick={() => handleFlavorRemove(product.id, flavor)}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                      aria-label="Remove one"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Size */}
                  {product.sizes.length > 1 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Size:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size.name}
                            onClick={() => handleSizeSelect(product.id, size.name)}
                            className={`order-size-btn ${(selectedSizes[product.id]) === size.name ? 'active' : ''}`}
                          >
                            {size.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rice Selection */}
                  {product.riceOptions && product.riceOptions.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-700">Choose Your Rice:</p>
                        {product.riceCount && product.riceCount > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Pick {product.riceCount} - mix & match as you like! ({Array.isArray(selectedRice[product.id]) ? selectedRice[product.id].length : (selectedRice[product.id] ? 1 : 0)}/{product.riceCount})
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.riceOptions.map((rice) => {
                          const current: string[] = Array.isArray(selectedRice[product.id]) ? selectedRice[product.id] : [];
                          const selectedCount = current.filter((r: string) => r === rice.name).length;
                          const isSelected = selectedCount > 0;
                          const isSingleSelect = !product.riceCount || product.riceCount === 1;

                          return (
                            <div key={rice.name} className="relative inline-flex items-center gap-1">
                              <button
                                onClick={() => handleRiceSelect(product.id, rice.name, product.riceCount || 1)}
                                className={`order-size-btn ${isSingleSelect ? ((selectedRice[product.id] && selectedRice[product.id][0]) === rice.name ? 'active' : '') : (isSelected ? 'active' : '')}`}
                              >
                                {rice.name}
                                {rice.price > 0 && <span className="text-xs ml-1">(+₦{rice.price})</span>}
                                {selectedCount > 1 && (
                                  <span className="ml-1.5 text-xs font-bold bg-yellow-500 text-black rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
                                    {selectedCount}
                                  </span>
                                )}
                              </button>
                              {isSelected && product.riceCount && product.riceCount > 1 && (
                                <button
                                  onClick={() => handleRiceRemove(product.id, rice.name)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  aria-label="Remove one"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Drink Selection */}
                  {product.drinkOptions && product.drinkOptions.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-700">Choose Your Drink:</p>
                        {product.drinkCount && product.drinkCount > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Pick {product.drinkCount} - mix & match as you like! ({Array.isArray(selectedDrinks[product.id]) ? selectedDrinks[product.id].length : (selectedDrinks[product.id] ? 1 : 0)}/{product.drinkCount})
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.drinkOptions.map((drink) => {
                          const current: string[] = Array.isArray(selectedDrinks[product.id]) ? selectedDrinks[product.id] : [];
                          const selectedCount = current.filter((d: string) => d === drink).length;
                          const isSelected = selectedCount > 0;
                          const isSingleSelect = !product.drinkCount || product.drinkCount === 1;

                          return (
                            <div key={drink} className="relative inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDrinkSelect(product.id, drink, product.drinkCount || 1)}
                                className={`order-size-btn ${isSingleSelect ? (selectedDrinks[product.id] && selectedDrinks[product.id][0] === drink ? 'active' : '') : (isSelected ? 'active' : '')}`}
                              >
                                {drink}
                                {selectedCount > 1 && (
                                  <span className="ml-1.5 text-xs font-bold bg-yellow-500 text-black rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
                                    {selectedCount}
                                  </span>
                                )}
                              </button>
                              {isSelected && product.drinkCount && product.drinkCount > 1 && (
                                <button
                                  onClick={() => handleDrinkRemove(product.id, drink)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  aria-label="Remove one"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Milkshake Selection */}
                  {product.milkshakeOptions && product.milkshakeOptions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Choose Your Milkshake:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.milkshakeOptions.map((milkshake) => (
                          <button
                            key={milkshake}
                            onClick={() => handleMilkshakeSelect(product.id, milkshake)}
                            className={`order-size-btn ${selectedMilkshakes[product.id] === milkshake ? 'active' : ''}`}
                          >
                            {milkshake}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cake Selection */}
                  {product.cakeOptions && product.cakeOptions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Choose Your Cake Slice:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.cakeOptions.map((cake) => (
                          <button
                            key={cake}
                            onClick={() => handleCakeSelect(product.id, cake)}
                            className={`order-size-btn ${selectedCakes[product.id] === cake ? 'active' : ''}`}
                          >
                            {cake}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mb-4 mt-[30px]">
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
                    className="order-add-btn mt-[20px]"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:w-80">
            <div className="order-cart-card sticky top-4">
              <h3 className="font-bold text-lg mb-4">Your Cart</h3>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm mb-6">
                  Your cart is empty… but your cravings aren’t!
                </p>
              ) : (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {cart.map((item, index) => {
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
                      <div key={index} className="flex justify-between items-start text-sm gap-2">
                        <div className="flex-1">
                          <div>{item.quantity}x {item.name}</div>
                          {flavorDisplay !== 'Regular' && (
                            <div className="text-xs text-gray-500 mt-0.5">{flavorDisplay}</div>
                          )}
                          {riceDisplay && (
                            <div className="text-xs text-gray-500 mt-0.5">Rice: {riceDisplay}</div>
                          )}
                          {drinkDisplay && (
                            <div className="text-xs text-gray-500 mt-0.5">Drink: {drinkDisplay}</div>
                          )}
                          {item.milkshake && (
                            <div className="text-xs text-gray-500 mt-0.5">Milkshake: {item.milkshake}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="ml-2">{formatPrice(item.price * item.quantity)}</span>
                          <button
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
                  })}
                </div>
              )}

              <div className="border-t pt-4 mb-6">
                {/* Subtotal */}
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <button className="order-checkout-btn">
                  Continue to Checkout
                </button>
              </Link>

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