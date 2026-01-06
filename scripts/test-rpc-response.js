/**
 * Test RPC Response Format
 * Checks what format get_maintenance_settings actually returns
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRpcFormat() {
  console.log('🔍 Testing RPC Response Format\n')

  try {
    const { data, error } = await supabase
      .rpc('get_maintenance_settings')

    if (error) {
      console.error('❌ RPC Error:', error)
      return
    }

    console.log('📦 Response Properties:')
    console.log('  - Type:', typeof data)
    console.log('  - Is Array:', Array.isArray(data))
    console.log('  - Is Null:', data === null)
    console.log('  - Has Keys:', data ? Object.keys(data).join(', ') : 'N/A')
    console.log()

    console.log('📄 Raw Data (first 300 chars):')
    console.log(JSON.stringify(data).substring(0, 300))
    console.log()

    console.log('✅ Test completed successfully')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRpcFormat()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
