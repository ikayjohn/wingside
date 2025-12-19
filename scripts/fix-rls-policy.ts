import { createClient } from '@supabase/supabase-js'

async function fixRLSPolicy() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Create admin client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔧 Fixing RLS policy for order_items table...\n')

  try {
    // Add INSERT policy for order_items
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
    })

    if (error) {
      // If exec_sql RPC doesn't exist, try direct SQL
      console.log('⚠️  exec_sql RPC not found, trying direct SQL query...\n')

      const { error: dropError } = await supabase
        .from('order_items')
        .select('id')
        .limit(0)

      if (dropError) {
        console.error('❌ Error:', dropError.message)
        throw dropError
      }

      // Use the SQL editor approach
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

      console.log('📝 SQL to execute in Supabase SQL Editor:')
      console.log('─'.repeat(60))
      console.log(sqlQuery)
      console.log('─'.repeat(60))
      console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor')
      console.log('   Dashboard → SQL Editor → New Query → Paste & Run\n')

      return
    }

    console.log('✅ Successfully added INSERT policy for order_items!')
    console.log('   Policy: "Users can create order items"')
    console.log('   Allows: Authenticated users & guests to create order items\n')

  } catch (err: any) {
    console.error('❌ Error fixing RLS policy:', err.message)
    console.log('\n📝 Manual fix required - Run this SQL in Supabase SQL Editor:')
    console.log('─'.repeat(60))
    console.log(`
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
    `)
    console.log('─'.repeat(60))
    process.exit(1)
  }
}

fixRLSPolicy()
