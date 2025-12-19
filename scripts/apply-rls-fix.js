const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function applyRLSFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  // Create admin client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔧 Fixing RLS policy for order_items table...\n')

  const sqlQuery = `
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create new INSERT policy for order_items
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );
  `

  try {
    // Try to execute using SQL query
    const { data, error } = await supabase.rpc('exec', { sql: sqlQuery })

    if (error) {
      console.log('⚠️  Cannot execute SQL via SDK. You need to run this manually.\n')
      console.log('📝 Copy and run this SQL in your Supabase SQL Editor:')
      console.log('   Dashboard: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new')
      console.log('─'.repeat(70))
      console.log(sqlQuery)
      console.log('─'.repeat(70))
      console.log('\n✅ After running the SQL, try placing your order again!')
      return
    }

    console.log('✅ Successfully applied RLS policy fix!')
    console.log('   You can now place orders without errors.\n')

  } catch (err) {
    console.log('\n⚠️  Automatic fix failed. Manual SQL execution required.\n')
    console.log('📝 Go to Supabase SQL Editor and run this SQL:')
    console.log('   Dashboard: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new')
    console.log('─'.repeat(70))
    console.log(sqlQuery)
    console.log('─'.repeat(70))
    console.log('\n✅ After running the SQL, try placing your order again!')
  }
}

applyRLSFix()
