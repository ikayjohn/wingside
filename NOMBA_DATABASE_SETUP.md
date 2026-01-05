# Quick Setup: Add payment_gateway Column

Since Supabase CLI isn't linked, run this SQL manually in your Supabase dashboard:

## Step 1: Go to Supabase SQL Editor

1. Visit: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
2. Paste the SQL below
3. Click "Run" ▶️

## SQL to Run:

```sql
-- Add payment_gateway field to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, or split';

-- Update existing orders to have paystack as default
UPDATE orders
SET payment_gateway = 'paystack'
WHERE payment_gateway IS NULL OR payment_gateway = '';
```

## Step 2: Verify the Column

Run this query to confirm:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name = 'payment_gateway';
```

Expected result:
- column_name: `payment_gateway`
- data_type: `text`
- column_default: `'paystack'::text`

## Step 3: Test the Integration

Once the column is added, test Nomba:

1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Add items to cart
4. Proceed to checkout
5. Select "Pay with Nomba"
6. Click "Place Order"
7. Should redirect to Nomba checkout ✅

## What This Does:

- **Adds `payment_gateway` column** to track which gateway was used
- **Defaults to `'paystack'`** for existing orders
- **Creates an index** for faster queries
- **Allows tracking** payments from Paystack, Nomba, Wallet, or Split

## Troubleshooting:

**Error: "column payment_gateway already exists"**
- ✅ Good! Column is already added, skip this step.

**Error: "permission denied"**
- Make sure you're using the Service Role key or have admin privileges

---

**Next:** After running this SQL, your Nomba integration is ready to test! 🚀
