/**
 * Complete Database Seed Script
 * Populates ALL products across all categories
 *
 * Run with: npx tsx scripts/seed-all-products.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================
// ALL PRODUCTS DATA
// =============================================
const allProducts = [
  // ===== SIDES =====
  {
    name: 'Bacon Coconut Rice',
    category: 'Sides',
    image_url: '/order-bacon-coconut-rice.jpg',
    sizes: [{ name: 'Regular', price: 4000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Potato Wedges',
    category: 'Sides',
    image_url: '/order-potato-wedges.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Fiesta Rice',
    category: 'Sides',
    image_url: '/order-fiesta-rice.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'French Fries',
    category: 'Sides',
    image_url: '/order-french-fries.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Jollof Rice',
    category: 'Sides',
    image_url: '/order-jollof-rice.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Fried Plantain',
    category: 'Sides',
    image_url: '/order-fried-plantain.jpg',
    sizes: [{ name: 'Regular', price: 1500 }],
    simple_flavors: ['Regular'],
  },

  // ===== SANDWICHES =====
  {
    name: 'Chicken Bacon Sandwich',
    category: 'Sandwiches',
    image_url: '/order-chicken-bacon-sandwich.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Chicken Salad Sandwich',
    category: 'Sandwiches',
    image_url: '/order-chicken-salad-sandwich.jpg',
    sizes: [{ name: 'Regular', price: 3000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Egg Salad Sandwich',
    category: 'Sandwiches',
    image_url: '/order-egg-salad-sandwich.jpg',
    sizes: [{ name: 'Regular', price: 3000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WRAPS =====
  {
    name: 'Bell Chicken Wrap',
    category: 'Wraps',
    image_url: '/order-bell-chicken-wrap.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Breakfast Wrap',
    category: 'Wraps',
    image_url: '/order-breakfast-wrap.jpg',
    sizes: [{ name: 'Regular', price: 6500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Chicken & Bacon Wrap',
    category: 'Wraps',
    image_url: '/order-chicken-bacon-wrap.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Chicken Shawarma Wrap',
    category: 'Wraps',
    image_url: '/order-chicken-shawarma-wrap.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== SALADS =====
  {
    name: 'Grilled Chicken Salad',
    category: 'Salads',
    image_url: '/order-grilled-chicken-salad.jpg',
    sizes: [{ name: 'Regular', price: 4000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Coleslaw',
    category: 'Salads',
    image_url: '/order-coleslaw.jpg',
    sizes: [{ name: 'Regular', price: 1500 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Coffee Classics =====
  {
    name: 'Café Latte',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-latte.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Espresso',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-espresso-x2.jpg',
    sizes: [{ name: 'Regular', price: 3500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Cappuccino',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-cappuccino.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Americano',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-americano.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Flat White',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-flat-white.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Mocha',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-mocha.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Affogato Pop',
    category: 'Wing Cafe',
    subcategory: 'Coffee Classics',
    image_url: '/order-affogato-pop.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },

  // ===== WING CAFE - Everyday Sips =====
  {
    name: 'Vanilla Latte',
    category: 'Wing Cafe',
    subcategory: 'Everyday Sips',
    image_url: '/order-vanilla-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Caramel Latte',
    category: 'Wing Cafe',
    subcategory: 'Everyday Sips',
    image_url: '/order-caramel-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Salted Caramel Latte',
    category: 'Wing Cafe',
    subcategory: 'Everyday Sips',
    image_url: '/order-salted-caramel-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Hazelnut Latte',
    category: 'Wing Cafe',
    subcategory: 'Everyday Sips',
    image_url: '/order-hazelnut-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Maple Latte',
    category: 'Wing Cafe',
    subcategory: 'Everyday Sips',
    image_url: '/order-maple-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Toasted & Spiced Lattes =====
  {
    name: 'Gingerbread Latte',
    category: 'Wing Cafe',
    subcategory: 'Toasted & Spiced Lattes',
    image_url: '/order-gingerbread-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Cinnamon Roll Latte',
    category: 'Wing Cafe',
    subcategory: 'Toasted & Spiced Lattes',
    image_url: '/order-cinnamon-roll-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Pumpkin Pie Latte',
    category: 'Wing Cafe',
    subcategory: 'Toasted & Spiced Lattes',
    image_url: '/order-pumpkin-pie-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
    badge: 'Seasonal',
  },

  // ===== WING CAFE - Gourmet & Dessert-Inspired Lattes =====
  {
    name: 'Tiramisu Latte',
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-tiramisu-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Popcorn Latte',
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-popcorn-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Irish Cream Latte',
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-irish-cream-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Pistachio Latte',
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-pistachio-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Caramelized Peanut Latte',
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-caramelized-peanut-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
    badge: 'Seasonal',
  },
  {
    name: "Terry's Orange Chocolate Latte",
    category: 'Wing Cafe',
    subcategory: 'Gourmet & Dessert-Inspired Lattes',
    image_url: '/order-terrys-orange-chocolate-latte.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
    badge: 'Seasonal',
  },

  // ===== WING CAFE - Matcha Lattes =====
  {
    name: 'Classic Green Matcha',
    category: 'Wing Cafe',
    subcategory: 'Matcha Lattes',
    image_url: '/order-classic-green-matcha.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Strawberry Matcha',
    category: 'Wing Cafe',
    subcategory: 'Matcha Lattes',
    image_url: '/order-strawberry-matcha.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Vanilla Honey Matcha',
    category: 'Wing Cafe',
    subcategory: 'Matcha Lattes',
    image_url: '/order-vanilla-honey-matcha.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Coconut Lavender Matcha',
    category: 'Wing Cafe',
    subcategory: 'Matcha Lattes',
    image_url: '/order-coconut-lavender-matcha.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },
  {
    name: 'Blueberry Matcha',
    category: 'Wing Cafe',
    subcategory: 'Matcha Lattes',
    image_url: '/order-blueberry-matcha.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Hot', 'Iced'],
    flavor_label: 'Temperature',
  },

  // ===== WING CAFE - Chai Lattes =====
  {
    name: 'Chai Latte',
    category: 'Wing Cafe',
    subcategory: 'Chai Lattes',
    image_url: '/order-chai-latte.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Dirty Chai',
    category: 'Wing Cafe',
    subcategory: 'Chai Lattes',
    image_url: '/order-dirty-chai.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Hot Smelts =====
  {
    name: 'Hot Chocolate',
    category: 'Wing Cafe',
    subcategory: 'Hot Smelts',
    image_url: '/order-hot-chocolate.jpg',
    sizes: [{ name: 'Regular', price: 4500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Hot White Chocolate',
    category: 'Wing Cafe',
    subcategory: 'Hot Smelts',
    image_url: '/order-hot-white-chocolate.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Teas =====
  {
    name: 'Teas',
    category: 'Wing Cafe',
    subcategory: 'Teas',
    image_url: '/order-teas.jpg',
    sizes: [{ name: 'Regular', price: 5000 }],
    simple_flavors: ['Black', 'Green', 'Herbal'],
    flavor_label: 'Tea Type',
  },

  // ===== WING CAFE - Wingfreshers =====
  {
    name: 'Peach Wingfresher',
    category: 'Wing Cafe',
    subcategory: 'Wingfreshers',
    image_url: '/order-peach-wingfresher.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Coconut Wingfresher',
    category: 'Wing Cafe',
    subcategory: 'Wingfreshers',
    image_url: '/order-coconut-wingfresher.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Strawberry Wingfresher',
    category: 'Wing Cafe',
    subcategory: 'Wingfreshers',
    image_url: '/order-strawberry-wingfresher.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Milkshakes =====
  {
    name: 'Cookie Shake',
    category: 'Wing Cafe',
    subcategory: 'Milkshakes',
    image_url: '/order-cookie-shake.jpg',
    sizes: [{ name: 'Regular', price: 9000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Malted Shake',
    category: 'Wing Cafe',
    subcategory: 'Milkshakes',
    image_url: '/order-malted-shake.jpg',
    sizes: [{ name: 'Regular', price: 9000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Strawberry Shake',
    category: 'Wing Cafe',
    subcategory: 'Milkshakes',
    image_url: '/order-strawberry-shake.jpg',
    sizes: [{ name: 'Regular', price: 9000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Vanilla Shake',
    category: 'Wing Cafe',
    subcategory: 'Milkshakes',
    image_url: '/order-vanilla-shake.jpg',
    sizes: [{ name: 'Regular', price: 9000 }],
    simple_flavors: ['Regular'],
  },

  // ===== WING CAFE - Signature Pairings =====
  {
    name: 'Tiramisu + White Chocolate',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-tiramisu-white-chocolate.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Irish Cream + Chocolate',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-irish-cream-chocolate.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Popcorn + Salted Caramel',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-popcorn-salted-caramel.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Pistachio + Vanilla',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-pistachio-vanilla.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Gingerbread + Caramelized Peanut',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-gingerbread-caramelized-peanut.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Pumpkin Spice + White Chocolate',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-pumpkin-spice-white-chocolate.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Tiramisu + Irish Cream',
    category: 'Wing Cafe',
    subcategory: 'Signature Pairings',
    image_url: '/order-tiramisu-irish-cream.jpg',
    sizes: [{ name: 'Regular', price: 6000 }],
    simple_flavors: ['Regular'],
  },

  // ===== PASTRIES =====
  {
    name: 'Banana Cake Slice',
    category: 'Pastries',
    image_url: '/order-banana-cake-slice.jpg',
    sizes: [{ name: 'Regular', price: 2000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Chocolate Cake Slice',
    category: 'Pastries',
    image_url: '/order-chocolate-cake-slice.jpg',
    sizes: [{ name: 'Regular', price: 2000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Vanilla Cake Slice',
    category: 'Pastries',
    image_url: '/order-vanilla-cake-slice.jpg',
    sizes: [{ name: 'Regular', price: 2000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Scones',
    category: 'Pastries',
    image_url: '/order-scones.jpg',
    sizes: [{ name: 'Regular', price: 2000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Hot Cross Bun x6',
    category: 'Pastries',
    image_url: '/order-hot-cross-bun-x6.jpg',
    sizes: [{ name: 'Regular', price: 12500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Hot Cross Bun',
    category: 'Pastries',
    image_url: '/order-hot-cross-bun.jpg',
    sizes: [{ name: 'Regular', price: 1250 }],
    simple_flavors: ['Regular'],
  },

  // ===== WINGSIDE SPECIAL =====
  {
    name: 'Fried Chicken Sandwich',
    category: 'Wingside Special',
    image_url: '/order-fried-chicken-sandwich.jpg',
    sizes: [{ name: 'Regular', price: 7500 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Loaded Fries',
    category: 'Wingside Special',
    image_url: '/order-loaded-fries.jpg',
    sizes: [{ name: 'Regular', price: 12000 }],
    simple_flavors: ['Regular'],
  },

  // ===== DRINKS =====
  {
    name: 'Water',
    category: 'Drinks',
    image_url: '/order-water.jpg',
    sizes: [{ name: 'Regular', price: 750 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Soft Drinks',
    category: 'Drinks',
    image_url: '/order-soft-drinks.jpg',
    sizes: [{ name: 'Regular', price: 1250 }],
    simple_flavors: ['Coke', 'Fanta', 'Sprite'],
    flavor_label: 'Drink Option',
  },
  {
    name: 'Prime (Hydrated drink)',
    category: 'Drinks',
    image_url: '/order-prime-hydrated-drink.jpg',
    sizes: [{ name: 'Regular', price: 4000 }],
    simple_flavors: ['Regular'],
  },
  {
    name: 'Beer',
    category: 'Drinks',
    image_url: '/order-beer.jpg',
    sizes: [{ name: 'Regular', price: 2500 }],
    simple_flavors: ['Regular'],
  },

  // ===== MEAL DEALS =====
  {
    name: 'Lone Ranger',
    category: 'Meal Deals',
    image_url: '/order-lone-ranger.jpg',
    sizes: [{ name: 'Regular', price: 7000 }],
    wing_count: '3 Wings, Rice, Drink',
    max_flavors: 1,
    use_wing_flavors: true,
    description: '3 Wings, Rice, Drink',
  },
  {
    name: 'Pairfect Combo',
    category: 'Meal Deals',
    image_url: '/order-pairfect-combo.jpg',
    sizes: [{ name: 'Regular', price: 15000 }],
    wing_count: '6 Wings, Milkshake',
    max_flavors: 1,
    use_wing_flavors: true,
    description: '6 Wings, Milkshake',
  },
  {
    name: 'Value Pack',
    category: 'Meal Deals',
    image_url: '/order-value-pack.jpg',
    sizes: [{ name: 'Regular', price: 15000 }],
    wing_count: 'Fried chicken sandwich, 4 Wings, Fries, Drink',
    max_flavors: 1,
    use_wing_flavors: true,
    description: 'Fried chicken sandwich, 4 Wings, Fries, Drink',
  },
  {
    name: 'Family Pack',
    category: 'Meal Deals',
    image_url: '/order-family-pack.jpg',
    sizes: [{ name: 'Regular', price: 25000 }],
    wing_count: '36 Wings, 4 Rice, 4 Fried Plantain, 4 Drinks',
    max_flavors: 6,
    use_wing_flavors: true,
    description: '36 Wings, 4 Rice, 4 Fried Plantain, 4 Drinks',
  },

  // ===== KIDS =====
  {
    name: 'The Genius',
    category: 'Kids',
    image_url: '/kids-the-genius.jpg',
    sizes: [{ name: 'Kids Meal', price: 5000 }],
    max_flavors: 1,
    use_wing_flavors: true,
    description: '3 Wings, French Fries, 1 Juice Box and 1 Cake Slice',
  },
]

// =============================================
// SEED FUNCTION FOR ALL PRODUCTS
// =============================================

async function seedAllProducts(categoryMap: Map<string, string>, flavorMap: Map<string, string>) {
  console.log('🌱 Seeding all products...\n')

  let successCount = 0
  let errorCount = 0

  for (const product of allProducts) {
    try {
      console.log(`  → ${product.name}`)

      // Insert product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          category_id: categoryMap.get(product.category),
          subcategory: product.subcategory || null,
          image_url: product.image_url,
          wing_count: product.wing_count || null,
          max_flavors: product.max_flavors || null,
          badge: product.badge || null,
          description: product.description || null,
        })
        .select()
        .single()

      if (productError) {
        console.error(`    ❌ Error creating ${product.name}:`, productError.message)
        errorCount++
        continue
      }

      // Insert sizes
      const sizes = product.sizes.map(size => ({
        product_id: productData.id,
        name: size.name,
        price: size.price,
        is_default: true,
      }))

      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(sizes)

      if (sizesError) {
        console.error(`    ❌ Error creating sizes for ${product.name}:`, sizesError.message)
      }

      // Handle flavors
      // For products that use wing flavors (Meal Deals, Kids)
      if (product.use_wing_flavors) {
        const flavorLinks = Array.from(flavorMap.values()).map(flavorId => ({
          product_id: productData.id,
          flavor_id: flavorId,
        }))

        const { error: flavorsError } = await supabase
          .from('product_flavors')
          .insert(flavorLinks)

        if (flavorsError) {
          console.error(`    ❌ Error linking wing flavors for ${product.name}:`, flavorsError.message)
        }
      }
      // For products with simple string flavors (like "Regular", "Hot", "Iced")
      else if (product.simple_flavors) {
        // These are just stored as strings, no flavor table linking needed
        // The API will return them directly from the product
      }

      successCount++
      console.log(`    ✅ Created successfully`)

    } catch (error: any) {
      console.error(`    ❌ Unexpected error for ${product.name}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n✅ Seeded ${successCount} products successfully`)
  if (errorCount > 0) {
    console.log(`❌ Failed to seed ${errorCount} products`)
  }
}

// =============================================
// MAIN FUNCTION
// =============================================

async function main() {
  console.log('🚀 Starting complete product seed...\n')

  try {
    // Get existing categories and flavors
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')

    if (categoryError) throw categoryError
    const categoryMap = new Map(categoryData.map(c => [c.name, c.id]))

    const { data: flavorData, error: flavorError } = await supabase
      .from('flavors')
      .select('*')

    if (flavorError) throw flavorError
    const flavorMap = new Map(flavorData.map(f => [f.name, f.id]))

    // Seed all products
    await seedAllProducts(categoryMap, flavorMap)

    console.log('\n✨ Product seed completed!')

  } catch (error: any) {
    console.error('\n❌ Seed failed:', error.message)
    process.exit(1)
  }
}

// Run the seed
main()
