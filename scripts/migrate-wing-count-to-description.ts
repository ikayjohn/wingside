import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateWingCountToDescription() {
  console.log('Starting migration: Moving wing_count to description...\n')

  // Fetch all products with wing_count
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name, wing_count, description')
    .not('wing_count', 'is', null)

  if (fetchError) {
    console.error('Error fetching products:', fetchError)
    return
  }

  if (!products || products.length === 0) {
    console.log('No products with wing_count found.')
    return
  }

  console.log(`Found ${products.length} products with wing_count\n`)

  let successCount = 0
  let errorCount = 0

  for (const product of products) {
    try {
      // Determine new description
      let newDescription = product.description || ''

      // If there's already a description, add wing_count as additional info
      if (newDescription && newDescription.trim()) {
        newDescription = `${product.wing_count}\n${newDescription}`
      } else {
        // If no description, just use wing_count
        newDescription = product.wing_count
      }

      // Update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({ description: newDescription })
        .eq('id', product.id)

      if (updateError) {
        console.error(`❌ Error updating ${product.name}:`, updateError.message)
        errorCount++
      } else {
        console.log(`✅ Updated ${product.name}: "${product.wing_count}" → description`)
        successCount++
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${product.name}:`, error.message)
      errorCount++
    }
  }

  console.log('\n--- Migration Complete ---')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`Total: ${products.length}`)
}

migrateWingCountToDescription()
