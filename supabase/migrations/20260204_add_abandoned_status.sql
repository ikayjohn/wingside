-- Migration: Add abandoned status and auto-expire pending orders
-- This migration fixes the Nomba callback issue where orders stay pending indefinitely

-- Step 1: Add 'abandoned' to payment_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'abandoned'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status_enum')
    ) THEN
        ALTER TYPE payment_status_enum ADD VALUE 'abandoned';
    END IF;
END $$;

-- Step 2: Create function to expire pending orders
CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled',
      payment_status = 'abandoned',
      updated_at = now()
  WHERE payment_status = 'pending'
    AND status = 'pending'
    AND created_at < now() - interval '30 minutes'
    AND payment_gateway IN ('nomba', 'paystack');

  RAISE NOTICE 'Expired % pending orders', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Fix existing stuck order WS202602040093
UPDATE orders
SET status = 'cancelled',
    payment_status = 'abandoned',
    updated_at = now()
WHERE order_number = 'WS202602040093'
  AND payment_status = 'pending';

-- Step 4: (Optional) Create a cron job to run this function every 15 minutes
-- Uncomment if your hosting platform supports pg_cron or similar
/*
SELECT cron.schedule(
  'expire-pending-orders',
  '*/15 * * * *', -- Every 15 minutes
  'SELECT expire_pending_orders();'
);
*/

-- Verification query
SELECT
  order_number,
  payment_status,
  status,
  payment_gateway,
  created_at,
  updated_at,
  CASE
    WHEN created_at < now() - interval '30 minutes' AND payment_status = 'pending'
    THEN 'SHOULD EXPIRE'
    ELSE 'OK'
  END as action_needed
FROM orders
WHERE payment_status = 'pending'
  AND status = 'pending'
ORDER BY created_at DESC;
