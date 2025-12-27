const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
  const { count, error } = await supabase
    .from('product_flavors')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total product_flavors:', count);
  }

  // Get a sample
  const { data: sample } = await supabase
    .from('product_flavors')
    .select('product_id, flavor_id')
    .limit(5);

  console.log('\nSample product_flavors:');
  sample?.forEach(pf => {
    console.log(`  Product: ${pf.product_id}, Flavor: ${pf.flavor_id}`);
  });
}

verify();
