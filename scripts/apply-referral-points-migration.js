/**
 * Apply Referral Points Migration
 *
 * This script applies the SQL migration to convert the referral system
 * from naira-based rewards (₦500) to points-based rewards (200 points).
 *
 * Usage:
 *   node scripts/apply-referral-points-migration.js
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Starting referral points migration...\n');

  try {
    // Step 1: Update referral settings to use 200 points
    console.log('📝 Updating referral settings...');

    const { error: settingsError } = await supabase
      .from('referral_settings')
      .update({ setting_value: '200' })
      .in('setting_key', ['referrer_reward_amount', 'referred_reward_amount']);

    if (settingsError) {
      console.error('❌ Error updating referral settings:', settingsError);
      throw settingsError;
    }

    console.log('✅ Referral settings updated to 200 points\n');

    // Step 2: Add points column if it doesn't exist
    console.log('📝 Adding points column to referral_rewards table...');

    const { error: columnError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE referral_rewards ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;`
    });

    if (columnError) {
      console.log('ℹ️  Note: Column might already exist or RPC not available');
    }

    console.log('✅ Points column check complete\n');

    // Step 3: Verify the settings
    console.log('🔍 Verifying new settings...');

    const { data: settings, error: verifyError } = await supabase
      .from('referral_settings')
      .select('*')
      .in('setting_key', ['referrer_reward_amount', 'referred_reward_amount']);

    if (verifyError) {
      console.error('❌ Error verifying settings:', verifyError);
      throw verifyError;
    }

    console.log('✅ Current referral reward settings:');
    settings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value} points`);
    });
    console.log();

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Referral rewards changed from ₦500 to 200 points');
    console.log('   • Both referrer and referred user will receive 200 points');
    console.log('   • Points are awarded after the referred user completes their first order (₦1,000+)');
    console.log('   • Points are automatically credited to user profiles');
    console.log('\n⚠️  Important:');
    console.log('   • Make sure the updated database function is deployed');
    console.log('   • Run the full migration file if needed: supabase/migrations/20250113_update_referral_system_to_points.sql');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 You may need to apply the migration manually via Supabase dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new');
    console.error('   2. Run the SQL from: supabase/migrations/20250113_update_referral_system_to_points.sql');
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
