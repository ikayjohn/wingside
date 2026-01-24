# Referral Wallet Credit Verification Fix

## Problem Solved

Referral rewards were being marked as "credited" even when wallet transactions failed, causing users to see rewards in the system but have no money in their wallets.

## Solution

### 1. Database Function Rewrite
**File**: `supabase/migrations/202601241_fix_referral_wallet_verification.sql`

- Verifies wallet_transactions actually created before marking as "credited"
- Three-status system: `credited`, `pending`, `failed`
- Returns detailed status for both referrer and referred user
- Only updates total_referral_earnings if wallet credit succeeded

### 2. Retry Function
Created `retry_pending_referral_rewards()` to:
- Find all `pending` or `failed` rewards
- Retry wallet credit
- Update to `credited` only if successful

### 3. API Updates
Updated to handle detailed response:
- `app/api/orders/route.ts`
- `app/api/payment/nomba/webhook/route.ts`

Both now:
- Check referrer_credited and referred_credited separately
- Create admin notifications for partial failures
- Log detailed status

### 4. Admin Notifications
New notification type: `referral_reward_partial_failure`
Includes which user failed and error details

## How It Works

### Successful Case
Both wallets exist → Both credited → Both rewards status='credited' ✓

### Partial Failure
Referrer wallet missing → Skip credit → Referrer reward status='pending'
Referred wallet exists → Credit succeeds → Referred reward status='credited' ✓
Admin notification created

### Complete Failure
Error during credit → Both status='failed'
Admin notification created with error details

## Retrying Failed Rewards

### Manual (Supabase SQL Editor)
```sql
SELECT * FROM retry_pending_referral_rewards();
```

### Automated (Daily Cron)
```bash
# Run retry function daily via Supabase REST API
# Returns success/failure for each retried reward
```

## Before vs After

### Before
- ❌ Rewards marked "credited" regardless of wallet success
- ❌ No visibility into failures
- ❌ No way to retry

### After
- ✅ Only "credited" if wallet_transaction exists
- ✅ Pending/failed statuses for tracking
- ✅ Retry function for recovery
- ✅ Admin notifications
- ✅ Detailed error messages

## Deployment

1. Run migration in Supabase SQL Editor
2. Deploy updated API code
3. Test with new referral
4. (Optional) Setup retry cron job

---

**Status**: ✅ Ready for deployment
**Migration**: `202601241_fix_referral_wallet_verification.sql`
