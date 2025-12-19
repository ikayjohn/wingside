-- =====================================================
-- FIX: Add missing RLS INSERT policy for order_items
-- =====================================================
-- This fixes the "Failed to create order items" error
-- by allowing users to insert order items when creating orders
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create new INSERT policy for order_items
-- Allows both authenticated users and guest users to create order items
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Verify the policy was created successfully
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN cmd = 'INSERT' THEN '✅ INSERT policy created'
    ELSE cmd
  END as status
FROM pg_policies
WHERE tablename = 'order_items'
  AND policyname = 'Users can create order items';

-- Expected output: One row showing the INSERT policy was created
