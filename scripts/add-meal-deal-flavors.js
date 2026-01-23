import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// All 20 wing flavors
const wingFlavors = [
  'BBQ Rush',
  'The Italian',
  'Tokyo',
  'The Slayer',
  'Tequila Wingrise',
  'Lemon Pepper',
  'Caribbean Jerk',
  'Wingferno',
  'Braveheart',
  'Sweet Dreams',
  'Yellow Gold',
  'Mango Heat',
  'Dragon Breath',
  'Yaji',
  'Cameroon Pepper',
  'Gustavo',
  'Whiskey Vibes',
  'Hot Nuts',
  'Wing of the North',
  'BBQ Fire'
]

// Product IDs for Meal Deals that need all flavors
const mealDealProducts = [
  { name: 'Value Pack', id: '3e67cdba-9fec-440f-b83c-7ff059ba8c0c' },
  { name: 'Pairfect Combo', id: '86451fa0-a7ea-4034-862a-5375ffdf1549' },
  { name: 'Family Pack', id: 'dbe9d74c-8cb2-4995-bfaa-d52c8fee3028' }
]

async function addFlavorsToMealDeals() {
  try {
    // Get all flavor IDs
    const { data: flavors, error: flavorsError } = await supabase
      .from('flavors')
      .select('id, name')
      .in('name', wingFlavors)
      .eq('is_active', true)
      .eq('available_for_products', true)

    if (flavorsError) throw flavorsError

    if (!flavors || flavors.length === 0) {
      console.error('No flavors found!')
      return
    }

    console.log(`Found ${flavors.length} flavors`)

    // Add flavors to each Meal Deal product
    for (const product of mealDealProducts) {
      console.log(`\n=== Checking ${product.name} (ID: ${product.id}) ===`)

      // Check existing flavors in product_flavors table
      const { data: existing, error: existingError } = await supabase
        .from('product_flavors')
        .select('*')
        .eq('product_id', product.id)

      if (existingError) {
        console.error(`  Error checking existing flavors:`, existingError)
        continue
      }

      console.log(`  Found ${existing?.length || 0} existing flavor links in database`)
      if (existing && existing.length > 0) {
        console.log(`  Flavor IDs: ${existing.map(e => e.flavor_id).join(', ')}`)
      }

      const existingFlavorIds = new Set(existing?.map(e => e.flavor_id) || [])
      const flavorsToAdd = flavors.filter(f => !existingFlavorIds.has(f.id))

      if (flavorsToAdd.length === 0) {
        console.log(`  All flavors already exist for ${product.name}`)
        continue
      }

      console.log(`  Adding ${flavorsToAdd.length} new flavors...`)

      // Insert new flavors
      const { error: insertError } = await supabase
        .from('product_flavors')
        .insert(
          flavorsToAdd.map(flavor => ({
            product_id: product.id,
            flavor_id: flavor.id
          }))
        )

      if (insertError) {
        console.error(`  Error adding flavors:`, insertError)
      } else {
        console.log(`  Successfully added ${flavorsToAdd.length} flavors to ${product.name}`)
      }
    }

    console.log('\nDone!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addFlavorsToMealDeals()
