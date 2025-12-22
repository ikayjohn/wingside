// Debug script to check application status
// Run with: node scripts/debug-application.js

const http = require('http');
const https = require('https');

const baseUrl = 'http://localhost:3000'; // Change to your actual URL if deployed

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${path}`;
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
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
  });
}

async function debugApplication() {
  console.log('🔍 Debugging Application Status...\n');

  const endpoints = [
    { path: '/', name: 'Home Page' },
    { path: '/api/referrals/validate', name: 'Referral Validation API', method: 'POST' },
    { path: '/api/settings', name: 'Settings API' },
    { path: '/api/products', name: 'Products API' },
    { path: '/my-account/referrals', name: 'Referrals Page' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${endpoint.path}`);

      let result;
      if (endpoint.method === 'POST') {
        // For POST endpoints, just check if they respond (even with error)
        result = await makeRequest(endpoint.path);
      } else {
        result = await makeRequest(endpoint.path);
      }

      console.log(`Status: ${result.status}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else if (result.status >= 400) {
        console.log(`Response: ${result.data.substring(0, 200)}...`);
      } else {
        console.log('✅ OK');
      }
      console.log('---');
    } catch (error) {
      console.log(`❌ Failed to test ${endpoint.name}: ${error.message}`);
      console.log('---');
    }
  }

  console.log('\n🔍 Checking Common Issues:');

  // Check if we can connect to localhost:3000
  try {
    await makeRequest('/');
    console.log('✅ Application is running on localhost:3000');
  } catch (error) {
    console.log('❌ Application is not running on localhost:3000');
    console.log('💡 Start the application with: npm run dev');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Make sure the application is running: npm run dev');
  console.log('2. Check environment variables (.env.local)');
  console.log('3. Verify database connection in Supabase');
  console.log('4. Check browser console for JavaScript errors');
  console.log('5. Check network tab for failed API requests');
}

debugApplication().catch(console.error);