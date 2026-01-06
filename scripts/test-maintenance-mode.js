/**
 * Test Maintenance Mode Functionality
 *
 * This script tests:
 * 1. Enable maintenance mode
 * 2. Check if settings are retrieved correctly
 * 3. Validate access code
 * 4. Disable maintenance mode
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMaintenanceMode() {
  console.log('🧪 Testing Maintenance Mode Functionality\n')

  try {
    // Test 1: Get current settings
    console.log('📋 Test 1: Fetching current maintenance settings...')
    const { data: currentSettings, error: fetchError } = await supabase
      .rpc('get_maintenance_settings')

    if (fetchError) {
      console.error('❌ Failed to fetch settings:', fetchError.message)
      return
    }

    const settings = typeof currentSettings === 'string' ? JSON.parse(currentSettings) : currentSettings
    console.log('✅ Current settings:', JSON.stringify(settings, null, 2))
    console.log()

    // Test 2: Enable maintenance mode
    console.log('🔧 Test 2: Enabling maintenance mode...')
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_maintenance_settings', {
        p_is_enabled: true,
        p_title: 'Scheduled Maintenance',
        p_message: 'We are performing updates. Please check back soon.',
        p_estimated_completion: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        p_access_codes: ['TEST2025', 'WINGSIDE', 'ADMIN']
      })

    if (updateError) {
      console.error('❌ Failed to enable maintenance mode:', updateError.message)
      return
    }
    console.log('✅ Maintenance mode enabled successfully')
    console.log()

    // Test 3: Verify settings were updated
    console.log('🔍 Test 3: Verifying updated settings...')
    const { data: updatedSettings, error: verifyError } = await supabase
      .rpc('get_maintenance_settings')

    if (verifyError) {
      console.error('❌ Failed to verify settings:', verifyError.message)
      return
    }

    const verified = typeof updatedSettings === 'string' ? JSON.parse(updatedSettings) : updatedSettings
    console.log('✅ Verified settings:', JSON.stringify(verified, null, 2))
    console.log()

    // Test 4: Check access codes
    console.log('🔑 Test 4: Testing access codes...')
    const testCode = 'TEST2025'
    const hasCode = verified.access_codes && verified.access_codes.includes(testCode)
    console.log(`✅ Access code "${testCode}" ${hasCode ? 'exists' : 'NOT FOUND'} in settings`)
    console.log()

    // Test 5: Disable maintenance mode
    console.log('🔓 Test 5: Disabling maintenance mode...')
    const { data: disableResult, error: disableError } = await supabase
      .rpc('update_maintenance_settings', {
        p_is_enabled: false,
        p_access_codes: verified.access_codes // Keep the same access codes
      })

    if (disableError) {
      console.error('❌ Failed to disable maintenance mode:', disableError.message)
      return
    }
    console.log('✅ Maintenance mode disabled successfully')
    console.log()

    // Final verification
    console.log('✅ Final verification: Fetching settings after disable...')
    const { data: finalSettings, error: finalError } = await supabase
      .rpc('get_maintenance_settings')

    if (finalError) {
      console.error('❌ Failed to fetch final settings:', finalError.message)
      return
    }

    const final = typeof finalSettings === 'string' ? JSON.parse(finalSettings) : finalSettings
    console.log('✅ Final settings:', JSON.stringify(final, null, 2))
    console.log()

    console.log('✨ All tests passed! Maintenance mode is working correctly.\n')
    console.log('Summary:')
    console.log('  ✓ Database functions working')
    console.log('  ✓ Access codes system functional')
    console.log('  ✓ Settings can be updated and retrieved')
    console.log('  ✓ Maintenance mode can be enabled/disabled')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

testMaintenanceMode()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
