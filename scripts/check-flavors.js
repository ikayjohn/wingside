const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFlavors() {
  console.log('Checking product_flavors table...');
  const { data: pf, error: pfError } = await supabase
    .from('product_flavors')
    .select('*')
    .limit(10);

  if (pfError) {
    console.error('Error fetching product_flavors:', pfError);
  } else {
    console.log('Product flavors found:', pf.length);
    console.log(JSON.stringify(pf, null, 2));
  }

  console.log('\nChecking flavors table...');
  const { data: flavors, error: flavorsError } = await supabase
    .from('flavors')
    .select('id, name, is_active, available_for_products')
    .limit(5);

  if (flavorsError) {
    console.error('Error fetching flavors:', flavorsError);
  } else {
    console.log('Flavors found:', flavors.length);
    console.log(JSON.stringify(flavors, null, 2));
  }

  console.log('\nChecking products table...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, category_id')
    .eq('is_active', true)
    .limit(5);

  if (productsError) {
    console.error('Error fetching products:', productsError);
  } else {
    console.log('Products found:', products.length);
    console.log(JSON.stringify(products, null, 2));
  }
}

checkFlavors();
