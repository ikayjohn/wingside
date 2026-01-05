const { sendEmail } = require('../lib/notifications/email');
require('dotenv').config({ path: '.env.local' });

async function testOrderConfirmationEmail() {
  console.log('Testing Order Confirmation Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'order_confirmation',
    variables: {
      customer_name: 'John Doe',
      order_number: 'WC-123456',
      total_amount: '₦15,500',
      payment_method: 'Pay with Nomba',
      delivery_address: '123 Main St, Lagos, Nigeria',
      estimated_time: 30,
      order_tracking_url: 'https://wingside.ng/my-account/orders?order=WC-123456',
    },
  });

  console.log('Result:', result);
  return result;
}

async function testOrderReadyEmail() {
  console.log('Testing Order Ready Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'order_ready',
    variables: {
      customer_name: 'John Doe',
      order_number: 'WC-123456',
      delivery_driver: 'Emmanuel Johnson',
      estimated_arrival: '5:30 PM',
      order_tracking_url: 'https://wingside.ng/my-account/orders?order=WC-123456',
    },
  });

  console.log('Result:', result);
  return result;
}

async function testOrderDeliveredEmail() {
  console.log('Testing Order Delivered Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'order_delivered',
    variables: {
      customer_name: 'John Doe',
      order_number: 'WC-123456',
      points_earned: 155,
      total_points: 455,
      reorder_url: 'https://wingside.ng/order',
      review_url: 'https://wingside.ng/review/WC-123456',
    },
  });

  console.log('Result:', result);
  return result;
}

async function testPromotionEmail() {
  console.log('Testing Promotion Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'promotion',
    variables: {
      promo_title: 'Weekend Wing Special! 🔥',
      promo_message:
        'Get 20% off all wing flavors this weekend! Use the code below at checkout to avail this exclusive offer.',
      discount_code: 'WINGS20',
      expiry_date: 'January 7, 2026',
      cta_url: 'https://wingside.ng/order',
      cta_text: 'Order Now',
    },
  });

  console.log('Result:', result);
  return result;
}

async function testRewardEmail() {
  console.log('Testing Reward Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'reward_earned',
    variables: {
      customer_name: 'John Doe',
      reward_message: 'Great job! You earned points from your recent order.',
      points_earned: 155,
      total_points: 455,
      rewards_url: 'https://wingside.ng/my-account/dashboard',
    },
  });

  console.log('Result:', result);
  return result;
}

async function testPasswordResetEmail() {
  console.log('Testing Password Reset Email...');

  const result = await sendEmail({
    to: 'test@example.com', // Replace with a test email
    template_key: 'password_reset',
    variables: {
      customer_name: 'John Doe',
      reset_url: 'https://wingside.ng/auth/reset-password?token=abc123',
    },
  });

  console.log('Result:', result);
  return result;
}

// Main function to run tests
async function runTests() {
  console.log('Starting Email Notification Tests...\n');
  console.log('Make sure to update the test email address in each test function!\n');

  const tests = [
    { name: 'Order Confirmation', fn: testOrderConfirmationEmail },
    { name: 'Order Ready', fn: testOrderReadyEmail },
    { name: 'Order Delivered', fn: testOrderDeliveredEmail },
    { name: 'Promotion', fn: testPromotionEmail },
    { name: 'Reward', fn: testRewardEmail },
    { name: 'Password Reset', fn: testPasswordResetEmail },
  ];

  // Ask user which test to run
  const args = process.argv.slice(2);
  const testToRun = args[0];

  if (testToRun === 'all') {
    console.log(`Running all ${tests.length} tests...\n`);
    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        await test.fn();
      } catch (error) {
        console.error(`Error in ${test.name}:`, error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between emails
    }
  } else if (testToRun) {
    const test = tests.find((t) => t.name.toLowerCase() === testToRun.toLowerCase());
    if (test) {
      console.log(`\n--- ${test.name} ---`);
      try {
        await test.fn();
      } catch (error) {
        console.error(`Error in ${test.name}:`, error);
      }
    } else {
      console.error(`Test "${testToRun}" not found.`);
      console.log('Available tests:', tests.map((t) => t.name).join(', '));
    }
  } else {
    console.log('Usage: node scripts/test-email-notifications.js [test-name|all]');
    console.log('Available tests:');
    tests.forEach((test) => {
      console.log(`  - ${test.name.toLowerCase()}`);
    });
    console.log('  - all');
  }

  console.log('\nTests completed!');
  process.exit(0);
}

runTests().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});
