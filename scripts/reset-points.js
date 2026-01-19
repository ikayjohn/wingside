const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPoints() {
  console.log('Resetting points for clean migration...\n');

  // 1. Reset Mocha Badom's points to 0
  const { data: mocha, error: findError } = await supabase
    .from('profiles')
    .select('id, email, total_points')
    .eq('email', 'billionaireboyscorp@gmail.com')
    .single();

  if (mocha) {
    console.log(`Found ${mocha.email} with ${mocha.total_points} points`);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_points: 0 })
      .eq('id', mocha.id);

    if (updateError) {
      console.log('❌ Error resetting points:', updateError.message);
    } else {
      console.log('✅ Reset points to 0');
    }
  }

  // 2. Clear points_history table
  const { error: deleteError } = await supabase
    .from('points_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.log('⚠️  Could not clear points_history:', deleteError.message);
  } else {
    console.log('✅ Cleared points_history table');
  }

  // 3. Clear reward_claims table
  const { error: claimsError } = await supabase
    .from('reward_claims')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (claimsError) {
    console.log('⚠️  Could not clear reward_claims:', claimsError.message);
  } else {
    console.log('✅ Cleared reward_claims table');
  }

  // 4. Reset all profiles to 0 points
  const { error: resetAllError } = await supabase
    .from('profiles')
    .update({ total_points: 0 })
    .gt('total_points', 0);

  if (resetAllError) {
    console.log('⚠️  Could not reset all profiles:', resetAllError.message);
  } else {
    console.log('✅ Reset all user points to 0');
  }

  console.log('\n✅ Reset complete! Ready for clean migration.');
  console.log('\nNext steps:');
  console.log('1. Run scripts/retroactive-points-migration.sql in Supabase');
  console.log('2. Run: node scripts/test-orders-points.js to verify');
}

resetPoints().catch(err => {
  console.error('Error:', err);
});
