import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updatePairfectCombo() {
  try {
    const productId = '86451fa0-a7ea-4034-862a-5375ffdf1549'

    // Get current milkshake flavors from the database
    const { data: milkshakeProducts } = await supabase
      .from('products')
      .select('name')
      .eq('category_id', '441fdffc-d235-4341-8deb-590b19b90537') // Wing Cafe category
      .contains('name', 'Shake')
      .eq('is_active', true)

    console.log('Found milkshake products:')
    milkshakeProducts?.forEach(p => console.log(`  - ${p.name}`))

    // Delete existing addons
    const { error: deleteError } = await supabase
      .from('product_addons')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Error deleting addons:', deleteError)
      return
    }

    console.log('Deleted existing addons')

    // Insert new milkshake addons
    const milkshakeAddons = [
      'Vanilla Shake',
      'Strawberry Shake',
      'Malted Shake',
      'Cookie Shake'
    ]

    const { error: insertError } = await supabase
      .from('product_addons')
      .insert(
        milkshakeAddons.map(name => ({
          product_id: productId,
          type: 'milkshake',
          name: name,
          price: 0,
          max_selections: 1
        }))
      )

    if (insertError) {
      console.error('Error inserting milkshake addons:', insertError)
    } else {
      console.log('Successfully added milkshake addons:', milkshakeAddons)
    }

    // Verify the update
    const { data: updatedAddons } = await supabase
      .from('product_addons')
      .select('*')
      .eq('product_id', productId)

    console.log('\nUpdated addons for Pairfect Combo:')
    updatedAddons?.forEach(a => console.log(`  - ${a.type}: ${a.name} (max: ${a.max_selections})`))

  } catch (error) {
    console.error('Error:', error)
  }
}

updatePairfectCombo()
