const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProductFlavors() {
  console.log('Fetching all flavors...');
  const { data: flavors } = await supabase
    .from('flavors')
    .select('id, name, category')
    .eq('is_active', true)
    .eq('available_for_products', true);

  console.log(`Found ${flavors?.length || 0} active flavors`);

  // Create a map of flavor name -> flavor ID
  const flavorMap = {};
  flavors?.forEach(f => {
    flavorMap[f.name.toLowerCase()] = f.id;
  });

  console.log('Flavor map:', Object.keys(flavorMap));

  // For wing products, link them to all appropriate flavors
  console.log('\nFetching wing products...');
  const { data: wingProducts } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_active', true);

  console.log(`Found ${wingProducts?.length || 0} active products`);

  // Delete old product_flavors
  console.log('\nDeleting old product_flavors...');
  const { error: deleteError } = await supabase
    .from('product_flavors')
    .delete()
    .neq('product_id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error deleting old product_flavors:', deleteError);
    return;
  }
  console.log('Old product_flavors deleted');

  // Link all wing products to all flavors
  console.log('\nLinking products to flavors...');

  const wingCategories = ['Wings', 'Meal Deals', 'Kids'];
  const productsToLink = wingProducts?.filter(p => {
    // You can customize this logic based on which products should have flavors
    // For now, let's link products that don't have simple_flavors
    return true; // We'll check per product
  }) || [];

  // Get products with their details to check if they need flavors
  const { data: productsWithDetails } = await supabase
    .from('products')
    .select('id, name, simple_flavors, category')
    .eq('is_active', true)
    .in('category', wingCategories.map((cat, i) => {
      // Get category IDs
      return null; // We'll do this differently
    }));

  // Simpler approach: Link all products to all 20 flavors
  const inserts = [];
  productsToLink.forEach(product => {
    Object.values(flavorMap).forEach(flavorId => {
      inserts.push({
        product_id: product.id,
        flavor_id: flavorId
      });
    });
  });

  console.log(`Inserting ${inserts.length} product_flavor links...`);

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('product_flavors')
      .insert(batch);

    if (insertError) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('\nDone! Verifying...');
  const { data: verify } = await supabase
    .from('product_flavors')
    .select('*', { count: 'exact', head: true });

  console.log(`Total product_flavors now: ${verify?.length || 0}`);
}

fixProductFlavors();
