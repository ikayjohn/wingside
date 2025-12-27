/**
 * Debug hero slides API and RLS policies
 * Run with: node scripts/debug-hero-slides.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('🔍 Debugging hero slides...\n');

  try {
    // 1. Check if we can access the table with service role
    console.log('1️⃣ Checking table access with service role...');
    const { data: slides, error } = await supabase
      .from('hero_slides')
      .select('*');

    if (error) {
      console.error('❌ Cannot access table:', error.message);
      console.log('\n💡 The table might not exist. Run the migration first.');
      process.exit(1);
    }

    console.log(`✅ Found ${slides.length} slides`);
    slides.forEach(s => {
      console.log(`   - ${s.title} (active: ${s.is_active})`);
    });

    // 2. Check RLS status
    console.log('\n2️⃣ Checking RLS policies...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'hero_slides';
        `
      });

    if (rlsError) {
      console.log('⚠️  Cannot check policies via RPC');
    } else {
      console.log('Current policies:', rlsStatus);
    }

    // 3. Test public API
    console.log('\n3️⃣ Testing public API endpoint...');
    try {
      const publicResponse = await fetch(`${supabaseUrl}/rest/v1/hero_slides?is_active=eq.true&order=display_order`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        console.log(`✅ Public API returned ${publicData.length} slides`);
      } else {
        console.log('❌ Public API failed:', await publicResponse.text());
      }
    } catch (err) {
      console.log('⚠️  Cannot test public API:', err.message);
    }

    // 4. Check if RLS is enabled
    console.log('\n4️⃣ Checking if RLS is enabled...');
    const { data: rlsEnabled } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT relrowsecurity
          FROM pg_class
          WHERE relname = 'hero_slides';
        `
      });

    if (rlsEnabled) {
      console.log('✅ RLS is ENABLED on hero_slides table');
      console.log('\n⚠️  This means public access requires proper policies!');
      console.log('Checking policies...\n');

      // Verify public policy exists
      const policiesResult = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT policyname, cmd, roles
            FROM pg_policies
            WHERE tablename = 'hero_slides'
            ORDER BY policyname;
          `
        });

      console.log('Current policies on hero_slides:');
      if (policiesResult.data) {
        console.log(policiesResult.data);
      }
    }

    // 5. Check for common issues
    console.log('\n5️⃣ Checking for common issues...\n');

    // Issue: Public policy might not exist or be incorrect
    const { data: publicPolicy } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'hero_slides'
            AND policyname = 'Allow public read access on hero_slides'
          ) as has_public_policy;
        `
      });

    if (publicPolicy) {
      const hasPolicy = publicPolicy[0]?.has_public_policy;
      if (!hasPolicy) {
        console.log('❌ MISSING: "Allow public read access on hero_slides" policy');
        console.log('\n📋 Run this SQL to fix:\n');
        console.log(`DROP POLICY IF EXISTS "Allow public read access on hero_slides" ON hero_slides;
CREATE POLICY "Allow public read access on hero_slides"
ON hero_slides FOR SELECT
TO public
USING (is_active = true);`);
      } else {
        console.log('✅ Public read policy exists');
      }
    }

    // 6. Test with anon key (simulating public access)
    console.log('\n6️⃣ Testing public access (anon key)...');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: anonData, error: anonError } = await anonClient
        .from('hero_slides')
        .select('*')
        .eq('is_active', true);

      if (anonError) {
        console.log('❌ Public access FAILED:', anonError.message);
        console.log('\n💡 This means RLS is blocking public access!');
        console.log('The policies might not be set up correctly.');
      } else {
        console.log(`✅ Public access works! Found ${anonData.length} slides`);
      }
    } else {
      console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env');
    }

    console.log('\n✨ Debug complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debug();
