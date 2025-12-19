/**
 * Migration to add simple_flavors and flavor_label columns
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔧 Running migration to add simple_flavors columns...\n')

  try {
    // Check if columns already exist by trying to select them
    const { error: checkError } = await supabase
      .from('products')
      .select('simple_flavors, flavor_label')
      .limit(1)

    if (!checkError) {
      console.log('✅ Columns already exist, skipping migration')
      return
    }

    // Add columns using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS simple_flavors TEXT[],
        ADD COLUMN IF NOT EXISTS flavor_label TEXT;
      `
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:')
      console.log(`
ALTER TABLE products
ADD COLUMN simple_flavors TEXT[],
ADD COLUMN flavor_label TEXT;
      `)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:')
    console.log(`
ALTER TABLE products
ADD COLUMN simple_flavors TEXT[],
ADD COLUMN flavor_label TEXT;
    `)
    process.exit(1)
  }
}

runMigration()
