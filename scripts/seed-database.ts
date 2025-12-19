/**
 * Database Seed Script
 * Populates the database with all product data from the existing hardcoded arrays
 *
 * Run with: npx tsx scripts/seed-database.ts
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
// CATEGORIES
// =============================================
const categories = [
  { name: 'Wings', slug: 'wings', display_order: 1 },
  { name: 'Sides', slug: 'sides', display_order: 2 },
  { name: 'Sandwiches', slug: 'sandwiches', display_order: 3 },
  { name: 'Wraps', slug: 'wraps', display_order: 4 },
  { name: 'Salads', slug: 'salads', display_order: 5 },
  { name: 'Wing Cafe', slug: 'wing-cafe', display_order: 6 },
  { name: 'Pastries', slug: 'pastries', display_order: 7 },
  { name: 'Wingside Special', slug: 'wingside-special', display_order: 8 },
  { name: 'Drinks', slug: 'drinks', display_order: 9 },
  { name: 'Meal Deals', slug: 'meal-deals', display_order: 10 },
  { name: 'Kids', slug: 'kids', display_order: 11 },
]

// =============================================
// FLAVOR CATEGORIES
// =============================================
const flavorCategories = [
  { name: 'HOT', slug: 'hot', display_order: 1 },
  { name: 'BBQ', slug: 'bbq', display_order: 2 },
  { name: 'DRY RUB', slug: 'dry-rub', display_order: 3 },
  { name: 'BOLD & FUN', slug: 'bold-fun', display_order: 4 },
  { name: 'SWEET', slug: 'sweet', display_order: 5 },
  { name: 'BOOZY', slug: 'boozy', display_order: 6 },
]

// =============================================
// FLAVORS
// =============================================
const flavors = [
  // HOT
  { name: 'Wingferno', category: 'HOT', spice_level: 4, description_1: 'Piping hot peppers', description_2: 'Something special for the insane…', image_url: '/flavor-wingferno.png' },
  { name: 'Dragon Breath', category: 'HOT', spice_level: 3, description_1: 'Hot peppers & more hot peppers', description_2: 'Draaaagon!!! Your mushroom clouds will come for all of us…', image_url: '/flavor-dragon.png' },
  { name: 'Braveheart', category: 'HOT', spice_level: 2, description_1: 'Habaneros & hot chili', description_2: 'Feel the heat, feel the burn.', image_url: '/flavor-brave.png' },
  { name: 'Mango Heat', category: 'HOT', spice_level: 1, description_1: 'Mango purée & hot peppers', description_2: 'All sweet, all heat…', image_url: '/flavor-mango.png' },

  // BBQ
  { name: 'BBQ Rush', category: 'BBQ', spice_level: 0, description_1: 'BBQ sauce & honey', description_2: 'Sweet ol BBQ', image_url: '/flavor-bbqrush.png' },
  { name: 'BBQ Fire', category: 'BBQ', spice_level: 1, description_1: 'BBQ sauce & hot peppers', description_2: 'A flavorful hot fire mix of sweet & spicy', image_url: '/flavor-bbqfire.png' },

  // DRY RUB
  { name: 'Lemon Pepper', category: 'DRY RUB', spice_level: 0, description_1: 'Its all in the name', description_2: 'Tangy deliciousness', image_url: '/flavor-lemon.png' },
  { name: 'Cameroon Rub', category: 'DRY RUB', spice_level: 1, description_1: 'Cameroon pepper & herbs', description_2: 'Part dry, part spicy, whole lotta good', image_url: '/flavor-cameroon.png' },
  { name: 'Caribbean Jerk', category: 'DRY RUB', spice_level: 1, description_1: 'Tropical spice mix', description_2: 'Mild peppers you love…', image_url: '/flavor-caribbean.png' },
  { name: 'Yaji', category: 'DRY RUB', spice_level: 1, description_1: 'Its in the name', description_2: 'Born and raised in Nigeria', image_url: '/flavor-yaji.png' },

  // BOLD & FUN
  { name: 'The Italian', category: 'BOLD & FUN', spice_level: 0, description_1: 'Garlic & cheese', description_2: 'The ideal choice for sophisticated palates', image_url: '/flavor-italian.png' },
  { name: 'Wing of the North', category: 'BOLD & FUN', spice_level: 0, description_1: 'Spicy dates & dates', description_2: 'Dont ask, dont tell', image_url: '/flavor-wingnorth.png' },
  { name: 'Tokyo', category: 'BOLD & FUN', spice_level: 0, description_1: 'Soy sauce & sweet chili', description_2: 'From Asia with love', image_url: '/flavor-tokyo.png' },
  { name: 'Hot Nuts', category: 'BOLD & FUN', spice_level: 1, description_1: 'Peanuts & hot chili', description_2: 'Delicious amazingness', image_url: '/flavor-hotnuts.png' },
  { name: 'The Slayer', category: 'BOLD & FUN', spice_level: 0, description_1: 'Garlic & herbs', description_2: 'Keeps the vampires away…', image_url: '/flavor-slayer.png' },

  // SWEET
  { name: 'Sweet Dreams', category: 'SWEET', spice_level: 0, description_1: 'Cola & garlic sauce', description_2: 'Sweet with heat on heat', image_url: '/flavor-sweetdreams.png' },
  { name: 'Yellow Gold', category: 'SWEET', spice_level: 0, description_1: 'Honey & mustard', description_2: 'Sweet & sassy with soothing buttery flavour', image_url: '/flavor-yellowgold.png' },

  // BOOZY
  { name: 'Whiskey Vibes', category: 'BOOZY', spice_level: 0, description_1: 'Whiskey & hot sauce', description_2: 'Booze is intellectual', image_url: '/flavor-whiskeyvibes.png' },
  { name: 'Tequila Wingrise', category: 'BOOZY', spice_level: 0, description_1: 'Tequila & citrus', description_2: 'Now you can eat your tequila too', image_url: '/flavor-tequila.png' },
  { name: 'Gustavo', category: 'BOOZY', spice_level: 0, description_1: 'Beer & barbecue sauce', description_2: 'Hot wings, cold dings', image_url: '/flavor-gustavo.png' },
]

// =============================================
// PRODUCTS (Wing Packs only for now)
// =============================================
const wingProducts = [
  {
    name: 'Rookie Pack',
    category: 'Wings',
    image_url: '/order-rookie-pack.jpg',
    wing_count: '6 wings',
    max_flavors: 1,
    sizes: [{ name: 'Regular', price: 7500 }],
    all_flavors: true, // Indicates it has all 20 wing flavors
  },
  {
    name: 'Regular Pack',
    category: 'Wings',
    image_url: '/order-regular-pack.jpg',
    wing_count: '12 wings',
    max_flavors: 2,
    sizes: [{ name: 'Regular', price: 14000 }],
    all_flavors: true,
  },
  {
    name: 'Pro Pack',
    category: 'Wings',
    image_url: '/order-pro-pack.jpg',
    wing_count: '18 wings',
    max_flavors: 3,
    sizes: [{ name: 'Regular', price: 20000 }],
    all_flavors: true,
  },
  {
    name: 'Veteran Pack',
    category: 'Wings',
    image_url: '/order-veteran-pack.jpg',
    wing_count: '30 wings',
    max_flavors: 4,
    sizes: [{ name: 'Regular', price: 30000 }],
    all_flavors: true,
  },
  {
    name: 'Hunger Games',
    category: 'Wings',
    image_url: '/order-hunger-games.jpg',
    wing_count: '60 Wings',
    max_flavors: 6,
    sizes: [{ name: 'Regular', price: 50000 }],
    all_flavors: true,
  },
  {
    name: 'Lord of the Wings',
    category: 'Wings',
    image_url: '/order-lord-of-the-wings.jpg',
    wing_count: '100 Wings',
    max_flavors: 8,
    sizes: [{ name: 'Regular', price: 80000 }],
    all_flavors: true,
  },
]

// =============================================
// SEED FUNCTIONS
// =============================================

async function seedCategories() {
  console.log('🌱 Seeding categories...')

  const { data, error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select()

  if (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }

  console.log(`✅ Seeded ${data.length} categories`)
  return data
}

async function seedFlavorCategories() {
  console.log('🌱 Seeding flavor categories...')

  const { data, error } = await supabase
    .from('flavor_categories')
    .upsert(flavorCategories, { onConflict: 'slug' })
    .select()

  if (error) {
    console.error('❌ Error seeding flavor categories:', error)
    throw error
  }

  console.log(`✅ Seeded ${data.length} flavor categories`)
  return data
}

async function seedFlavors(flavorCategoryMap: Map<string, string>) {
  console.log('🌱 Seeding flavors...')

  const flavorsWithCategoryIds = flavors.map(flavor => ({
    name: flavor.name,
    flavor_category_id: flavorCategoryMap.get(flavor.category),
    spice_level: flavor.spice_level,
    description_1: flavor.description_1,
    description_2: flavor.description_2,
    image_url: flavor.image_url,
  }))

  const { data, error } = await supabase
    .from('flavors')
    .upsert(flavorsWithCategoryIds, { onConflict: 'name' })
    .select()

  if (error) {
    console.error('❌ Error seeding flavors:', error)
    throw error
  }

  console.log(`✅ Seeded ${data.length} flavors`)
  return data
}

async function seedProducts(categoryMap: Map<string, string>, flavorMap: Map<string, string>) {
  console.log('🌱 Seeding wing products...')

  for (const product of wingProducts) {
    console.log(`  → ${product.name}`)

    // Insert product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category_id: categoryMap.get(product.category),
        image_url: product.image_url,
        wing_count: product.wing_count,
        max_flavors: product.max_flavors,
      })
      .select()
      .single()

    if (productError) {
      console.error(`❌ Error creating ${product.name}:`, productError)
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
      console.error(`❌ Error creating sizes for ${product.name}:`, sizesError)
    }

    // Link all wing flavors if product has all_flavors
    if (product.all_flavors) {
      const flavorLinks = Array.from(flavorMap.values()).map(flavorId => ({
        product_id: productData.id,
        flavor_id: flavorId,
      }))

      const { error: flavorsError } = await supabase
        .from('product_flavors')
        .insert(flavorLinks)

      if (flavorsError) {
        console.error(`❌ Error linking flavors for ${product.name}:`, flavorsError)
      }
    }
  }

  console.log(`✅ Seeded ${wingProducts.length} wing products`)
}

// =============================================
// MAIN FUNCTION
// =============================================

async function main() {
  console.log('🚀 Starting database seed...\n')

  try {
    // Seed categories
    const categoryData = await seedCategories()
    const categoryMap = new Map(categoryData.map(c => [c.name, c.id]))

    // Seed flavor categories
    const flavorCategoryData = await seedFlavorCategories()
    const flavorCategoryMap = new Map(flavorCategoryData.map(c => [c.name, c.id]))

    // Seed flavors
    const flavorData = await seedFlavors(flavorCategoryMap)
    const flavorMap = new Map(flavorData.map(f => [f.name, f.id]))

    // Seed products
    await seedProducts(categoryMap, flavorMap)

    console.log('\n✨ Database seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Categories: ${categoryData.length}`)
    console.log(`   Flavor Categories: ${flavorCategoryData.length}`)
    console.log(`   Flavors: ${flavorData.length}`)
    console.log(`   Products: ${wingProducts.length}`)

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run the seed
main()
