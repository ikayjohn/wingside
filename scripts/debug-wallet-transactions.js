// Debug script to check wallet transactions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWalletTransactions() {
  console.log('🔍 Debugging Wallet Transactions...\n');

  // 1. Check if table exists
  console.log('1. Checking if wallet_transactions table exists...');
  const { data: tables, error: tableError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .limit(1);

  if (tableError) {
    console.log('   ❌ Table does not exist or error:', tableError.message);
    console.log('   Code:', tableError.code);
    return;
  }
  console.log('   ✅ Table exists');

  // 2. Count all transactions
  console.log('\n2. Counting all wallet transactions...');
  const { count, error: countError } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('   ❌ Error counting:', countError.message);
  } else {
    console.log(`   ✅ Total transactions: ${count || 0}`);
  }

  // 3. Get sample transactions
  console.log('\n3. Fetching sample transactions...');
  const { data: transactions, error: fetchError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.log('   ❌ Error fetching:', fetchError.message);
  } else if (!transactions || transactions.length === 0) {
    console.log('   ⚠️  No transactions found in database');
  } else {
    console.log(`   ✅ Found ${transactions.length} transactions:`);
    transactions.forEach((t, i) => {
      console.log(`      ${i + 1}. User: ${t.user_id}, Type: ${t.transaction_type}, Amount: ${t.amount}, Status: ${t.status}`);
    });
  }

  // 4. Check RLS policies
  console.log('\n4. Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'wallet_transactions');

  if (policyError) {
    console.log('   ❌ Error checking policies (need service role):', policyError.message);
  } else {
    console.log(`   ✅ Found ${policies?.length || 0} RLS policies`);
    policies?.forEach((p) => {
      console.log(`      - ${p.policyname}: ${p.cmd}`);
    });
  }

  // 5. Check if there are users
  console.log('\n5. Checking users...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('   ❌ Error fetching users:', usersError.message);
  } else {
    console.log(`   ✅ Total users: ${users.users.length}`);
    if (users.users.length > 0) {
      console.log('      Sample users:');
      users.users.slice(0, 3).forEach((u) => {
        console.log(`         - ${u.id}: ${u.email}`);
      });
    }
  }

  console.log('\n✅ Debug complete!');
}

debugWalletTransactions().catch(console.error);
