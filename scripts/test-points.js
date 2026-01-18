const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPoints() {
  console.log('Testing Points System...\n');

  try {
    // Get profiles with points
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, points, wallet_balance, referral_code, created_at, full_name')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log('=== User Profiles with Points ===');
    profiles.forEach((profile, index) => {
      const totalPoints = profile.points || 0;
      let tier = 'Wing Member';
      if (totalPoints >= 20000) tier = 'Wingzard';
      else if (totalPoints >= 5001) tier = 'Wing Leader';

      console.log(`\n${index + 1}. ${profile.full_name || profile.email}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Points: ${totalPoints.toLocaleString()}`);
      console.log(`   Wallet Balance: ₦${(profile.wallet_balance || 0).toLocaleString()}`);
      console.log(`   Tier: ${tier}`);
      console.log(`   Referral Code: ${profile.referral_code || 'N/A'}`);
    });

    // Check points_history table
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('\nError fetching points history:', historyError);
    } else {
      console.log('\n\n=== Recent Points History ===');
      pointsHistory.forEach((entry, index) => {
        console.log(`\n${index + 1}. ${entry.description}`);
        console.log(`   Customer ID: ${entry.customer_id}`);
        console.log(`   Points: ${entry.points > 0 ? '+' : ''}${entry.points}`);
        console.log(`   Type: ${entry.transaction_type}`);
        console.log(`   Date: ${new Date(entry.created_at).toLocaleString()}`);
      });
    }

    // Check referral_rewards table
    const { data: referrals, error: referralsError } = await supabase
      .from('referral_rewards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (referralsError) {
      console.error('\nError fetching referral rewards:', referralsError);
    } else {
      console.log('\n\n=== Recent Referral Rewards ===');
      referrals.forEach((entry, index) => {
        console.log(`\n${index + 1}. Referral Code: ${entry.referral_code}`);
        console.log(`   Referrer ID: ${entry.referrer_id}`);
        console.log(`   Referred Email: ${entry.referred_email}`);
        console.log(`   Reward Amount: ₦${entry.reward_amount}`);
        console.log(`   Status: ${entry.status}`);
        console.log(`   Date: ${new Date(entry.created_at).toLocaleString()}`);
      });
    }

    console.log('\n\n✅ Points system test completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testPoints();
