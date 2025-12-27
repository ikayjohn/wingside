/**
 * Script to apply hero slides table migration to Supabase
 * Run with: node scripts/apply-hero-slides-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting hero slides migration...\n');

  try {
    // Read the SQL file
    const sql = require('fs').readFileSync(
      require('path').join(__dirname, '../supabase/migrations/20250126_create_hero_slides.sql'),
      'utf8'
    );

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // If exec_sql doesn't exist, we need to use a different approach
          console.log(`⚠️  Statement ${i + 1}: Cannot execute via RPC (this is expected)`);
          console.log(`   You'll need to apply this migration manually via Supabase dashboard\n`);
        } else {
          console.log(`✅ Statement ${i + 1}: Executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n✨ Migration process completed!\n');
    console.log('📋 Manual Steps Required:');
    console.log('1. Go to Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/20250126_create_hero_slides.sql');
    console.log('4. Run the SQL script\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  }
}

// Alternative: Using psql directly
async function showPSQLCommand() {
  console.log('📋 To apply the migration using psql:\n');
  console.log('psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20250126_create_hero_slides.sql\n');
  console.log('Or apply manually via Supabase dashboard SQL Editor.\n');
}

applyMigration().then(() => {
  showPSQLCommand();
});
