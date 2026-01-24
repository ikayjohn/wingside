/**
 * Test Email Referral Sharing
 *
 * This script tests the email referral sharing functionality
 */

// Test with a sample user
const testEmailReferral = async () => {
  console.log('🧪 Testing Email Referral Sharing...\n');

  const baseUrl = 'http://localhost:3000';

  // You'll need to replace this with a valid session token
  // To get a session token:
  // 1. Login to the app
  // 2. Open browser DevTools > Application > Cookies
  // 3. Copy the value of the session cookie
  const sessionToken = 'YOUR_SESSION_TOKEN_HERE';

  const testData = {
    shareMethod: 'email',
    recipientEmail: 'test@example.com', // Replace with your test email
    customMessage: 'Hey! I love Wingside and thought you would too. Sign up with my code to get ₦1,000!'
  };

  try {
    console.log('📧 Sending referral email to:', testData.recipientEmail);
    console.log('📝 Custom message:', testData.customMessage);
    console.log('');

    const response = await fetch(`${baseUrl}/api/referrals/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-localhost-auth-token=${sessionToken}` // Adjust cookie name if different
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('\nResponse:', JSON.stringify(result, null, 2));
      console.log('\n📬 Check the recipient inbox for the email');
    } else {
      console.error('❌ Failed to send email');
      console.error('Error:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Manual test instructions
console.log(`
📧 Email Referral Sharing Test
================================

SETUP:
1. Make sure the app is running (npm run dev)
2. Make sure RESEND_API_KEY is set in .env.local
3. Login to the app to get a valid session
4. Update this script with your session token

TO TEST:
1. Replace 'YOUR_SESSION_TOKEN_HERE' with actual session token
2. Replace 'test@example.com' with your email
3. Run: node scripts/test-email-referral.js

WHAT TO VERIFY:
✓ API returns success
✓ Email appears in recipient inbox
✓ Email contains referral code
✓ Email contains custom message
✓ Email has proper branding
✓ Referral link works when clicked
✓ Share is logged in referral_shares table

================================
`);

// Uncomment to run the test
// testEmailReferral();
