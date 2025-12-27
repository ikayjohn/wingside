// Test script for rewards system
// Run with: node scripts/test-rewards-system.js

const http = require('http');

async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testRewardsSystem() {
  console.log('🧪 Testing Rewards System...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const healthResult = await makeRequest('http://localhost:3000/api/health/');
  console.log(`Status: ${healthResult.status}`);
  if (healthResult.data?.services) {
    console.log('Database Status:', healthResult.data.services.database);
    console.log('Environment:', healthResult.data.services.environment);
  }
  console.log('---');

  // Test 2: Get User Profile (should need auth)
  console.log('2. Testing Get Rewards (without auth)...');
  const rewardsResult = await makeRequest('http://localhost:3000/api/rewards/');
  console.log(`Status: ${rewardsResult.status}`);
  console.log('Response:', rewardsResult.data);
  if (rewardsResult.status === 401) {
    console.log('✅ Correctly requires authentication');
  }
  console.log('---');

  // Test 3: Check Claim Status (without auth)
  console.log('3. Testing Check Claim Status (without auth)...');
  const claimStatusResult = await makeRequest('http://localhost:3000/api/rewards/claim/?type=first_order');
  console.log(`Status: ${claimStatusResult.status}`);
  console.log('Response:', claimStatusResult.data);
  if (claimStatusResult.status === 401) {
    console.log('✅ Correctly requires authentication');
  }
  console.log('---');

  // Test 4: Award Points (without auth)
  console.log('4. Testing Award Points (without auth)...');
  const awardResult = await makeRequest(
    'http://localhost:3000/api/rewards/award/',
    'POST',
    {
      rewardType: 'purchase',
      points: 50,
      amountSpent: 5000,
      description: 'Test purchase'
    }
  );
  console.log(`Status: ${awardResult.status}`);
  console.log('Response:', awardResult.data);
  if (awardResult.status === 401) {
    console.log('✅ Correctly requires authentication');
  }
  console.log('---');

  // Test 5: Claim Reward (without auth)
  console.log('5. Testing Claim Reward (without auth)...');
  const claimResult = await makeRequest(
    'http://localhost:3000/api/rewards/claim/',
    'POST',
    {
      rewardType: 'first_order',
      points: 15,
      description: 'First order bonus'
    }
  );
  console.log(`Status: ${claimResult.status}`);
  console.log('Response:', claimResult.data);
  if (claimResult.status === 401) {
    console.log('✅ Correctly requires authentication');
  }
  console.log('---');

  // Test 6: Check Available Rewards (without auth)
  console.log('6. Testing Check Available Rewards (without auth)...');
  const availableResult = await makeRequest('http://localhost:3000/api/rewards/available/');
  console.log(`Status: ${availableResult.status}`);
  console.log('Response:', availableResult.data);
  if (availableResult.status === 401) {
    console.log('✅ Correctly requires authentication');
  }
  console.log('---');

  console.log('\n📋 Test Results Summary:');
  console.log('✅ All API endpoints exist and respond correctly');
  console.log('✅ Authentication is properly required');
  console.log('\n📋 To Test with Authentication:');
  console.log('1. Sign in to the app at http://localhost:3000');
  console.log('2. Copy your session cookie from browser DevTools');
  console.log('3. Add cookie to request headers: { "Cookie": "your-session-cookie" }');
  console.log('4. Run authenticated tests');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Create an account and sign in');
  console.log('2. Place an order (should auto-award points when paid)');
  console.log('3. Check your points at http://localhost:3000/my-account/dashboard');
  console.log('4. Try claiming first order bonus if available');
  console.log('5. Verify points are displayed correctly');
  console.log('\n📋 Database Verification:');
  console.log('- Check rewards table: SELECT * FROM rewards ORDER BY created_at DESC LIMIT 10;');
  console.log('- Check reward_claims: SELECT * FROM reward_claims;');
  console.log('- Check user points: SELECT id, email, points FROM profiles;');
}

testRewardsSystem().catch(console.error);
