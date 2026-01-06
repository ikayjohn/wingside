/**
 * Reset maintenance mode to production-ready state
 * - Disable maintenance mode
 * - Set default access code (WINGSIDE2025)
 * - Reset message to default
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetMaintenanceMode() {
  console.log('🔄 Resetting maintenance mode to production state...\n')

  try {
    const { data, error } = await supabase
      .rpc('update_maintenance_settings', {
        p_is_enabled: false,
        p_title: 'Site Maintenance',
        p_message: 'We are currently performing scheduled maintenance. We will be back shortly.',
        p_estimated_completion: null,
        p_access_codes: ['WINGSIDE2025']
      })

    if (error) {
      console.error('❌ Failed to reset maintenance mode:', error.message)
      return
    }

    console.log('✅ Maintenance mode reset successfully\n')
    console.log('Settings:')
    console.log('  • Status: Disabled')
    console.log('  • Access Code: WINGSIDE2025')
    console.log('  • Message: Default maintenance message')
    console.log('\n✅ Ready for production use!')

  } catch (error) {
    console.error('❌ Reset failed:', error.message)
  }
}

resetMaintenanceMode()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
