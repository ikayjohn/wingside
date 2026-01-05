const { createClient } = require('@supabase/supabase-js');
const { sendPushNotification } = require('../lib/notifications/push');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPushNotification() {
  console.log('Testing Push Notification...');

  // Get a test user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No users found. Please create a user account first.');
    return;
  }

  const userId = users[0].id;
  console.log(`Sending test push notification to user: ${users[0].full_name || userId}`);

  const result = await sendPushNotification(userId, {
    title: 'Test Notification',
    body: 'This is a test push notification from Wingside!',
    icon: '/logo.png',
    badge: '/badge-icon.png',
    url: '/my-account/dashboard',
    requireInteraction: true,
  });

  console.log('Result:', result);
  return result;
}

async function testOrderConfirmationPush() {
  console.log('Testing Order Confirmation Push...');

  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No users found.');
    return;
  }

  const { sendOrderConfirmationPush } = require('../lib/notifications/push');

  const result = await sendOrderConfirmationPush(users[0].id, {
    orderNumber: 'WC-123456',
    totalAmount: '₦15,500',
    estimatedTime: 30,
  });

  console.log('Result:', result);
  return result;
}

async function testPromotionPush() {
  console.log('Testing Promotion Push...');

  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No users found.');
    return;
  }

  const { sendPromotionPush } = require('../lib/notifications/push');

  const result = await sendPromotionPush(users[0].id, {
    title: 'Weekend Special! 🔥',
    message: 'Get 20% off all wings this weekend!',
    discountCode: 'WINGS20',
    url: '/order',
  });

  console.log('Result:', result);
  return result;
}

async function testRewardPush() {
  console.log('Testing Reward Push...');

  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No users found.');
    return;
  }

  const { sendRewardPush } = require('../lib/notifications/push');

  const result = await sendRewardPush(users[0].id, {
    pointsEarned: 155,
    totalPoints: 455,
    rewardMessage: 'Great job! You earned points from your recent order.',
  });

  console.log('Result:', result);
  return result;
}

async function listActivePushSubscriptions() {
  console.log('Active Push Subscriptions:\n');

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, user_agent, created_at')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No active push subscriptions found.');
    return;
  }

  console.log(`Found ${subscriptions.length} active subscriptions:\n`);
  subscriptions.forEach((sub, index) => {
    console.log(`${index + 1}. User ID: ${sub.user_id}`);
    console.log(`   Endpoint: ${sub.endpoint.substring(0, 50)}...`);
    console.log(`   User Agent: ${sub.user_agent || 'Unknown'}`);
    console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
    console.log('');
  });
}

// Main function
async function runTests() {
  console.log('Push Notification Testing Utility\n');

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'test':
      await testPushNotification();
      break;
    case 'order':
      await testOrderConfirmationPush();
      break;
    case 'promotion':
      await testPromotionPush();
      break;
    case 'reward':
      await testRewardPush();
      break;
    case 'list':
      await listActivePushSubscriptions();
      break;
    default:
      console.log('Usage: node scripts/test-push-notifications.js [command]');
      console.log('\nCommands:');
      console.log('  test       - Send a basic test notification');
      console.log('  order      - Send order confirmation notification');
      console.log('  promotion  - Send promotion notification');
      console.log('  reward     - Send reward notification');
      console.log('  list       - List all active push subscriptions');
      break;
  }

  process.exit(0);
}

runTests().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
