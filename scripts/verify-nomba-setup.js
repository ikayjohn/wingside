// Verify Nomba integration setup
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

console.log('🔍 Verifying Nomba Payment Gateway Integration...\n')

// 1. Check environment variables
console.log('📋 Step 1: Checking environment variables...')
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NOMBA_CLIENT_ID',
  'NOMBA_CLIENT_SECRET',
  'NOMBA_ACCOUNT_ID'
]

let envOk = true
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value !== `your_${varName.toLowerCase()}_here`) {
    console.log(`  ✅ ${varName}: Set`)
  } else {
    console.log(`  ❌ ${varName}: Missing or using placeholder`)
    envOk = false
  }
})

if (!envOk) {
  console.log('\n❌ Environment variables not properly configured')
  process.exit(1)
}

// 2. Check database connection and payment_gateway column
console.log('\n📋 Step 2: Checking database schema...')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDatabase() {
  try {
    // Try to query the orders table with payment_gateway column
    const { data, error } = await supabase
      .from('orders')
      .select('id, payment_gateway, payment_status')
      .limit(1)

    if (error) {
      if (error.message.includes('column "payment_gateway" does not exist')) {
        console.log('  ❌ payment_gateway column: Missing')
        console.log('\n⚠️  Run this SQL in Supabase SQL Editor:')
        console.log(`
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, or split';

UPDATE orders
SET payment_gateway = 'paystack'
WHERE payment_gateway IS NULL OR payment_gateway = '';
        `)
        return false
      } else {
        console.log(`  ❌ Database error: ${error.message}`)
        return false
      }
    }

    console.log('  ✅ Database connection: Working')
    console.log('  ✅ payment_gateway column: Exists')
    return true

  } catch (error) {
    console.log(`  ❌ Error checking database: ${error.message}`)
    return false
  }
}

// 3. Test Nomba authentication
async function testNombaAuth() {
  console.log('\n📋 Step 3: Testing Nomba API authentication...')

  try {
    const response = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': process.env.NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_CLIENT_SECRET,
      }),
    })

    const data = await response.json()

    if (data.code === '00' && data.data?.access_token) {
      console.log('  ✅ Nomba authentication: Successful')
      console.log('  ✅ Access token: Obtained')
      return true
    } else {
      console.log(`  ❌ Nomba authentication failed`)
      console.log(`     Response: ${JSON.stringify(data)}`)
      return false
    }

  } catch (error) {
    console.log(`  ❌ Error testing Nomba API: ${error.message}`)
    return false
  }
}

// 4. Check API routes exist
console.log('\n📋 Step 4: Checking API routes...')
const fs = require('fs')
const apiRoutes = [
  'app/api/payment/nomba/initialize/route.ts',
  'app/api/payment/nomba/verify/route.ts',
  'app/api/payment/nomba/webhook/route.ts',
  'app/payment/nomba/callback/page.tsx'
]

let routesOk = true
apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`  ✅ ${route}`)
  } else {
    console.log(`  ❌ ${route}: Missing`)
    routesOk = false
  }
})

// Run all checks
async function runChecks() {
  const dbOk = await checkDatabase()
  const nombaOk = await testNombaAuth()

  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  if (envOk && dbOk && nombaOk && routesOk) {
    console.log('✅ All checks passed! Nomba integration is ready to use.')
    console.log('\n🚀 Next steps:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Go to checkout and select "Pay with Nomba"')
    console.log('   3. Test the payment flow')
    console.log('\n📝 Webhook setup (after testing works):')
    console.log('   URL: https://www.wingside.ng/api/payment/nomba/webhook')
    console.log('   Events: payment_success, payment_failed')
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.')
    if (!dbOk) {
      console.log('\n⚠️  Database: Run the SQL migration (see above)')
    }
    if (!nombaOk) {
      console.log('\n⚠️  Nomba: Check your credentials in .env.local')
    }
    process.exit(1)
  }
}

runChecks()
