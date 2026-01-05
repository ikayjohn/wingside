-- Add payment_gateway field to orders table
-- This tracks which payment gateway was used for the order (paystack, nomba, wallet, etc.)

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, or split';

-- Update existing orders to have paystack as default (most were created with paystack)
UPDATE orders
SET payment_gateway = 'paystack'
WHERE payment_gateway IS NULL OR payment_gateway = '';
