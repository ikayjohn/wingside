/**
 * Rename Subcategory in Database
 * Run with: npx tsx scripts/rename-subcategory.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function renameSubcategory() {
    console.log('🔄 Renaming subcategory in subcategories table...')

    // 1. Find the subcategory
    const { data: subcats, error: findError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('name', 'Everyday Sips')

    if (findError) {
        console.error('❌ Error finding subcategory:', findError.message)
        return
    }

    if (!subcats || subcats.length === 0) {
        console.log('⚠️ "Everyday Sips" not found in subcategories table. It might have been renamed already or doesn\'t exist.')
    } else {
        // 2. Update the name
        const { data: updatedSub, error: updateError } = await supabase
            .from('subcategories')
            .update({ name: 'Flavored Lattes' })
            .eq('name', 'Everyday Sips')
            .select()

        if (updateError) {
            console.error('❌ Error updating subcategory name:', updateError.message)
        } else {
            console.log(`✅ Successfully renamed subcategory to "Flavored Lattes".`)
        }
    }

    // 3. Verify products are correct
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('name, subcategory')
        .eq('subcategory', 'Flavored Lattes')

    console.log(`📊 Currently there are ${products?.length || 0} products under "Flavored Lattes".`)

    const { data: oldProducts } = await supabase
        .from('products')
        .select('name')
        .eq('subcategory', 'Everyday Sips')

    if (oldProducts && oldProducts.length > 0) {
        console.log(`⚠️ Warning: ${oldProducts.length} products still have the old "Everyday Sips" subcategory.`)
    }
    // List all subcategories for Wing Cafe
    const { data: wingCafe } = await supabase.from('categories').select('id').eq('name', 'Wing Cafe').single()
    if (wingCafe) {
        const { data: allSubs } = await supabase.from('subcategories').select('name').eq('category_id', wingCafe.id)
        console.log('📋 Current Wing Cafe subcategories in DB:', allSubs?.map(s => s.name))
    }
}

renameSubcategory()
