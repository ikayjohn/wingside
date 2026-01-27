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

    // Get Wing Cafe category ID by slug
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'wing-cafe')
      .single()

    if (categoryError || !categoryData) {
      console.error('Error finding Wing Cafe category:', categoryError)
      return
    }

    const wingCafeId = categoryData.id

    // Get current milkshake products from the database
    const { data: milkshakeProducts } = await supabase
      .from('products')
      .select('name')
      .eq('category_id', wingCafeId)
      .ilike('name', '%Shake%')
      .eq('is_active', true)

    if (!milkshakeProducts || milkshakeProducts.length === 0) {
      console.log('No active milkshake products found in Wing Cafe category.')
      return
    }

    console.log('Found milkshake products:')
    milkshakeProducts.forEach(p => console.log(`  - ${p.name}`))

    // Delete existing milkshake addons
    const { error: deleteError } = await supabase
      .from('product_addons')
      .delete()
      .eq('product_id', productId)
      .eq('type', 'milkshake')

    if (deleteError) {
      console.error('Error deleting addons:', deleteError)
      return
    }

    console.log('Deleted existing milkshake addons')

    // Insert new milkshake addons
    const { error: insertError } = await supabase
      .from('product_addons')
      .insert(
        milkshakeProducts.map(p => ({
          product_id: productId,
          type: 'milkshake',
          name: p.name,
          price: 0,
          max_selections: 1
        }))
      )

    if (insertError) {
      console.error('Error inserting milkshake addons:', insertError)
    } else {
      console.log('Successfully added milkshake addons:', milkshakeProducts.map(p => p.name))
    }

    // Verify the update
    const { data: updatedAddons } = await supabase
      .from('product_addons')
      .select('*')
      .eq('product_id', productId)
      .eq('type', 'milkshake')

    console.log('\nUpdated milkshake addons for Pairfect Combo:')
    updatedAddons?.forEach(a => console.log(`  - ${a.type}: ${a.name} (max: ${a.max_selections})`))

  } catch (error) {
    console.error('Error:', error)
  }
}

updatePairfectCombo()
