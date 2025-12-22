// Test auto-wallet creation API
const testEmail = 'wallettest149769@wingside.ng';
const password = 'Hoodhop@1';

async function testAutoWalletAPI() {
  console.log('🔄 Testing auto-wallet API...\n');

  try {
    // First, login to get session
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password })
    });

    // Try the auto-wallet endpoint directly
    console.log('💰 Step 2: Calling auto-wallet API...');
    const walletResponse = await fetch('http://localhost:3000/api/embedly/auto-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const walletData = await walletResponse.json();
    console.log('\n📊 Response:', JSON.stringify(walletData, null, 2));

    if (walletData.success) {
      console.log('\n✅ Auto-wallet creation successful!');
      if (walletData.wallet) {
        console.log(`   Wallet ID: ${walletData.wallet.id}`);
        console.log(`   Account: ${walletData.wallet.virtualAccount?.accountNumber || 'N/A'}`);
        console.log(`   Balance: ₦${(walletData.wallet.availableBalance || 0).toLocaleString()}`);
      }
    } else {
      console.log('\n❌ Auto-wallet creation failed:', walletData.message || walletData.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAutoWalletAPI().then(() => process.exit(0));
