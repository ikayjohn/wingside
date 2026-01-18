const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Applying points system migration...\n');

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250119_create_points_functions.sql', 'utf8');

    // Split the migration into individual statements
    // Note: This is a simple approach - for production you'd want a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute.\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements or comments
      if (!statement || statement.startsWith('--')) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      // Use raw SQL execution via RPC
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // If exec_sql doesn't exist, we'll need to use the dashboard
        console.error(`Error executing statement:`, error.message);
        console.log('\n⚠️  Could not execute migration via RPC.');
        console.log('Please apply the migration manually via Supabase Dashboard:');
        console.log('1. Open: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
        console.log('2. Copy the contents of: supabase/migrations/20250119_create_points_functions.sql');
        console.log('3. Paste and run in the SQL editor\n');
        return;
      }

      console.log(`✅ Statement ${i + 1} completed successfully.`);
    }

    console.log('\n✅ Migration applied successfully!');

  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n⚠️  Please apply the migration manually via Supabase Dashboard:');
    console.log('1. Open: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/20250119_create_points_functions.sql');
    console.log('3. Paste and run in the SQL editor\n');
  }
}

applyMigration();
