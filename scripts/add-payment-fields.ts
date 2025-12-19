import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addPaymentFields() {
  console.log('Adding payment fields to orders table...\n')

  try {
    // Check if columns already exist by querying the table
    const { data: testOrder } = await supabase
      .from('orders')
      .select('payment_reference, paid_at')
      .limit(1)
      .single()

    // If the query succeeds, columns exist
    console.log('✅ Payment fields already exist in orders table!')
    console.log('\nThe following columns are available:')
    console.log('  - payment_reference (VARCHAR)')
    console.log('  - paid_at (TIMESTAMP WITH TIME ZONE)')

  } catch (error: any) {
    // If error mentions column doesn't exist, we need to add them
    if (error.message?.includes('column') || error.code === 'PGRST116') {
      console.log('⚠️  Payment fields do not exist yet.')
      console.log('\nPlease run this SQL in Supabase Dashboard → SQL Editor:\n')
      console.log('='.repeat(70))
      console.log(`
-- Add payment tracking fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Add comments
COMMENT ON COLUMN orders.payment_reference IS 'Paystack payment reference/transaction ID';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was confirmed';
`)
      console.log('='.repeat(70))
      console.log('\nAfter running the SQL, the payment system will be ready!')
    } else {
      console.error('Unexpected error:', error)
    }
  }
}

addPaymentFields()
