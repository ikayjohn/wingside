-- Find customers after wallettest812372@wingside.ng who don't have embedly_customer_id
-- This will help identify the issue

SELECT
  id,
  email,
  full_name,
  embedly_customer_id,
  embedly_wallet_id,
  bank_account,
  created_at,
  updated_at
FROM profiles
WHERE email > 'wallettest812372@wingside.ng'  -- Customers created after this one
ORDER BY created_at DESC
LIMIT 20;

-- Count how many customers are missing embedly accounts
SELECT
  COUNT(*) as total_customers,
  COUNT(embedly_customer_id) as with_embedly,
  COUNT(*) - COUNT(embedly_customer_id) as without_embedly
FROM profiles
WHERE created_at >= (
  SELECT created_at FROM profiles WHERE email = 'wallettest812372@wingside.ng'
);
