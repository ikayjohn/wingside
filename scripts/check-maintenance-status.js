const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkMaintenanceStatus() {
  try {
    console.log('Checking maintenance mode status...\n')

    const { data, error } = await supabase
      .rpc('get_maintenance_settings')

    if (error) {
      console.error('Error fetching maintenance settings:', error)
      return
    }

    console.log('Current Maintenance Settings:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\nMaintenance Mode Enabled:', data.is_enabled)
    console.log('Access Codes:', data.access_codes)

    if (data.is_enabled) {
      console.log('\n⚠️  MAINTENANCE MODE IS ENABLED')
      console.log('This is causing users to be redirected to /maintenance page')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkMaintenanceStatus()
