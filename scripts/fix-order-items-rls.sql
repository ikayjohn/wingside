-- Fix RLS policy for order_items table
-- This allows users to create order items when placing orders

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create new INSERT policy for order_items
-- Allows authenticated users and guests to insert order items for their orders
CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items';
