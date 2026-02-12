-- =============================================
-- Add Staff Roles Migration
-- =============================================
-- This script updates the role field to support the new staff role system
-- Run this in Supabase SQL Editor

-- Step 1: Update existing 'admin' users to 'super_admin' for consistency
UPDATE profiles
SET role = 'super_admin'
WHERE role = 'admin';

-- Update the role column to support new values
-- Note: Old 'admin' role still works for backward compatibility
COMMENT ON COLUMN profiles.role IS 'User role: customer, admin (legacy), super_admin, csr, kitchen_staff, shift_manager, delivery, sales_marketing';

-- Step 2: Assign roles to specific email addresses
-- Super Admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE email = 'admin@wingside.ng';

UPDATE profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@wingside.ng'
);

-- CSR (Customer Service Representative)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"csr"'
)
WHERE email = 'csr@wingside.ng';

UPDATE profiles
SET role = 'csr'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'csr@wingside.ng'
);

-- Kitchen Staff
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"kitchen_staff"'
)
WHERE email = 'kitchen@wingside.ng';

UPDATE profiles
SET role = 'kitchen_staff'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'kitchen@wingside.ng'
);

-- Shift Manager
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"shift_manager"'
)
WHERE email = 'shiftmgr@wingside.ng';

UPDATE profiles
SET role = 'shift_manager'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'shiftmgr@wingside.ng'
);

-- Delivery
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"delivery"'
)
WHERE email = 'deliveries@wingside.ng';

UPDATE profiles
SET role = 'delivery'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'deliveries@wingside.ng'
);

-- Sales & Marketing
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"sales_marketing"'
)
WHERE email = 'sales@wingside.ng';

UPDATE profiles
SET role = 'sales_marketing'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'sales@wingside.ng'
);

-- Step 3: Verify the changes
SELECT
  u.email,
  p.role,
  p.full_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role IN ('super_admin', 'csr', 'kitchen_staff', 'shift_manager', 'delivery', 'sales_marketing')
ORDER BY p.role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Staff roles migration completed successfully!';
  RAISE NOTICE '📝 Roles assigned:';
  RAISE NOTICE '   - admin@wingside.ng → super_admin';
  RAISE NOTICE '   - csr@wingside.ng → csr';
  RAISE NOTICE '   - kitchen@wingside.ng → kitchen_staff';
  RAISE NOTICE '   - shiftmgr@wingside.ng → shift_manager';
  RAISE NOTICE '   - deliveries@wingside.ng → delivery';
  RAISE NOTICE '   - sales@wingside.ng → sales_marketing';
END $$;
