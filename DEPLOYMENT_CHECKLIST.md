# Wingside Deployment Checklist

## 🔴 CRITICAL - Must Complete Before Going Live

### 1. Database Migrations (Run in Supabase SQL Editor)

Open: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new

#### Step 1: Create Points System Functions
- File: `supabase/migrations/20250119_create_points_functions.sql`
- Creates: `award_points()`, `claim_reward()` functions
- Creates: `points_history`, `reward_claims` tables
- **Status**: ⚠️ PENDING - Copy SQL to Supabase dashboard and run

#### Step 2: Retroactively Award Points for Old Orders
- File: `scripts/retroactive-points-migration.sql`
- Awards points for all previously paid orders
- Fixes missing points for existing users
- **Status**: ⚠️ PENDING - Run after Step 1 completes

#### Step 3: Verify Migrations
Run this query to verify:
```sql
-- Check functions exist
SELECT proname FROM pg_proc WHERE proname IN ('award_points', 'claim_reward', 'generate_order_number', 'get_maintenance_settings');

-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('points_history', 'reward_claims', 'profiles', 'orders');

-- Check users have points now
SELECT email, total_points FROM profiles WHERE total_points > 0 ORDER BY total_points DESC LIMIT 10;
```

### 2. Verify RPC Functions

Test these functions in SQL Editor:
```sql
-- Test award_points
SELECT award_points(
    (SELECT id FROM profiles LIMIT 1),
    'test',
    100,
    1000,
    'Test award'
);

-- Verify points were awarded
SELECT email, total_points FROM profiles WHERE id = (SELECT id FROM profiles LIMIT 1);
```

### 3. Verify Points Calculation Logic

Current point calculation (consistent across system):
- **₦100 spent = 10 points** (₦10 = 1 point)
- First order bonus: **15 points**
- Referral bonus: **200 points** (referrer + referred)

Examples:
- ₦1,000 order = 100 points
- ₦500 order = 50 points
- ₦268.75 order = 26 points

This calculation is consistent across:
- Webhooks: `Math.floor(total / 10)`
- Dashboard: `Math.floor(total / 10)` for points this month

### 4. Points Calculation Verification

All payment sources use the same calculation:
- Nomba webhook: ✅ `/ 10`
- Payment webhook: ✅ `/ 10`
- Embedly wallet: ✅ `/ 10`
- Dashboard display: ✅ `/ 10`

---

## ✅ System Verification Tests

### Test 1: Order Flow
1. Create test order
2. Complete payment via Nomba
3. Check webhook processes successfully
4. Verify order status = "confirmed"
5. Verify user gets points awarded
6. Check points_history table has entry

### Test 2: Referral System
1. User A refers User B
2. User B signs up with referral code
3. User B places first order (>₦500 minimum)
4. Check both users get 200 points each
5. Verify referral_rewards table has entries
6. Check referral status updates to "first_order_completed"

### Test 3: First Order Bonus
1. New user places first order
2. Verify they get 15 points bonus
3. Check reward_claims table prevents duplicate claims

### Test 4: Dashboard Display
1. Login as user with points
2. Verify "Total Points" displays correctly
3. Verify "Tier Progression" calculates correctly
4. Check "Points this Month" matches orders this month
5. Verify "Convertible Points" = 50% of total_points

### Test 5: Wallet Balance
1. Check wallet_balance updates from referrals
2. Verify wallet can fund orders
3. Check wallet_transactions table logs activity

---

## 🔧 Configuration Checklist

### Environment Variables (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=✓ Set
SUPABASE_SERVICE_ROLE_KEY=✓ Set

# Nomba Payment
NOMBA_ACCOUNT_NUMBER=✓ Set
NOMBA_API_KEY=✓ Set
NOMBA_API_SECRET=✓ Set
NOMBA_MERCHANT_ID=✓ Set
NOMBA_WEBHOOK_SECRET=✓ Set (recommended for production)

# Email (Resend)
RESEND_API_KEY=✓ Set

# Embedly (optional)
EMBEDLY_API_KEY=⚠️ Optional
```

### Supabase RLS Policies
- [ ] profiles: Users can read own profile
- [ ] profiles: Service role can manage all
- [ ] orders: Users can read own orders
- [ ] orders: Service role can manage all
- [ ] points_history: Users can read own history
- [ ] reward_claims: Users can read own claims
- [ ] referrals: Proper access controls

---

## 📊 Current System Status (from audit)

### ✅ Working
- All required tables exist
- Profiles table structure correct
- Orders table tracking correctly
- Referral system configured
- Notification system working
- Wallet transactions table exists

### ⚠️ Needs Attention
- **RPC functions not created** (migration pending)
- **Old orders missing points** (retroactive migration pending)

### 🚨 Critical Issues Found
1. Users with paid orders have 0 points (needs retroactive migration):
   - demo.customer@wingside.ng: Should have ~40 points (₦4,031 spent)
   - billionaireboyscorp@gmail.com: Should have ~40 points (₦4,031 spent)

2. Missing RPC functions (needs migration):
   - `award_points()`
   - `claim_reward()`

---

## 📝 Migration Steps Summary

1. **Apply points_functions.sql** - Creates tables and functions
2. **Apply retroactive-points-migration.sql** - Awards points for old orders
3. **Fix points calculation inconsistency** - Update webhook files
4. **Run audit script** - Verify everything works
5. **Test order flow** - Place test order and verify points
6. **Test referral flow** - Verify referral bonuses work

---

## 🚀 After Migration

Run this to verify:
```bash
node scripts/comprehensive-audit.js
```

Expected output:
- ✅ All RPC functions exist
- ✅ All tables accessible
- ✅ Users have correct points based on orders
- ✅ No critical issues

---

## 📞 Support

If issues persist:
1. Check Supabase logs: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/logs
2. Check webhook delivery in Nomba dashboard
3. Run `node scripts/comprehensive-audit.js` for diagnostics
4. Review specific API logs in production

---

## 📋 Files Modified in This Session

1. `app/my-account/dashboard/page.tsx` - Removed green dot from avatar
2. `supabase/migrations/20250119_create_points_functions.sql` - Points system migration
3. `scripts/comprehensive-audit.js` - System audit script
4. `scripts/retroactive-points-migration.sql` - Retroactive points migration
5. `scripts/test-points.js` - Points testing script
6. `scripts/test-orders-points.js` - Orders vs points testing
7. `DEPLOYMENT_CHECKLIST.md` - This checklist
