"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface CartItem {
  id: number;
  name: string;
  flavor: string | string[];
  size: string;
  price: number;
  quantity: number;
  image: string;
  rice?: string | string[];
  drink?: string | string[];
  milkshake?: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
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
}

export default function OrderPage() {
  const [activeCategory, setActiveCategory] = useState('Wings');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: number]: string[] }>({});
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: string }>({});
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [selectedRice, setSelectedRice] = useState<{ [key: number]: string | string[] }>({});
  const [selectedDrinks, setSelectedDrinks] = useState<{ [key: number]: string | string[] }>({});
  const [selectedMilkshakes, setSelectedMilkshakes] = useState<{ [key: number]: string }>({});

  const categories = ['Wings', 'Sides', 'Sandwiches', 'Wraps', 'Salads', 'Milkshakes', 'Wing Cafe', 'Pastries', 'Wingside Special', 'Drinks', 'Meal Deals', 'Party Packs'];

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

  const products: Product[] = [
    {
      id: 1,
      name: 'Rookie Pack',
      category: 'Wings',
      image: '/order-rookie-pack.jpg',
      flavors: [  'BBQ Fire',
  'BBQ Rush',
  'Braveheart',
  'Cameroon Rub',
  'Caribbean Jerk',
  'Dragon Breath',
  'Gustavo',
  'Hot Nuts',
  'Italian',
  'Lemon Pepper',
  'Mango Heat',
  'Sweet Dreams',
  'Tequila Wingrise',
  'The Slayer',
  'Tokyo',
  'Wing of the North',
  'Wingferno',
  'Whiskey Vibes',
  'Yaji',
  'Yellow Gold'
],
      sizes: [
        { name: 'Regular', price: 7500 },
      ],
      flavorCount: 1,
      wingCount: '6 wings',
    },
    {
      id: 2,
      name: 'Regular Pack',
      category: 'Wings',
      image: '/order-regular-pack.jpg',
      flavors: [  'BBQ Fire',
  'BBQ Rush',
  'Braveheart',
  'Cameroon Rub',
  'Caribbean Jerk',
  'Dragon Breath',
  'Gustavo',
  'Hot Nuts',
  'Italian',
  'Lemon Pepper',
  'Mango Heat',
  'Sweet Dreams',
  'Tequila Wingrise',
  'The Slayer',
  'Tokyo',
  'Wing of the North',
  'Wingferno',
  'Whiskey Vibes',
  'Yaji',
  'Yellow Gold'
],

      sizes: [
        { name: 'Regular', price: 14000 },
      ],
      flavorCount: 2,
      wingCount: '12 wings',
    },
    {
      id: 3,
      name: 'Pro Pack',
      category: 'Wings',
      image: '/order-pro-pack.jpg',
 flavors: [  'BBQ Fire',
  'BBQ Rush',
  'Braveheart',
  'Cameroon Rub',
  'Caribbean Jerk',
  'Dragon Breath',
  'Gustavo',
  'Hot Nuts',
  'Italian',
  'Lemon Pepper',
  'Mango Heat',
  'Sweet Dreams',
  'Tequila Wingrise',
  'The Slayer',
  'Tokyo',
  'Wing of the North',
  'Wingferno',
  'Whiskey Vibes',
  'Yaji',
  'Yellow Gold'
],

      sizes: [
        { name: 'Regular', price: 20000 },
      ],
      flavorCount: 3,
      wingCount: '18 wings',
    },
    {
      id: 4,
      name: 'Veteran Pack',
      category: 'Wings',
      image: '/order-veteran-pack.jpg',
 flavors: [  'BBQ Fire',
  'BBQ Rush',
  'Braveheart',
  'Cameroon Rub',
  'Caribbean Jerk',
  'Dragon Breath',
  'Gustavo',
  'Hot Nuts',
  'Italian',
  'Lemon Pepper',
  'Mango Heat',
  'Sweet Dreams',
  'Tequila Wingrise',
  'The Slayer',
  'Tokyo',
  'Wing of the North',
  'Wingferno',
  'Whiskey Vibes',
  'Yaji',
  'Yellow Gold'
],

      sizes: [
        { name: 'Regular', price: 30000 },
      ],
      flavorCount: 4,
      wingCount: '30 wings',
    },
    {
      id: 5,
      name: 'Latte',
      category: 'Wing Cafe',
      image: '/order-latte.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4500 },
      ],
    },
    {
      id: 6,
      name: 'Chicken Bacon Sandwich',
      category: 'Sandwiches',
      image: '/order-chicken-bacon-sandwich.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 11,
      name: 'Chicken Salad Sandwich',
      category: 'Sandwiches',
      image: '/order-chicken-salad-sandwich.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3000 },
      ],
    },
    {
      id: 12,
      name: 'Egg Salad Sandwich',
      category: 'Sandwiches',
      image: '/order-egg-salad-sandwich.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3000 },
      ],
    },
    {
      id: 7,
      name: 'Bacon Coconut Rice',
      category: 'Sides',
      image: '/order-bacon-coconut-rice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4000 },
      ],
    },
    {
      id: 8,
      name: 'Potato Wedges',
      category: 'Sides',
      image: '/order-potato-wedges.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 9,
      name: 'Fiesta Rice',
      category: 'Sides',
      image: '/order-fiesta-rice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 10,
      name: 'French Fries',
      category: 'Sides',
      image: '/order-french-fries.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 19,
      name: 'Jollof Rice',
      category: 'Sides',
      image: '/order-jollof-rice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 37,
      name: 'Fried Plantain',
      category: 'Sides',
      image: '/order-fried-plantain.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 1500 },
      ],
    },
    {
      id: 20,
      name: 'Cookie Shake',
      category: 'Milkshakes',
      image: '/order-cookie-shake.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 9000 },
      ],
    },
    {
      id: 21,
      name: 'Malted Shake',
      category: 'Milkshakes',
      image: '/order-malted-shake.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 9000 },
      ],
    },
    {
      id: 22,
      name: 'Strawberry Shake',
      category: 'Milkshakes',
      image: '/order-strawberry-shake.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 9000 },
      ],
    },
    {
      id: 23,
      name: 'Vanilla Shake',
      category: 'Milkshakes',
      image: '/order-vanilla-shake.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 9000 },
      ],
    },
    {
      id: 38,
      name: 'Espresso (x2)',
      category: 'Wing Cafe',
      image: '/order-espresso-x2.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 3500 },
      ],
    },
    {
      id: 24,
      name: 'Cappuccino',
      category: 'Wing Cafe',
      image: '/order-cappuccino.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4500 },
      ],
    },
    {
      id: 25,
      name: 'Chai Latte',
      category: 'Wing Cafe',
      image: '/order-chai-latte.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4500 },
      ],
    },
    {
      id: 26,
      name: 'Hot Chocolate',
      category: 'Wing Cafe',
      image: '/order-hot-chocolate.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4500 },
      ],
    },
    {
      id: 27,
      name: 'Iced Coffee',
      category: 'Wing Cafe',
      image: '/order-iced-coffee.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4500 },
      ],
    },
    {
      id: 28,
      name: 'Banana Cake Slice',
      category: 'Pastries',
      image: '/order-banana-cake-slice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 2000 },
      ],
    },
    {
      id: 29,
      name: 'Chocolate Cake Slice',
      category: 'Pastries',
      image: '/order-chocolate-cake-slice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 2000 },
      ],
    },
    {
      id: 30,
      name: 'Vanilla Cake Slice',
      category: 'Pastries',
      image: '/order-vanilla-cake-slice.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 2000 },
      ],
    },
    {
      id: 31,
      name: 'Scones',
      category: 'Pastries',
      image: '/order-scones.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 2000 },
      ],
    },
    {
      id: 32,
      name: 'Hot Cross Bun x6',
      category: 'Pastries',
      image: '/order-hot-cross-bun-x6.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 12500 },
      ],
    },
    {
      id: 48,
      name: 'Hot Cross Bun',
      category: 'Pastries',
      image: '/order-hot-cross-bun.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 1250 },
      ],
    },
    {
      id: 33,
      name: 'Fried Chicken Sandwich',
      category: 'Wingside Special',
      image: '/order-fried-chicken-sandwich.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 7500 },
      ],
    },
    {
      id: 34,
      name: 'Loaded Fries',
      category: 'Wingside Special',
      image: '/order-loaded-fries.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 12000 },
      ],
    },
    {
      id: 35,
      name: 'Hunger Games',
      category: 'Party Packs',
      image: '/order-hunger-games.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 50000 },
      ],
    },
    {
      id: 36,
      name: 'Lord of the Wings',
      category: 'Party Packs',
      image: '/order-lord-of-the-wings.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 80000 },
      ],
    },
    {
      id: 39,
      name: 'Water',
      category: 'Drinks',
      image: '/order-water.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 750 },
      ],
    },
    {
      id: 40,
      name: 'Soft Drinks',
      category: 'Drinks',
      image: '/order-soft-drinks.jpg',
      flavors: ['Coke', 'Fanta', 'Sprite'],
      sizes: [
        { name: 'Regular', price: 1250 },
      ],
      flavorLabel: 'Drink Option',
    },
    {
      id: 41,
      name: 'Prime (Hydrated drink)',
      category: 'Drinks',
      image: '/order-prime-hydrated-drink.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4000 },
      ],
    },
    {
      id: 42,
      name: 'Beer',
      category: 'Drinks',
      image: '/order-beer.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 2500 },
      ],
    },
    {
      id: 43,
      name: 'Lone Ranger',
      category: 'Meal Deals',
      image: '/order-lone-ranger.jpg',
      flavors: [
        'BBQ Fire',
        'BBQ Rush',
        'Braveheart',
        'Cameroon Rub',
        'Caribbean Jerk',
        'Dragon Breath',
        'Gustavo',
        'Hot Nuts',
        'Italian',
        'Lemon Pepper',
        'Mango Heat',
        'Sweet Dreams',
        'Tequila Wingrise',
        'The Slayer',
        'Tokyo',
        'Wing of the North',
        'Wingferno',
        'Whiskey Vibes',
        'Yaji',
        'Yellow Gold'
      ],
      sizes: [
        { name: 'Regular', price: 7000 },
      ],
      wingCount: '3 Wings, Rice, Drink',
      flavorCount: 1,
      riceOptions: [
        { name: 'Jollof Rice', price: 0 },
        { name: 'Fiesta Rice', price: 0 },
        { name: 'Bacon Coconut Rice', price: 500 },
      ],
      drinkOptions: ['Coke', 'Fanta', 'Sprite', 'Water'],
    },
    {
      id: 44,
      name: 'Pairfect Combo',
      category: 'Meal Deals',
      image: '/order-pairfect-combo.jpg',
      flavors: [
        'BBQ Fire',
        'BBQ Rush',
        'Braveheart',
        'Cameroon Rub',
        'Caribbean Jerk',
        'Dragon Breath',
        'Gustavo',
        'Hot Nuts',
        'Italian',
        'Lemon Pepper',
        'Mango Heat',
        'Sweet Dreams',
        'Tequila Wingrise',
        'The Slayer',
        'Tokyo',
        'Wing of the North',
        'Wingferno',
        'Whiskey Vibes',
        'Yaji',
        'Yellow Gold'
      ],
      sizes: [
        { name: 'Regular', price: 15000 },
      ],
      wingCount: '6 Wings, Milkshake',
      flavorCount: 1,
      milkshakeOptions: ['Cookie Shake', 'Malted Shake', 'Strawberry Shake', 'Vanilla Shake'],
    },
    {
      id: 46,
      name: 'Value Pack',
      category: 'Meal Deals',
      image: '/order-value-pack.jpg',
      flavors: [
        'BBQ Fire',
        'BBQ Rush',
        'Braveheart',
        'Cameroon Rub',
        'Caribbean Jerk',
        'Dragon Breath',
        'Gustavo',
        'Hot Nuts',
        'Italian',
        'Lemon Pepper',
        'Mango Heat',
        'Sweet Dreams',
        'Tequila Wingrise',
        'The Slayer',
        'Tokyo',
        'Wing of the North',
        'Wingferno',
        'Whiskey Vibes',
        'Yaji',
        'Yellow Gold'
      ],
      sizes: [
        { name: 'Regular', price: 15000 },
      ],
      wingCount: 'Fried chicken sandwich, 4 Wings, Fries, Drink',
      flavorCount: 1,
      drinkOptions: ['Coke', 'Fanta', 'Sprite', 'Water'],
    },
    {
      id: 47,
      name: 'Family Pack',
      category: 'Meal Deals',
      image: '/order-family-pack.jpg',
      flavors: [
        'BBQ Fire',
        'BBQ Rush',
        'Braveheart',
        'Cameroon Rub',
        'Caribbean Jerk',
        'Dragon Breath',
        'Gustavo',
        'Hot Nuts',
        'Italian',
        'Lemon Pepper',
        'Mango Heat',
        'Sweet Dreams',
        'Tequila Wingrise',
        'The Slayer',
        'Tokyo',
        'Wing of the North',
        'Wingferno',
        'Whiskey Vibes',
        'Yaji',
        'Yellow Gold'
      ],
      sizes: [
        { name: 'Regular', price: 25000 },
      ],
      wingCount: '36 Wings, 4 Rice, 4 Fried Plantain, 4 Drinks',
      flavorCount: 6,
      riceOptions: [
        { name: 'Jollof Rice', price: 0 },
        { name: 'Fiesta Rice', price: 0 },
      ],
      riceCount: 4,
      drinkOptions: ['Coke', 'Fanta', 'Sprite', 'Water'],
      drinkCount: 4,
    },
    {
      id: 13,
      name: 'Grilled Chicken Salad',
      category: 'Salads',
      image: '/order-grilled-chicken-salad.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 4000 },
      ],
    },
    {
      id: 14,
      name: 'Coleslaw',
      category: 'Salads',
      image: '/order-coleslaw.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 1500 },
      ],
    },
    {
      id: 15,
      name: 'Bell Chicken Wrap',
      category: 'Wraps',
      image: '/order-bell-chicken-wrap.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 6000 },
      ],
    },
    {
      id: 16,
      name: 'Breakfast Wrap',
      category: 'Wraps',
      image: '/order-breakfast-wrap.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 6500 },
      ],
    },
    {
      id: 17,
      name: 'Chicken & Bacon Wrap',
      category: 'Wraps',
      image: '/order-chicken-bacon-wrap.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 6000 },
      ],
    },
    {
      id: 18,
      name: 'Chicken Shawarma Wrap',
      category: 'Wraps',
      image: '/order-chicken-shawarma-wrap.jpg',
      flavors: ['Regular'],
      sizes: [
        { name: 'Regular', price: 6000 },
      ],
    },
  ];

  const filteredProducts = products.filter(product => product.category === activeCategory);

  const handleFlavorSelect = (productId: number, flavor: string, maxCount: number = 1) => {
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

  const handleFlavorRemove = (productId: number, flavor: string) => {
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

  const handleSizeSelect = (productId: number, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleRiceSelect = (productId: number, rice: string, maxCount: number = 1) => {
    setSelectedRice(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : (prev[productId] ? [prev[productId] as string] : []);

      if (maxCount === 1) {
        // For single selection
        return { ...prev, [productId]: rice };
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

  const handleRiceRemove = (productId: number, rice: string) => {
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

  const handleDrinkSelect = (productId: number, drink: string, maxCount: number = 1) => {
    setSelectedDrinks(prev => {
      const current = Array.isArray(prev[productId]) ? prev[productId] : (prev[productId] ? [prev[productId] as string] : []);

      if (maxCount === 1) {
        // For single selection
        return { ...prev, [productId]: drink };
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

  const handleDrinkRemove = (productId: number, drink: string) => {
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

  const handleMilkshakeSelect = (productId: number, milkshake: string) => {
    setSelectedMilkshakes(prev => ({ ...prev, [productId]: milkshake }));
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
    let basePrice = size?.price || product.sizes[0].price;

    // Add rice price if applicable
    if (product.riceOptions) {
      const selectedRiceOption = selectedRice[product.id];
      if (selectedRiceOption) {
        const riceOption = product.riceOptions.find(r => r.name === selectedRiceOption);
        if (riceOption) {
          basePrice += riceOption.price;
        }
      }
    }

    return basePrice;
  };

  const addToCart = (product: Product) => {
    const selectedFlavorArray = selectedFlavors[product.id] || [];
    const flavorCount = product.flavorCount || 1;

    // Check if at least one flavor is selected
    if (selectedFlavorArray.length === 0) {
      return; // Silently prevent adding to cart
    }

    // Check if not exceeding max flavors
    if (selectedFlavorArray.length > flavorCount) {
      return; // Silently prevent adding to cart
    }

    const flavor = flavorCount === 1 ? selectedFlavorArray[0] : selectedFlavorArray;
    const size = selectedSizes[product.id] || product.sizes[0].name;
    const quantity = quantities[product.id] || 1;
    const price = getProductPrice(product);
    const rice = product.riceOptions ? selectedRice[product.id] : undefined;
    const drink = product.drinkOptions ? selectedDrinks[product.id] : undefined;
    const milkshake = product.milkshakeOptions ? selectedMilkshakes[product.id] : undefined;

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
               item.milkshake === milkshake;
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
                  <div className="mb-3">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    {product.wingCount && (
                      <p className="text-sm font-normal text-gray-600">{product.wingCount}</p>
                    )}
                  </div>

                  {/* Select Flavor */}
                  {(product.flavors.length > 1 || (product.flavorCount && product.flavorCount > 1)) && (
                    <div className="mb-4">
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
                            className={`order-size-btn ${selectedSizes[product.id] === size.name ? 'active' : ''}`}
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
                          const current = Array.isArray(selectedRice[product.id]) ? selectedRice[product.id] : (selectedRice[product.id] ? [selectedRice[product.id] as string] : []);
                          const selectedCount = current.filter((r: string) => r === rice.name).length;
                          const isSelected = selectedCount > 0;
                          const isSingleSelect = !product.riceCount || product.riceCount === 1;

                          return (
                            <div key={rice.name} className="relative inline-flex items-center gap-1">
                              <button
                                onClick={() => handleRiceSelect(product.id, rice.name, product.riceCount || 1)}
                                className={`order-size-btn ${isSingleSelect ? (selectedRice[product.id] === rice.name ? 'active' : '') : (isSelected ? 'active' : '')}`}
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
                          const current = Array.isArray(selectedDrinks[product.id]) ? selectedDrinks[product.id] : (selectedDrinks[product.id] ? [selectedDrinks[product.id] as string] : []);
                          const selectedCount = current.filter((d: string) => d === drink).length;
                          const isSelected = selectedCount > 0;
                          const isSingleSelect = !product.drinkCount || product.drinkCount === 1;

                          return (
                            <div key={drink} className="relative inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDrinkSelect(product.id, drink, product.drinkCount || 1)}
                                className={`order-size-btn ${isSingleSelect ? (selectedDrinks[product.id] === drink ? 'active' : '') : (isSelected ? 'active' : '')}`}
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
                <div className="flex justify-between font-bold text-lg">
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