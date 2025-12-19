-- =====================================================
-- FIX: Update RLS INSERT policy for orders table
-- =====================================================
-- This fixes guest checkout by properly allowing NULL user_id
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Create new INSERT policy that properly handles guest orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated and creating their own order
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Allow if this is a guest order (user_id is NULL)
    (user_id IS NULL)
  );

-- Verify the policy was created successfully
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN cmd = 'INSERT' THEN '✅ INSERT policy updated'
    ELSE cmd
  END as status
FROM pg_policies
WHERE tablename = 'orders'
  AND policyname = 'Users can create orders';

-- Expected output: One row showing the INSERT policy was updated
