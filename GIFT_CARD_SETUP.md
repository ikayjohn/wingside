# Gift Card System - Quick Setup Guide

## ⚠️ Error Fixed
The migration has been updated to **create the tables from scratch** instead of assuming they exist.

## 🚀 Step-by-Step Setup

### 1. Run the Database Migration

Choose one of these methods:

#### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260210_enhance_gift_cards.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

#### Option B: Command Line (psql)
```bash
# Replace with your actual database URL from Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20260210_enhance_gift_cards.sql
```

#### Option C: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### 2. Verify Tables Were Created

Run this SQL query in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('gift_cards', 'gift_card_transactions');

-- Should return 2 rows:
-- gift_cards
-- gift_card_transactions
```

### 3. Test Code Generation Function

```sql
-- Generate a test gift card code
SELECT generate_gift_card_code();

-- Should return something like: A7B2C9D4E1F3
-- (12 characters, no I, O, 1, or 0)
```

### 4. Test Table Structure

```sql
-- View gift_cards table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gift_cards'
ORDER BY ordinal_position;

-- Should show columns like: id, code, design_image, denomination, etc.
```

### 5. Set Environment Variables

Add to your `.env.local` (development) or Vercel (production):

```bash
# Generate a random secret for cron job
# Run this in terminal to generate:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

CRON_SECRET=your-generated-secret-here
```

### 6. Verify Card Design Images

Make sure these files exist in your `/public` folder:

**Valentine's Category (4 designs):**
- `public/val-01.png`
- `public/val-02.png`
- `public/val-03.png`
- `public/val-04.png`

**Love Category (6 designs):**
- `public/gift-love1.png`
- `public/gift-love2.png`
- `public/gift-love3.png`
- `public/gift-love4.png`
- `public/gift-love5.png`
- `public/gift-love6.png`

If any don't exist, you'll need to add them.

### 7. Deploy the Code

```bash
# Commit and push to deploy
git add .
git commit -m "Add gift card system with database tables"
git push origin main

# Or if deploying locally for testing
npm run build
npm start
```

### 8. Test the Full Flow

#### Test 1: Generate a Gift Card Code
```sql
INSERT INTO gift_cards (
  code,
  denomination,
  initial_balance,
  current_balance,
  recipient_name,
  recipient_email,
  expires_at,
  design_image,
  is_active
) VALUES (
  generate_gift_card_code(),
  20000,
  20000,
  20000,
  'Test User',
  'test@example.com',
  NOW() + INTERVAL '6 months',
  'val-01.png',
  true
);

-- Get the code that was created
SELECT code, current_balance, expires_at FROM gift_cards ORDER BY created_at DESC LIMIT 1;
```

#### Test 2: Validate the Code
```bash
# Replace YOUR_CODE with the code from above
curl -X POST http://localhost:3000/api/gift-cards/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_CODE"}'

# Should return: {"valid": true, "gift_card": {...}}
```

#### Test 3: Purchase Flow (Browser)
1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/gifts
3. Click on a Valentine's card
4. Login if needed
5. Fill in recipient details
6. Select ₦20,000
7. Click "Proceed to Payment"
8. Use Paystack test card: **4084084084084081**, CVV: **408**
9. Complete payment
10. Check database for activated card:
```sql
SELECT code, is_active, email_sent_at FROM gift_cards WHERE is_active = true;
```

## 🔍 Troubleshooting

### Error: "relation 'auth.users' does not exist"
This means your Supabase project doesn't have auth set up. Fix:
```sql
-- The migration will still work, but you need to remove user references
-- This shouldn't happen in a normal Supabase project
```

### Error: "relation 'orders' does not exist"
You need to create the orders table first, or temporarily comment out lines 22-24 in the migration:
```sql
-- ALTER TABLE orders
-- ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id),
-- ADD COLUMN IF NOT EXISTS gift_card_amount DECIMAL(10, 2) DEFAULT 0;
```

### Error: "permission denied for table gift_cards"
You're not using the service role key. Make sure your API routes use:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const admin = createAdminClient()
```

### Email Not Sending
1. Check `RESEND_API_KEY` is set in environment variables
2. Verify Resend account is active
3. Check `failed_notifications` table for errors:
```sql
SELECT * FROM failed_notifications WHERE type = 'gift_card_email';
```

### Code Generation Fails
Test the function manually:
```sql
SELECT generate_gift_card_code();
-- Should return 12-character code each time you run it
```

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Tables created without errors
2. ✅ `generate_gift_card_code()` returns unique 12-digit codes
3. ✅ Can insert a test gift card
4. ✅ Validation API returns valid response
5. ✅ Purchase flow redirects to Paystack
6. ✅ Webhook activates card and sends email
7. ✅ Redemption reduces balance
8. ✅ Admin dashboard shows statistics

## 📊 Quick Database Check

Run this to see your gift card system status:

```sql
SELECT
  COUNT(*) as total_cards,
  COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active_cards,
  SUM(current_balance) as total_balance,
  SUM(initial_balance - current_balance) as total_redeemed
FROM gift_cards;
```

## 🆘 Need Help?

If you encounter any issues:

1. Check the full error message
2. Verify all tables exist: `\dt` in psql or check Supabase table editor
3. Check RLS policies aren't blocking: `\dp gift_cards` in psql
4. Review the complete migration file for any commented sections
5. Check application logs for API errors

## 📝 Next Steps

After successful setup:

1. ✅ Complete checkout integration (see `GIFT_CARD_IMPLEMENTATION.md`)
2. ✅ Set up cron job for expiration
3. ✅ Add card design images to `/public`
4. ✅ Test with Paystack test cards
5. ✅ Switch to live mode after testing

Your gift card system is now ready! 🎉
