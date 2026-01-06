/**
 * Test API endpoints directly
 * This bypasses the frontend to test if APIs are working
 */

const fetch = require('node-fetch')

async function testValidateAPI() {
  console.log('🧪 Testing /api/validate-access-code endpoint...\n')

  try {
    const response = await fetch('http://localhost:3000/api/validate-access-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: 'WINGSIDE2025' })
    })

    console.log('Status:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log('Raw response (first 500 chars):')

    const rawText = await response.text()
    console.log(rawText.substring(0, 500))

    if (response.ok) {
      try {
        const data = JSON.parse(rawText)
        console.log('\n✅ Parsed JSON:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('\n❌ Failed to parse as JSON')
      }
    } else {
      console.log('\n❌ Request failed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

async function testAdminAPI() {
  console.log('\n\n🧪 Testing /api/admin/maintenance endpoint...\n')
  console.log('Note: This will fail without auth, but we can see the response format\n')

  try {
    const response = await fetch('http://localhost:3000/api/admin/maintenance')

    console.log('Status:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log('Raw response (first 500 chars):')

    const rawText = await response.text()
    console.log(rawText.substring(0, 500))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log('⚠️  Make sure the dev server is running on http://localhost:3000')
console.log('Run: npm run dev\n')

setTimeout(() => {
  testValidateAPI()
    .then(() => testAdminAPI())
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}, 2000)
