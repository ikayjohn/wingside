# Wallet System Setup Guide

The wallet system has been created to replace the mock data implementation. Follow these steps to set it up.

## What Was Created

### 1. Database Schema (`supabase/migrations/20250105_create_wallet_transactions.sql`)

- **wallet_transactions table** - Tracks all wallet credits and debits
- **Helper functions:**
  - `get_wallet_balance(user_id)` - Get current balance
  - `record_wallet_transaction()` - Record any transaction
  - `credit_wallet()` - Add money to wallet
  - `debit_wallet_for_order()` - Pay for order with wallet

### 2. API Endpoints

- `GET /api/user/wallet-balance` - Get current wallet balance
- `GET /api/user/wallet-history` - Get transaction history (updated to use real table)

### 3. Helper Library (`lib/wallet/helper.ts`)

TypeScript helper functions for wallet operations:
- `getWalletBalance(userId)`
- `creditWallet(userId, amount, type, description)`
- `debitWallet(userId, amount, type, description)`
- `creditReferralReward()`
- `creditPurchasePoints()`
- `creditFirstOrderBonus()`
- `payWithWallet()`

## Manual Setup Instructions

### Step 1: Apply the Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
2. Open the file: `supabase/migrations/20250105_create_wallet_transactions.sql`
3. Copy the entire SQL content
4. Paste it into the Supabase SQL editor
5. Click "Run" to execute

You should see success messages for:
- ✅ Creating wallet_transactions table
- ✅ Creating indexes
- ✅ Creating helper functions
- ✅ Setting up RLS policies

### Step 2: Verify the Setup

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM wallet_transactions LIMIT 1;

-- Test helper function
SELECT get_wallet_balance('00000000-0000-0000-0000-000000000000'::UUID);
```

### Step 3: Test the API

```bash
# Test wallet balance endpoint (requires authentication)
curl http://localhost:3000/api/user/wallet-balance

# Test wallet history endpoint (requires authentication)
curl http://localhost:3000/api/user/wallet-history
```

## Wallet Transaction Types

The system supports these transaction types:

### Credits (Money In)
- `refund` - Money refunded to wallet
- `funding` - Wallet funded by user
- `referral_reward` - Points from referral program
- `first_order_bonus` - First order bonus
- `purchase_points` - Points earned from purchase (₦100 = 1 point)
- `promo_credit` - Promo code credit
- `social_verification` - Social media verification reward
- `streak_bonus` - Daily streak bonus
- `affiliate_commission` - Affiliate earnings
- `cashback` - Cashback rewards

### Debits (Money Out)
- `order_payment` - Order paid from wallet

## Usage Examples

### Credit Wallet (Backend/API Routes Only)

```typescript
import { creditWallet } from '@/lib/wallet/helper';

// Credit referral reward
await creditWallet(
  userId,
  500, // ₦500
  'referral_reward',
  'Referral bonus for inviting a friend',
  { referral_reward_id: rewardId }
);

// Credit purchase points (₦1000 = 10 points)
await creditWallet(
  userId,
  10,
  'purchase_points',
  'Points earned from order #WS12345',
  { metadata: { amount_spent: 1000, order_id: orderId } }
);

// Credit first order bonus
await creditWallet(
  userId,
  15,
  'first_order_bonus',
  'Welcome bonus for your first order!'
);
```

### Debit Wallet for Payment

```typescript
import { debitWallet } from '@/lib/wallet/helper';

// Pay for order with wallet
const result = await debitWallet(
  userId,
  2500, // ₦2500
  'order_payment',
  'Order Payment - WS12345',
  { order_id: orderId }
);

if (result.success) {
  console.log('Payment successful!');
  console.log('New balance:', result.newBalance);
} else {
  console.error('Payment failed:', result.error);
  // Error: Insufficient wallet balance
}
```

### Get Wallet Balance

```typescript
import { getWalletBalance } from '@/lib/wallet/helper';

const balance = await getWalletBalance(userId);
console.log(`Current balance: ₦${balance}`);
```

## Integration Points

### 1. Referral System

When processing referral rewards, credit the wallet:

```typescript
// In referral reward processing
await creditWallet(
  userId,
  rewardAmount,
  'referral_reward',
  `Referral bonus - ${referrerName}`,
  { referral_reward_id: rewardId }
);
```

### 2. Order Completion

Award purchase points and first order bonus:

```typescript
// Award purchase points (₦100 = 1 point)
const pointsEarned = Math.floor(orderTotal / 100);
await creditWallet(
  userId,
  pointsEarned,
  'purchase_points',
  `Points earned from order #${orderNumber}`,
  { metadata: { order_id: orderId, amount_spent: orderTotal } }
);

// First order bonus
if (isFirstOrder) {
  await creditWallet(
    userId,
    15,
    'first_order_bonus',
    'Welcome bonus for your first order!',
    { metadata: { order_id: orderId } }
  );
}
```

### 3. Wallet Payment Option

Allow customers to pay with wallet balance:

```typescript
// In order checkout
if (paymentMethod === 'wallet') {
  const result = await debitWallet(
    userId,
    orderTotal,
    'order_payment',
    `Order Payment - ${orderNumber}`,
    { order_id: orderId }
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Mark order as paid
  await updateOrderPaymentStatus(orderId, 'paid');
}
```

## Database Schema

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  order_id UUID REFERENCES orders(id),
  referral_reward_id UUID REFERENCES referral_rewards(id),
  reward_claim_id UUID REFERENCES reward_claims(id),
  promo_code_id UUID REFERENCES promo_codes(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- Row Level Security (RLS) enabled
- Users can only see their own transactions
- Service role can insert transactions
- All wallet operations require authentication

## Next Steps

1. ✅ Run the migration in Supabase SQL editor
2. ✅ Test the API endpoints
3. ✅ Integrate with referral system (credit rewards to wallet)
4. ✅ Add wallet payment option to checkout
5. ✅ Display wallet balance in user dashboard
6. ✅ Show transaction history in wallet page

## Troubleshooting

### Table doesn't exist

If you get error `42P01`, the migration wasn't applied:
1. Go to Supabase SQL editor
2. Run the migration file content
3. Verify table exists

### Permission denied

Make sure RLS policies are applied:
```sql
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
```

### Helper functions not working

Verify functions exist:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%wallet%';
```

## Benefits Over Mock Data

- ✅ Real transaction tracking
- ✅ Accurate balance calculation
- ✅ Full audit trail
- ✅ Transaction references to orders, referrals, etc.
- ✅ Support for different transaction types
- ✅ Metadata for extensibility
- ✅ Running balance history
