/**
 * Test the hero slides API directly
 * Run with: node scripts/test-hero-api.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function testAPI() {
  console.log('🧪 Testing hero slides API...\n');

  // 1. Test direct database access (bypasses RLS)
  console.log('1️⃣ Direct database query (service role):');
  const { data: directData, error: directError } = await supabase
    .from('hero_slides')
    .select('*');

  if (directError) {
    console.error('❌ Error:', directError);
  } else {
    console.log(`✅ Found ${directData.length} slides`);
    directData.forEach(s => {
      console.log(`   - ${s.title}: "${s.headline.substring(0, 50)}..."`);
    });
  }

  // 2. Test the public API endpoint
  console.log('\n2️⃣ Testing public API endpoint...');
  try {
    const apiUrl = `${supabaseUrl}/rest/v1/hero_slides?is_active=eq.true&order=display_order`;
    const response = await fetch(apiUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`✅ API returned ${data.length} slides`);
  } catch (err) {
    console.error('❌ API error:', err.message);
  }

  // 3. Check if RLS is the problem
  console.log('\n3️⃣ Checking RLS policies...');
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'hero_slides');

  if (policies && policies.length > 0) {
    console.log(`   Found ${policies.length} policies:`);
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  } else {
    console.log('   ⚠️  No policies found! This is the problem.');
    console.log('\n📋 Run this SQL in Supabase Dashboard:\n');
    console.log(`-- Drop old policies
DROP POLICY IF EXISTS "Allow public read access on hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow admin full access on hero_slides" ON hero_slides;

-- Create new policies
CREATE POLICY "Allow public read access on hero_slides"
ON hero_slides FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Allow admin full access on hero_slides"
ON hero_slides FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);`);
  }

  // 4. Test with anon key
  console.log('\n4️⃣ Testing with anon key (public access)...');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    const { data: anonData, error: anonError } = await createClient(supabaseUrl, anonKey)
      .from('hero_slides')
      .select('*')
      .eq('is_active', true);

    if (anonError) {
      console.error('❌ Anon access failed:', anonError.message);
      console.log('\n💡 The public RLS policy is not working!');
    } else {
      console.log(`✅ Anon access works! Found ${anonData.length} slides`);
    }
  } else {
    console.log('⚠️  No NEXT_PUBLIC_SUPABASE_ANON_KEY found');
  }
}

testAPI();
