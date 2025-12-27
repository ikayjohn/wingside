const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug() {
  // Get a specific product
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true)
    .limit(5);

  console.log('Products:', products?.length || 0);
  const productId = products?.[0]?.id;
  console.log('Checking product:', products?.[0]?.name, `(${productId})`);

  // Check if this product has flavors linked
  const { data: pf } = await supabase
    .from('product_flavors')
    .select('flavor_id')
    .eq('product_id', productId);

  console.log('\nProduct_flavors for this product:', pf?.length || 0);

  if (pf && pf.length > 0) {
    // Get the flavor details
    const { data: flavors } = await supabase
      .from('flavors')
      .select('id, name, is_active, available_for_products')
      .in('id', pf.map(p => p.flavor_id));

    console.log('Flavors found:', flavors?.length || 0);
    flavors?.slice(0, 5).forEach(f => {
      console.log(`  - ${f.name} (active: ${f.is_active}, available: ${f.available_for_products})`);
    });
  }

  // Now test what the API would return
  console.log('\n--- Simulating API query ---');
  const { data: apiProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      sizes:product_sizes(*)
    `)
    .eq('is_active', true)
    .limit(1);

  const product = apiProducts?.[0];
  console.log('Product:', product?.name);

  // Get flavors like the API does
  const { data: productFlavors } = await supabase
    .from('product_flavors')
    .select('product_id, flavor_id')
    .eq('product_id', product?.id);

  const flavorIds = productFlavors?.map(pf => pf.flavor_id) || [];
  console.log('Flavor IDs from product_flavors:', flavorIds.length);

  const { data: flavors } = await supabase
    .from('flavors')
    .select('*')
    .in('id', flavorIds)
    .eq('is_active', true)
    .eq('available_for_products', true);

  console.log('Flavors matching criteria:', flavors?.length || 0);
  flavors?.slice(0, 5).forEach(f => {
    console.log(`  - ${f.name}`);
  });
}

debug();
