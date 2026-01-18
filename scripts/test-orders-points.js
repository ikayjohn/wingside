const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOrdersPoints() {
  console.log('Testing Orders and Points Calculation...\n');

  try {
    // Get recent orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, user_id, order_number, total, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    console.log('=== Recent Orders ===');
    let totalOrders = 0;
    let totalSpent = 0;
    const ordersByUser = {};

    orders.forEach((order, index) => {
      totalOrders++;
      totalSpent += Number(order.total);

      // Group by user
      if (!ordersByUser[order.user_id]) {
        ordersByUser[order.user_id] = [];
      }
      ordersByUser[order.user_id].push(order);

      console.log(`\n${index + 1}. Order #${order.order_number}`);
      console.log(`   User ID: ${order.user_id}`);
      console.log(`   Total: ₦${Number(order.total).toLocaleString()}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Date: ${new Date(order.created_at).toLocaleString()}`);
    });

    console.log('\n\n=== Summary ===');
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Total Spent: ₦${totalSpent.toLocaleString()}`);
    console.log(`Points Earned (₦100 per point): ${Math.floor(totalSpent / 100).toLocaleString()} points`);

    // Calculate points per user
    console.log('\n\n=== Points by User ===');
    for (const [userId, userOrders] of Object.entries(ordersByUser)) {
      const userTotalSpent = userOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const userPoints = Math.floor(userTotalSpent / 100);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, points')
        .eq('id', userId)
        .single();

      console.log(`\n${profile?.full_name || profile?.email || userId}`);
      console.log(`   Orders: ${userOrders.length}`);
      console.log(`   Total Spent: ₦${userTotalSpent.toLocaleString()}`);
      console.log(`   Points from Orders: ${userPoints.toLocaleString()}`);
      console.log(`   Points in Profile: ${profile?.points || 0}`);
    }

    console.log('\n\n✅ Orders and points test completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testOrdersPoints();
