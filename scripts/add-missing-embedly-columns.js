// Run SQL to add missing Embedly columns
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- Add missing Embedly fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_wallet_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_wallet_sync TIMESTAMP WITH TIME ZONE;

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_bank_account ON profiles(bank_account);
CREATE INDEX IF NOT EXISTS idx_profiles_is_wallet_active ON profiles(is_wallet_active);
`;

async function main() {
  console.log('🔄 Adding missing Embedly columns to profiles table...\n');

  // Use RPC to execute SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If exec_sql doesn't exist, try direct SQL via the client
    console.log('ℹ️ exec_sql not available, trying alternative approach...\n');
    console.log('⚠️ Please run this SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new\n');
    console.log(sql);
    return;
  }

  console.log('✅ Columns added successfully!\n');

  // Verify columns
  const { data: columns, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .limit(0);

  if (checkError) {
    console.error('Error verifying:', checkError);
    return;
  }

  console.log('✅ Verification complete!');
}

main().catch(console.error);
