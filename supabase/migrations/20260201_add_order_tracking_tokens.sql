-- Add tracking tokens to orders for secure, easy order tracking
-- Migration: 20260201_add_order_tracking_tokens.sql

-- Add tracking_token column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_token TEXT;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token
ON orders(tracking_token)
WHERE tracking_token IS NOT NULL;

-- Generate tracking tokens for existing orders
UPDATE orders
SET tracking_token = encode(gen_random_bytes(32), 'hex')
WHERE tracking_token IS NULL;

-- Make tracking_token NOT NULL for future orders
ALTER TABLE orders
ALTER COLUMN tracking_token SET NOT NULL;

-- Set default value to auto-generate tokens
ALTER TABLE orders
ALTER COLUMN tracking_token SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- Add comment for documentation
COMMENT ON COLUMN orders.tracking_token IS 'Unique secure token for guest order tracking without authentication. Sent in confirmation email.';

-- Create function to generate tracking URL
CREATE OR REPLACE FUNCTION get_order_tracking_url(order_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_app_url TEXT;
BEGIN
  -- Get tracking token
  SELECT tracking_token INTO v_token
  FROM orders
  WHERE id = order_id;

  -- Get app URL from settings or use default
  v_app_url := COALESCE(
    current_setting('app.base_url', true),
    'https://www.wingside.ng'
  );

  -- Return full tracking URL
  RETURN v_app_url || '/track/' || v_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_order_tracking_url IS 'Generate tracking URL for an order';
