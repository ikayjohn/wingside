// Test script for referral system
// Run with: node scripts/test-referral-system.js

const http = require('http');

async function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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

async function testReferralSystem() {
  console.log('🧪 Testing Referral System...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const healthResult = await makeRequest('http://localhost:3000/api/health/');
  console.log(`Status: ${healthResult.status}`);
  if (healthResult.data?.services) {
    console.log('Database Status:', healthResult.data.services.database);
    console.log('Environment:', healthResult.data.services.environment);
  }
  console.log('---');

  // Test 2: Database Tables
  console.log('2. Testing Database Tables...');
  const dbResult = await makeRequest('http://localhost:3000/api/test-referral-db/');
  console.log(`Status: ${dbResult.status}`);
  if (dbResult.data?.tables) {
    Object.entries(dbResult.data.tables).forEach(([table, status]) => {
      console.log(`${table}: ${status.exists ? '✅' : '❌'} ${status.error || 'OK'}`);
    });
  }
  console.log('---');

  // Test 3: Referral Validation API
  console.log('3. Testing Referral Validation...');
  const validationResult = await makeRequest(
    'http://localhost:3000/api/referrals/validate/',
    'POST',
    { referralCode: 'TEST123' }
  );
  console.log(`Status: ${validationResult.status}`);
  console.log('Response:', validationResult.data);
  console.log('---');

  // Test 4: My Referrals API (should be unauthorized without auth)
  console.log('4. Testing My Referrals API...');
  const myReferralsResult = await makeRequest('http://localhost:3000/api/referrals/my-referrals/');
  console.log(`Status: ${myReferralsResult.status}`);
  console.log('Response:', myReferralsResult.data);
  console.log('---');

  // Test 5: Referral Share API (should be unauthorized without auth)
  console.log('5. Testing Referral Share API...');
  const shareResult = await makeRequest(
    'http://localhost:3000/api/referrals/share/',
    'POST',
    { shareMethod: 'copy_link' }
  );
  console.log(`Status: ${shareResult.status}`);
  console.log('Response:', shareResult.data);
  console.log('---');

  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. If health check fails: Check environment variables');
  console.log('2. If database tables missing: Run scripts/deploy-referral-system-simple.sql');
  console.log('3. If API endpoints return 401: Need to be authenticated');
  console.log('4. If API endpoints return 500: Check server logs');
  console.log('5. Open browser and go to http://localhost:3000/api/health/ for detailed status');
}

testReferralSystem().catch(console.error);