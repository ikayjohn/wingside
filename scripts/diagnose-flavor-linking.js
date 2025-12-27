const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnose() {
  // Get all product_flavors
  const { data: pf } = await supabase
    .from('product_flavors')
    .select('*');

  console.log('Total product_flavors:', pf?.length || 0);

  // Get all flavor IDs from product_flavors
  const flavorIds = [...new Set(pf?.map(p => p.flavor_id) || [])];
  console.log('Unique flavor IDs in product_flavors:', flavorIds.length);

  // Get all flavors
  const { data: flavors } = await supabase
    .from('flavors')
    .select('id, name');

  console.log('Total flavors in database:', flavors?.length || 0);

  // Check which flavor IDs from product_flavors actually exist in flavors table
  const flavorIdSet = new Set(flavors?.map(f => f.id) || []);
  const missingFlavors = flavorIds.filter(id => !flavorIdSet.has(id));

  console.log('\nFlavor IDs in product_flavors that DO NOT exist in flavors table:', missingFlavors.length);
  if (missingFlavors.length > 0) {
    console.log('Missing IDs:', missingFlavors);
  }

  // Check which flavor IDs exist
  const existingFlavors = flavorIds.filter(id => flavorIdSet.has(id));
  console.log('\nFlavor IDs in product_flavors that DO exist in flavors table:', existingFlavors.length);

  // Get products that should have flavors
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true);

  console.log('\nTotal active products:', products?.length || 0);

  // Check which products have flavors linked
  const productIds = products?.map(p => p.id) || [];
  const linkedProductIds = [...new Set(pf?.map(p => p.product_id) || [])];

  const productsWithFlavors = products?.filter(p => linkedProductIds.includes(p.id)) || [];
  const productsWithoutFlavors = products?.filter(p => !linkedProductIds.includes(p.id)) || [];

  console.log('\nProducts WITH flavors linked:', productsWithFlavors.length);
  productsWithFlavors.slice(0, 5).forEach(p => {
    console.log(`  - ${p.name} (${p.id})`);
  });

  console.log('\nProducts WITHOUT flavors linked:', productsWithoutFlavors.length);
  productsWithoutFlavors.slice(0, 5).forEach(p => {
    console.log(`  - ${p.name} (${p.id})`);
  });
}

diagnose();
