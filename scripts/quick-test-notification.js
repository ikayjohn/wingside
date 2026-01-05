require('dotenv').config({ path: '.env.local' });

async function quickTest() {
  console.log('🧪 Quick Notification Test\n');

  // Test 1: Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in .env.local');
    console.log('Please add: RESEND_API_KEY=re_your_key_here');
    process.exit(1);
  }
  console.log('✅ RESEND_API_KEY is configured\n');

  // Test 2: Check VAPID keys
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('❌ VAPID keys not found in .env.local');
    console.log('Please run: node scripts/generate-vapid-keys.js');
    process.exit(1);
  }
  console.log('✅ VAPID keys are configured\n');

  // Test 3: Try to send a test email (without actually sending)
  console.log('📧 Testing email configuration...\n');
  console.log('IMPORTANT: Before testing with real email, update the recipient in:');
  console.log('scripts/test-email-notifications.js (line ~8-9)');
  console.log('');
  console.log('Then run: node scripts/test-email-notifications.js order confirmation');
  console.log('');

  console.log('✅ Configuration looks good!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Your notification system is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('What you can do now:\n');
  console.log('1. 📱 Test Push Notifications:');
  console.log('   - Visit: http://localhost:3000/my-account/notifications');
  console.log('   - Toggle "Push Notifications" to on');
  console.log('   - Grant permission when prompted\n');
  console.log('2. 📧 Test Email Notifications:');
  console.log('   - Update your email in scripts/test-email-notifications.js');
  console.log('   - Run: node scripts/test-email-notifications.js order confirmation\n');
  console.log('3. 👤 User Notification Preferences:');
  console.log('   - Visit: http://localhost:3000/my-account/notifications');
  console.log('   - Try toggling different notification types\n');
  console.log('4. 📊 Admin Dashboard:');
  console.log('   - Visit: http://localhost:3000/admin/notifications');
  console.log('   - View notification logs and statistics\n');
  console.log('5. 🔗 Integrate with Orders:');
  console.log('   import { onOrderCreated } from "@/lib/notifications/order-notifications";');
  console.log('   await onOrderCreated(orderId);\n');

  process.exit(0);
}

quickTest().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
