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

async function createPromoCodesTable() {
  console.log('Creating promo_codes table and seeding data...\n')

  try {
    // Check if table exists by trying to query it
    const { error: checkError } = await supabase
      .from('promo_codes')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('⚠️  Table already exists. Skipping creation.')
      console.log('Checking for existing promo codes...\n')

      const { data: existingCodes } = await supabase
        .from('promo_codes')
        .select('code')

      if (existingCodes && existingCodes.length > 0) {
        console.log(`Found ${existingCodes.length} existing promo codes:`)
        existingCodes.forEach((code: any) => console.log(`  - ${code.code}`))
        console.log('\n✅ Promo codes system is ready!')
      } else {
        console.log('No promo codes found. You can add them via /admin/promo-codes')
      }
      return
    }

    console.log('⚠️  ERROR: promo_codes table does not exist!')
    console.log('\nPlease run this SQL in Supabase Dashboard → SQL Editor:\n')
    console.log('=' .repeat(70))
    console.log(`
-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON promo_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit) VALUES
('WELCOME10', '10% off for new customers', 'percentage', 10, 5000, 2000, NULL),
('SAVE500', '₦500 off your order', 'fixed', 500, 3000, NULL, 100),
('FREESHIP', 'Free delivery', 'fixed', 1500, 8000, NULL, NULL),
('VIP20', '20% off for VIP customers', 'percentage', 20, 10000, 5000, 50);
`)
    console.log('=' .repeat(70))
    console.log('\nAfter running the SQL, the promo codes system will be ready to use!')

  } catch (error: any) {
    console.error('Unexpected error:', error.message)
  }
}

createPromoCodesTable()
