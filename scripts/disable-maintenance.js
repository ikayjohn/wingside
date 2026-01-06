const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function disableMaintenance() {
  try {
    console.log('Disabling maintenance mode...\n')

    const { data, error } = await supabase
      .rpc('update_maintenance_settings', {
        p_is_enabled: false
      })

    if (error) {
      console.error('Error disabling maintenance mode:', error)
      return
    }

    console.log('✓ Maintenance mode disabled successfully!')
    console.log('Updated settings:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('Error:', error.message)
  }
}

disableMaintenance()
