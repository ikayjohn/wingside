-- Migration: Restrict profile self-update to safe fields only
-- Date: 2026-02-27
-- Issue: Profile UPDATE RLS policy had no WITH CHECK clause, allowing users
--        to modify role, total_points, wallet_balance etc via direct Supabase calls

-- Drop existing policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with WITH CHECK clause that prevents modification of sensitive fields
-- Users can only update their own row, and cannot change: role, total_points,
-- referral_code, is_verified, or any admin-managed field
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND COALESCE(total_points, 0) = (SELECT COALESCE(total_points, 0) FROM profiles WHERE id = auth.uid())
  );
