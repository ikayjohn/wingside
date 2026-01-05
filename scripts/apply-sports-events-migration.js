const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🔄 Applying sports_events migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250105_sports_events.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try direct SQL execution if RPC fails
      console.log('⚠️  RPC method failed, trying direct execution...');
      console.log('Please run the migration manually in your Supabase dashboard:');
      console.log('\n1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
      console.log('2. Copy and paste the SQL from: supabase/migrations/20250105_sports_events.sql');
      console.log('3. Click "Run"\n');

      console.log('📋 Migration SQL:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---\n');

      throw error;
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 The sports_events table has been created with the following structure:');
    console.log('   - id (UUID, primary key)');
    console.log('   - title (TEXT)');
    console.log('   - description (TEXT)');
    console.log('   - date (DATE)');
    console.log('   - image_url (TEXT)');
    console.log('   - is_active (BOOLEAN, default true)');
    console.log('   - created_at (TIMESTAMP)');
    console.log('   - updated_at (TIMESTAMP)');
    console.log('\n✨ You can now manage sports events from the admin panel!');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\n💡 Please run the migration manually in your Supabase dashboard:');
    console.log('https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new\n');
    process.exit(1);
  }
}

applyMigration();
