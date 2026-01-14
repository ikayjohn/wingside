-- Find customers after wallettest812372@wingside.ng who don't have embedly_customer_id
SELECT
  id,
  email,
  full_name,
  embedly_customer_id,
  embedly_wallet_id,
  wallet_balance,
  created_at,
  updated_at
FROM profiles
WHERE email > 'wallettest812372@wingside.ng'
ORDER BY created_at DESC
LIMIT 20;

-- Check count of customers with/without embedly
SELECT
  COUNT(*) as total_customers,
  COUNT(embedly_customer_id) as with_embedly,
  COUNT(*) - COUNT(embedly_customer_id) as without_embedly
FROM profiles
WHERE created_at >= (
  SELECT created_at FROM profiles WHERE email = 'wallettest812372@wingside.ng'
);
