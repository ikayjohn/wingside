-- Add payment tracking fields to orders table

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Add comments
COMMENT ON COLUMN orders.payment_reference IS 'Payment gateway reference/transaction ID (e.g., Paystack reference, Nomba transaction ID, wallet transaction reference)';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was confirmed';
