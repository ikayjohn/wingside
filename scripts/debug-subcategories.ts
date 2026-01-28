/**
 * Debug script to check product subcategory data
 * Run this to see what's in the database
 */

import { createClient } from '../lib/supabase/server';

async function debugSubcategories() {
  try {
    const supabase = await createClient();

    console.log('\n=== SUBCATEGORIES TABLE ===');
    const { data: subcategories } = await supabase
      .from('subcategories')
      .select('*')
      .order('name');

    console.log(JSON.stringify(subcategories, null, 2));

    console.log('\n=== PRODUCTS BY SUBCATEGORY ===');
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, subcategory, is_active')
      .not('subcategory', 'is', null)
      .order('subcategory');

    console.log(JSON.stringify(products, null, 2));

    console.log('\n=== PRODUCTS WITH WING CAFE CATEGORY ===');
    const { data: wingCafeProducts } = await supabase
      .from('products')
      .select('id, name, category:categories(name), subcategory, is_active')
      .eq('category', (await supabase.from('categories').select('id').eq('name', 'Wing Cafe').single()).data?.id);

    console.log(JSON.stringify(wingCafeProducts, null, 2));

    console.log('\n=== PRODUCTS MATCHING "matcha" or "Matcha" ===');
    const { data: matchaProducts } = await supabase
      .from('products')
      .select('id, name, category, subcategory')
      .ilike('subcategory', '%atcha%');

    console.log(`Found ${matchaProducts?.length || 0} products with "matcha" in subcategory:`);
    console.log(JSON.stringify(matchaProducts, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSubcategories();
