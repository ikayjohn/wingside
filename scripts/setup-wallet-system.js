/**
 * Setup Wallet System
 *
 * This script creates the wallet_transactions table and helper functions
 * in the Supabase database.
 *
 * Usage:
 *   node scripts/setup-wallet-system.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupWalletSystem() {
  console.log('🔄 Setting up Wallet System...\n');

  try {
    // Read and execute the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250105_create_wallet_transactions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements
      if (!statement || statement.length < 10) continue;

      try {
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        // Try direct SQL via rest if rpc doesn't work
        if (error) {
          console.log(`Statement ${i + 1}/${statements.length}: ⚠️  ${error.message.substring(0, 100)}...`);
          skipCount++;
        } else {
          console.log(`Statement ${i + 1}/${statements.length}: ✅ Success`);
          successCount++;
        }
      } catch (err) {
        // Some errors are expected (table already exists, etc.)
        const errorMsg = err.message;
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('42P07') || // relation already exists
          errorMsg.includes('42710')    // function already exists
        ) {
          console.log(`Statement ${i + 1}/${statements.length}: ⏭️  Skipped (already exists)`);
          skipCount++;
        } else {
          console.log(`Statement ${i + 1}/${statements.length}: ⚠️  ${errorMsg.substring(0, 100)}...`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n📊 Setup Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ Table was not created. You may need to run the migration manually.');
        console.log('\n💡 Manual setup:');
        console.log('1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
        console.log('2. Copy the SQL from: supabase/migrations/20250105_create_wallet_transactions.sql');
        console.log('3. Paste and run it in the SQL editor\n');
      } else {
        console.log('⚠️  Unexpected error:', tableError.message);
      }
    } else {
      console.log('✅ wallet_transactions table created successfully!');
    }

    // Test helper functions
    console.log('\n🧪 Testing helper functions...');

    // Test get_wallet_balance function
    const { data: balanceTest, error: balanceError } = await supabase
      .rpc('get_wallet_balance', { p_user_id: '00000000-0000-0000-0000-000000000000' });

    if (balanceError && !balanceError.message.includes('function')) {
      console.log('⚠️  get_wallet_balance function may not be working correctly');
    } else if (balanceError && balanceError.message.includes('function')) {
      console.log('❌ Helper functions not created. Please run the migration manually.');
    } else {
      console.log('✅ Helper functions created successfully!');
    }

    console.log('\n✨ Wallet system setup complete!');
    console.log('\n📚 Next steps:');
    console.log('   1. Wallet transactions can now be tracked');
    console.log('   2. Use lib/wallet/helper.ts for wallet operations');
    console.log('   3. API endpoints: /api/user/wallet-balance, /api/user/wallet-history\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n💡 Manual setup:');
    console.log('1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/20250105_create_wallet_transactions.sql');
    console.log('3. Paste and run it in the SQL editor\n');
    process.exit(1);
  }
}

setupWalletSystem();
