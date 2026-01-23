const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyRetroactivePoints() {
  console.log('Manually awarding retroactive points...\n');

  // Get all paid orders with user emails
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, order_number, total, profiles!inner(email)')
    .eq('payment_status', 'paid');

  if (ordersError) {
    console.log('Error fetching orders:', ordersError);
    return;
  }

  console.log(`Found ${orders.length} paid orders\n`);

  // Group by user to avoid duplicates
  const usersMap = new Map();

  for (const order of orders) {
    const userId = order.user_id;
    const email = order.profiles.email;

    if (!usersMap.has(userId)) {
      usersMap.set(userId, {
        userId,
        email,
        orders: []
      });
    }

    usersMap.get(userId).orders.push({
      id: order.id,
      order_number: order.order_number,
      total: order.total
    });
  }

  console.log(`Found ${usersMap.size} unique users with paid orders\n`);

  // Award points for each user
  for (const [userId, userData] of usersMap) {
    const { email, orders } = userData;

    console.log(`\nProcessing ${email}...`);
    let totalPoints = 0;

    for (const order of orders) {
      const points = Math.floor(Number(order.total) / 100);
      totalPoints += points;

      console.log(`  Order #${order.order_number}: ₦${order.total} → ${points} points`);

      // Award points using the RPC function
      const { error: awardError } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_reward_type: 'purchase',
        p_points: points,
        p_amount_spent: Number(order.total),
        p_description: `Points from order #${order.order_number}`,
        p_metadata: { retroactive: true }
      });

      if (awardError) {
        console.log(`  ❌ Error: ${awardError.message}`);
      }
    }

    console.log(`  Total: ${totalPoints} points awarded`);
  }

  console.log('\n\n=== Verifying Results ===');

  // Show final results
  const { data: finalResults } = await supabase
    .from('profiles')
    .select('email, total_points')
    .gt('total_points', 0)
    .order('total_points', { ascending: false });

  if (finalResults) {
    finalResults.forEach(p => {
      console.log(`${p.email}: ${p.total_points} points`);
    });
  }

  console.log('\n✅ Done!');
}

applyRetroactivePoints().catch(err => {
  console.error('Error:', err);
});
