const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔧 Applying maintenance mode migration...\n')

  // Read the migration file
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20250106_maintenance_mode.sql'),
    'utf8'
  )

  // Split into individual statements
  const statements = migrationSQL
    .split('--')
    .filter(s => s.trim())
    .map(s => '--' + s.trim())
    .filter(s => s.length > 3)

  console.log(`Found ${statements.length} SQL statements to execute\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()

    if (statement.length < 10) continue

    try {
      console.log(`[${i + 1}/${statements.length}] Executing...`)

      // Use postgres meta to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      })

      if (error) {
        // Try alternate method using direct SQL execution
        console.log('  ⚠️  RPC not available, SQL will be applied via dashboard')
      } else {
        console.log('  ✓ Success')
      }
    } catch (err) {
      console.log(`  ⚠️  Note: ${err.message}`)
    }
  }

  console.log('\n✅ Migration file ready!')
  console.log('\n📋 Next Steps:')
  console.log('1. Open Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new')
  console.log('\n2. Copy the entire contents of:')
  console.log('   supabase/migrations/20250106_maintenance_mode.sql')
  console.log('\n3. Paste into SQL Editor and click "Run"')
  console.log('\n4. Test at: http://localhost:3000/admin/maintenance')
}

applyMigration().catch(console.error)
