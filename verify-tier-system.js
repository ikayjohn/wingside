// Verify tier downgrade system setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying Tier Downgrade System Setup...\n');

  // Check 1: last_activity_date column
  console.log('1️⃣  Checking last_activity_date column...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, last_activity_date, total_points')
      .not('last_activity_date', 'is', null)
      .limit(5);

    if (error) {
      console.log('❌ Column not found or error:', error.message);
    } else {
      console.log(`✅ last_activity_date column exists`);
      console.log(`   Found ${profiles.length} profiles with activity dates\n`);

      if (profiles.length > 0) {
        console.log('   Sample data:');
        profiles.forEach(p => {
          console.log(`   - ${p.email}: ${p.total_points} pts, last active ${new Date(p.last_activity_date).toLocaleDateString()}`);
        });
        console.log('');
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Check 2: process_tier_downgrades function
  console.log('2️⃣  Testing process_tier_downgrades function...');
  try {
    const { data, error } = await supabase.rpc('process_tier_downgrades');

    if (error) {
      console.log('❌ Function error:', error.message);
    } else {
      console.log('✅ process_tier_downgrades function works');
      console.log(`   Downgrades processed: ${data?.length || 0}`);

      if (data && data.length > 0) {
        console.log('\n   ⚠️  Users downgraded:');
        data.forEach(d => {
          console.log(`   - ${d.email}: ${d.old_tier} → ${d.new_tier} (${d.old_points} → ${d.new_points} pts)`);
        });
      } else {
        console.log('   (No users needed downgrading - this is normal)');
      }
      console.log('');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Check 3: update_last_activity function
  console.log('3️⃣  Testing update_last_activity function...');
  try {
    // Get a sample user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];

      const { error } = await supabase.rpc('update_last_activity', {
        p_user_id: testUser.id
      });

      if (error) {
        console.log('❌ Function error:', error.message);
      } else {
        console.log('✅ update_last_activity function works');
        console.log(`   Updated activity for ${testUser.email}\n`);
      }
    } else {
      console.log('⚠️  No users found to test with\n');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Check 4: CRON_SECRET
  console.log('4️⃣  Checking CRON_SECRET environment variable...');
  if (process.env.CRON_SECRET) {
    console.log('✅ CRON_SECRET is set');
    console.log(`   Value: ${process.env.CRON_SECRET.substring(0, 10)}...\n`);
  } else {
    console.log('⚠️  CRON_SECRET not set in .env.local');
    console.log('   Generate one with: openssl rand -base64 32\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ TIER DOWNGRADE SYSTEM VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Next Steps:');
  if (!process.env.CRON_SECRET) {
    console.log('1. Generate CRON_SECRET: openssl rand -base64 32');
    console.log('2. Add to .env.local: CRON_SECRET=your-generated-secret');
    console.log('3. Add to Vercel: Project Settings → Environment Variables');
  } else {
    console.log('1. ✅ Environment variables configured');
  }
  console.log('2. Deploy to Vercel: git add . && git commit -m "feat: tier system" && git push');
  console.log('3. Verify cron job in Vercel Dashboard → Settings → Cron Jobs');
  console.log('4. Test endpoint: GET https://yoursite.com/api/cron/tier-downgrades\n');
}

verify().catch(console.error);
