-- =====================================================
-- FIX: Add missing payment tracking fields to orders table
-- =====================================================
-- Adds payment_reference and paid_at fields for Paystack integration
-- =====================================================

-- Add payment_reference field (stores Paystack transaction reference)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add paid_at field (stores timestamp when payment was confirmed)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('payment_reference', 'paid_at')
ORDER BY column_name;

-- Expected output: Two rows showing payment_reference and paid_at columns
