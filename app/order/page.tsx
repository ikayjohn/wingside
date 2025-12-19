"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Simplified Product interface to avoid TypeScript issues
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

interface CartItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  flavors: string[] | string;
  quantity: number;
  price: number;
  rice?: string[] | string;
  drink?: string[] | string;
  milkshake?: string;
  cake?: string;
}

export default function OrderPage() {
  const [activeCategory, setActiveCategory] = useState('Wings');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Simplified state using string unions for better type compatibility
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: string]: string | string[] }>({});
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({});
  const [selectedRice, setSelectedRice] = useState<{ [key: string]: string | string[] }>({});
  const [selectedDrinks, setSelectedDrinks] = useState<{ [key: string]: string | string[] }>({});
  const [selectedMilkshakes, setSelectedMilkshakes] = useState<{ [key: string]: string }>({})
  const [selectedCakes, setSelectedCakes] = useState<{ [key: string]: string }>({});
  const [selectedFlavorCategory, setSelectedFlavorCategory] = useState<{ [key: string]: string }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
})
