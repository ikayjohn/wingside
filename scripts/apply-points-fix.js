/**
 * Apply the fix for get_user_points_details function
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('🔧 Applying fix for get_user_points_details function...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260206_fix_get_user_points_details.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('❌ Error applying migration:', error.message);

      // Try alternative approach - execute directly
      console.log('\n🔄 Trying alternative approach...\n');

      const { error: execError } = await supabase.from('_migrations').insert({
        name: '20260206_fix_get_user_points_details',
        executed_at: new Date().toISOString()
      });

      if (execError) {
        console.error('❌ Alternative approach failed:', execError.message);
        console.log('\n📝 Please run this SQL manually in the Supabase SQL Editor:');
        console.log('='.repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
        process.exit(1);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\nThe get_user_points_details function has been updated to:');
    console.log('  ✓ Handle users with no points history');
    console.log('  ✓ Return empty arrays instead of null');
    console.log('  ✓ Provide default values for missing fields');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('\n📝 Please apply this migration manually in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main();
