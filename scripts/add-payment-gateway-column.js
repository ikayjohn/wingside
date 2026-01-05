// This script adds the payment_gateway column to the orders table
// Run with: node scripts/add-payment-gateway-column.js

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addPaymentGatewayColumn() {
  console.log('🔄 Adding payment_gateway column to orders table...')

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .rpc('get_columns', { table_name: 'orders' })
      .select('column_name')
      .eq('column_name', 'payment_gateway')

    if (!checkError && columns && columns.length > 0) {
      console.log('✅ Column payment_gateway already exists')
      return
    }

    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

        CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

        COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, or split';

        UPDATE orders
        SET payment_gateway = 'paystack'
        WHERE payment_gateway IS NULL OR payment_gateway = '';
      `
    })

    if (error) {
      console.error('❌ Error adding column:', error)
      throw error
    }

    console.log('✅ Successfully added payment_gateway column')
    console.log('✅ Created index on payment_gateway')
    console.log('✅ Updated existing orders to use paystack as default')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n💡 Alternative: Run this SQL in your Supabase SQL Editor:')
    console.log(`
-- Add payment_gateway field to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, or split';

-- Update existing orders to have paystack as default
UPDATE orders
SET payment_gateway = 'paystack'
WHERE payment_gateway IS NULL OR payment_gateway = '';
    `)
    process.exit(1)
  }
}

addPaymentGatewayColumn()
  .then(() => {
    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
