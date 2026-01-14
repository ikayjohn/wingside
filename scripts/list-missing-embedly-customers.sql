-- List all customers missing Embedly accounts (after wallettest812372@wingside.ng)
SELECT
  email,
  full_name,
  phone,
  created_at
FROM profiles
WHERE embedly_customer_id IS NULL
ORDER BY created_at DESC;
