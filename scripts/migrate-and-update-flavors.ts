/**
 * Complete migration: Add columns and update all products with simple flavors
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Map of product names to their simple flavors and labels
const productFlavors: Record<string, { flavors: string[], label?: string }> = {
  // Sides, Sandwiches, Wraps, Salads, Pastries, Wingside Special - all Regular
  'Bacon Coconut Rice': { flavors: ['Regular'] },
  'Potato Wedges': { flavors: ['Regular'] },
  'Fiesta Rice': { flavors: ['Regular'] },
  'French Fries': { flavors: ['Regular'] },
  'Jollof Rice': { flavors: ['Regular'] },
  'Fried Plantain': { flavors: ['Regular'] },
  'Chicken Bacon Sandwich': { flavors: ['Regular'] },
  'Chicken Salad Sandwich': { flavors: ['Regular'] },
  'Egg Salad Sandwich': { flavors: ['Regular'] },
  'Bell Chicken Wrap': { flavors: ['Regular'] },
  'Breakfast Wrap': { flavors: ['Regular'] },
  'Chicken & Bacon Wrap': { flavors: ['Regular'] },
  'Chicken Shawarma Wrap': { flavors: ['Regular'] },
  'Grilled Chicken Salad': { flavors: ['Regular'] },
  'Coleslaw': { flavors: ['Regular'] },
  'Banana Cake Slice': { flavors: ['Regular'] },
  'Chocolate Cake Slice': { flavors: ['Regular'] },
  'Vanilla Cake Slice': { flavors: ['Regular'] },
  'Scones': { flavors: ['Regular'] },
  'Hot Cross Bun x6': { flavors: ['Regular'] },
  'Hot Cross Bun': { flavors: ['Regular'] },
  'Fried Chicken Sandwich': { flavors: ['Regular'] },
  'Loaded Fries': { flavors: ['Regular'] },

  // Wing Cafe - Coffee Classics with Temperature
  'Café Latte': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Espresso': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Cappuccino': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Americano': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Flat White': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Mocha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Affogato Pop': { flavors: ['Hot', 'Iced'], label: 'Temperature' },

  // Wing Cafe - Everyday Sips, Toasted & Spiced, Gourmet - Regular
  'Vanilla Latte': { flavors: ['Regular'] },
  'Caramel Latte': { flavors: ['Regular'] },
  'Salted Caramel Latte': { flavors: ['Regular'] },
  'Hazelnut Latte': { flavors: ['Regular'] },
  'Maple Latte': { flavors: ['Regular'] },
  'Gingerbread Latte': { flavors: ['Regular'] },
  'Cinnamon Roll Latte': { flavors: ['Regular'] },
  'Pumpkin Pie Latte': { flavors: ['Regular'] },
  'Tiramisu Latte': { flavors: ['Regular'] },
  'Popcorn Latte': { flavors: ['Regular'] },
  'Irish Cream Latte': { flavors: ['Regular'] },
  'Pistachio Latte': { flavors: ['Regular'] },
  'Caramelized Peanut Latte': { flavors: ['Regular'] },
  "Terry's Orange Chocolate Latte": { flavors: ['Regular'] },

  // Wing Cafe - Matcha with Temperature
  'Classic Green Matcha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Strawberry Matcha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Vanilla Honey Matcha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Coconut Lavender Matcha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },
  'Blueberry Matcha': { flavors: ['Hot', 'Iced'], label: 'Temperature' },

  // Wing Cafe - Chai, Hot Smelts, Wingfreshers, Milkshakes - Regular
  'Chai Latte': { flavors: ['Regular'] },
  'Dirty Chai': { flavors: ['Regular'] },
  'Hot Chocolate': { flavors: ['Regular'] },
  'Hot White Chocolate': { flavors: ['Regular'] },
  'Peach Wingfresher': { flavors: ['Regular'] },
  'Coconut Wingfresher': { flavors: ['Regular'] },
  'Strawberry Wingfresher': { flavors: ['Regular'] },
  'Cookie Shake': { flavors: ['Regular'] },
  'Malted Shake': { flavors: ['Regular'] },
  'Strawberry Shake': { flavors: ['Regular'] },
  'Vanilla Shake': { flavors: ['Regular'] },

  // Wing Cafe - Teas with Tea Type
  'Teas': { flavors: ['Black', 'Green', 'Herbal'], label: 'Tea Type' },

  // Wing Cafe - Signature Pairings - Regular
  'Tiramisu + White Chocolate': { flavors: ['Regular'] },
  'Irish Cream + Chocolate': { flavors: ['Regular'] },
  'Popcorn + Salted Caramel': { flavors: ['Regular'] },
  'Pistachio + Vanilla': { flavors: ['Regular'] },
  'Gingerbread + Caramelized Peanut': { flavors: ['Regular'] },
  'Pumpkin Spice + White Chocolate': { flavors: ['Regular'] },
  'Tiramisu + Irish Cream': { flavors: ['Regular'] },

  // Drinks
  'Water': { flavors: ['Regular'] },
  'Soft Drinks': { flavors: ['Coke', 'Fanta', 'Sprite'], label: 'Drink Option' },
  'Prime (Hydrated drink)': { flavors: ['Regular'] },
  'Beer': { flavors: ['Regular'] },
}

async function updateProducts() {
  console.log('🔧 Updating products with simple flavors...\n')

  let successCount = 0
  let errorCount = 0

  for (const [productName, { flavors, label }] of Object.entries(productFlavors)) {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          simple_flavors: flavors,
          flavor_label: label || null,
        })
        .eq('name', productName)

      if (error) {
        console.error(`❌ Error updating ${productName}:`, error.message)
        errorCount++
      } else {
        console.log(`✅ Updated ${productName}`)
        successCount++
      }
    } catch (error: any) {
      console.error(`❌ Error updating ${productName}:`, error.message)
      errorCount++
    }
  }

  console.log(`\n✅ Updated ${successCount} products`)
  if (errorCount > 0) {
    console.log(`❌ Failed to update ${errorCount} products`)
  }
}

async function main() {
  console.log('🚀 Starting migration...\n')

  try {
    // Try to check if columns exist
    console.log('📝 Checking if columns exist...')
    const { error: checkError } = await supabase
      .from('products')
      .select('simple_flavors, flavor_label')
      .limit(1)

    if (checkError) {
      console.error('❌ Columns do not exist!')
      console.log('\n📝 Please run this SQL in Supabase SQL Editor:\n')
      console.log('ALTER TABLE products')
      console.log('ADD COLUMN IF NOT EXISTS simple_flavors TEXT[],')
      console.log('ADD COLUMN IF NOT EXISTS flavor_label TEXT;')
      console.log('\nThen run this script again.\n')
      process.exit(1)
    }

    console.log('✅ Columns exist\n')

    // Update products
    await updateProducts()

    console.log('\n✨ Migration completed!')

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()
