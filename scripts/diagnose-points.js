const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnosePoints() {
  console.log('='.repeat(80));
  console.log('POINTS SYSTEM DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log();

  // 1. Check if functions exist
  console.log('1. Checking if award_points function exists...');
  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_reward_type: 'test',
      p_points: 0,
      p_amount_spent: 0,
      p_description: 'test'
    });

    if (error && !error.message.includes('NULL')) {
      console.log('   ❌ Function does not exist or has errors:', error.message);
    } else {
      console.log('   ✅ award_points function exists');
    }
  } catch (e) {
    console.log('   ❌ Cannot call award_points:', e.message);
  }

  console.log();

  // 2. Check if retroactively_award_points function exists
  console.log('2. Checking if retroactively_award_points function exists...');
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'retroactively_award_points');

  if (funcError || !functions || functions.length === 0) {
    console.log('   ❌ retroactively_award_points function does NOT exist');
    console.log('   ⚠️  You need to run the migration script first!');
  } else {
    console.log('   ✅ retroactively_award_points function exists');
  }

  console.log();

  // 3. Check current points in profiles
  console.log('3. Current points in profiles...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, total_points')
    .order('total_points', { ascending: false })
    .limit(5);

  if (profileError) {
    console.log('   ❌ Error:', profileError.message);
  } else {
    console.log('   Top 5 users by points:');
    profiles.forEach(p => {
      console.log(`   - ${p.email}: ${p.total_points || 0} points`);
    });
  }

  console.log();

  // 4. Check points_history table
  console.log('4. Checking points_history table...');
  const { data: history, error: historyError } = await supabase
    .from('points_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (historyError) {
    console.log('   ❌ Error accessing points_history:', historyError.message);
  } else if (!history || history.length === 0) {
    console.log('   ⚠️  points_history table is EMPTY');
    console.log('   ⚠️  No points have been awarded yet!');
  } else {
    console.log(`   ✅ Found ${history.length} recent point transactions:`);
    history.forEach(h => {
      console.log(`   - ${h.points} points: ${h.description} (${new Date(h.created_at).toLocaleString()})`);
    });
  }

  console.log();

  // 5. Try to manually award points to Mocha Badom
  console.log('5. Attempting to manually award points to Mocha Badom...');

  // Get Mocha Badom's user ID
  const { data: mocha, error: mochaError } = await supabase
    .from('profiles')
    .select('id, email, total_points')
    .eq('email', 'billionaireboyscorp@gmail.com')
    .single();

  if (mochaError || !mocha) {
    console.log('   ❌ Cannot find Mocha Badom profile');
  } else {
    console.log(`   Found: ${mocha.email} (${mocha.id})`);
    console.log(`   Current points: ${mocha.total_points || 0}`);

    // Manually award 403 points
    console.log(`   Attempting to award 403 points...`);

    const { data: awardResult, error: awardError } = await supabase.rpc('award_points', {
      p_user_id: mocha.id,
      p_reward_type: 'purchase',
      p_points: 403,
      p_amount_spent: 4031,
      p_description: 'Manual point award for retroactive orders',
      p_metadata: { manual: true, test: true }
    });

    if (awardError) {
      console.log('   ❌ Error awarding points:', awardError.message);
      console.log('   Details:', JSON.stringify(awardError, null, 2));
    } else {
      console.log('   ✅ Points awarded successfully!');

      // Check new total
      const { data: updated } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', mocha.id)
        .single();

      console.log(`   New total: ${updated?.total_points || 0} points`);
    }
  }

  console.log();
  console.log('='.repeat(80));
}

diagnosePoints().then(() => {
  console.log('\n✅ Diagnostic complete');
}).catch(err => {
  console.error('\n❌ Diagnostic failed:', err);
});
