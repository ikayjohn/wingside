/**
 * Bulk Update Product Subcategories
 * Run with: npx tsx scripts/update-subcategories.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSubcategories() {
    console.log('🔄 Updating subcategories...')

    const { data, error } = await supabase
        .from('products')
        .update({ subcategory: 'Flavored Lattes' })
        .eq('subcategory', 'Everyday Sips')
        .select()

    if (error) {
        console.error('❌ Error updating subcategories:', error.message)
        return
    }

    console.log(`✅ Successfully updated ${data?.length || 0} products from "Everyday Sips" to "Flavored Lattes".`)
}

updateSubcategories()
