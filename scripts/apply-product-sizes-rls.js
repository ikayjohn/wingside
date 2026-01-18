const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicies() {
  console.log('Applying RLS policies for product_sizes table...')

  const policies = [
    {
      name: 'Admins can insert product sizes',
      query: `
        CREATE POLICY IF NOT EXISTS "Admins can insert product sizes"
        ON product_sizes
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );
      `
    },
    {
      name: 'Admins can update product sizes',
      query: `
        CREATE POLICY IF NOT EXISTS "Admins can update product sizes"
        ON product_sizes
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );
      `
    },
    {
      name: 'Admins can delete product sizes',
      query: `
        CREATE POLICY IF NOT EXISTS "Admins can delete product sizes"
        ON product_sizes
        FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );
      `
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`Applying policy: ${policy.name}`)
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: policy.query })

      if (error) {
        console.error(`Failed to apply policy "${policy.name}":`, error)
      } else {
        console.log(`✓ Applied policy: ${policy.name}`)
      }
    } catch (err) {
      console.error(`Error applying policy "${policy.name}":`, err)
    }
  }

  console.log('\nDone! Product price updates should now work.')
}

applyRLSPolicies()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err)
      process.exit(1)
    })
