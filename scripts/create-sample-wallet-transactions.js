// Create sample wallet transactions for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleTransactions() {
  // Get the first user
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users.users[0]?.id;

  if (!userId) {
    console.error('No users found!');
    return;
  }

  console.log(`Creating sample transactions for user: ${users.users[0].email}\n`);

  const sampleTransactions = [
    {
      user_id: userId,
      type: 'credit',
      amount: 5000,
      balance_after: 5000,
      transaction_type: 'funding',
      description: 'Initial wallet funding',
      status: 'completed',
      metadata: { payment_method: 'bank_transfer' }
    },
    {
      user_id: userId,
      type: 'credit',
      amount: 1500,
      balance_after: 6500,
      transaction_type: 'referral_reward',
      description: 'Referral bonus - Referred a friend',
      status: 'completed',
      metadata: { referral_code: 'ABC123' }
    },
    {
      user_id: userId,
      type: 'debit',
      amount: 2500,
      balance_after: 4000,
      transaction_type: 'order_payment',
      description: 'Order Payment - #ORD-001',
      status: 'completed',
      order_id: null,
      metadata: { order_payment: true, order_number: 'ORD-001' }
    },
    {
      user_id: userId,
      type: 'credit',
      amount: 500,
      balance_after: 4500,
      transaction_type: 'first_order_bonus',
      description: 'First order bonus - Welcome reward!',
      status: 'completed',
      metadata: { bonus_type: 'first_order' }
    },
    {
      user_id: userId,
      type: 'credit',
      amount: 750,
      balance_after: 5250,
      transaction_type: 'purchase_points',
      description: 'Points earned from order #ORD-001',
      status: 'completed',
      metadata: { points_earned: 75 }
    }
  ];

  let currentBalance = 0;

  for (const txn of sampleTransactions) {
    currentBalance = txn.balance_after;

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert(txn)
      .select();

    if (error) {
      console.error(`❌ Failed to create transaction: ${error.message}`);
    } else {
      console.log(`✅ Created: ${txn.transaction_type} - ₦${txn.amount} (Balance: ₦${currentBalance})`);
    }
  }

  console.log(`\n✅ Done! Check your wallet history at http://localhost:3000/my-account/wallet-history`);
}

createSampleTransactions().catch(console.error);
