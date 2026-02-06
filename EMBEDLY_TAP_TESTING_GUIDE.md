# Embedly TAP Cards - Testing Guide

**Quick reference for testing the corrected Embedly TAP card implementation**

---

## Pre-Testing Checklist

### 1. Environment Setup

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Add your Embedly API key (same key for wallet and TAP)
EMBEDLY_API_KEY=your_actual_embedly_api_key_here

# NODE_ENV will auto-select the base URL:
# - development → staging API
# - production → production API
```

### 2. Database Verification

```sql
-- Verify wingside_cards table exists
SELECT * FROM wingside_cards LIMIT 1;

-- Verify test user has Embedly wallet
SELECT
  id,
  email,
  embedly_customer_id,
  embedly_wallet_id
FROM profiles
WHERE email = 'test@example.com';
```

---

## Test Scenarios

### Test 1: Card Onboarding (Link Physical Card)

**Purpose:** Link a physical Wingside card to user's wallet

**Prerequisites:**
- User must be logged in
- User must have Embedly customer ID and wallet ID
- User must NOT have an active card already (ONE per customer)
- Card serial must be unique (not linked to another account)

**Test Data:**
```json
{
  "card_serial": "WS123456",
  "card_pin": "1234"
}
```

**API Call:**
```bash
# Login first to get auth cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Then onboard card
curl -X POST http://localhost:3000/api/wingside-card/onboard \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "card_serial": "WS123456",
    "card_pin": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "card": {
    "id": "uuid",
    "card_serial": "WS123456",
    "status": "active",
    "card_type": "standard",
    "max_debit": 50000,
    "linked_at": "2026-02-06T..."
  }
}
```

**UI Test:**
1. Go to `/my-account/cards`
2. Click "Link Your Card"
3. Enter card serial: WS123456
4. Enter PIN: 1234
5. Click "Link Card"
6. Should see success message and card details

**Validation:**
```sql
-- Verify card was created
SELECT * FROM wingside_cards WHERE card_serial = 'WS123456';

-- Check PIN hash exists
SELECT card_pin_hash FROM wingside_cards WHERE card_serial = 'WS123456';
-- Should be a SHA-256 hash (64 hex characters)
```

---

### Test 2: Get Card Balance

**Purpose:** Retrieve current card/wallet balance

**Prerequisites:**
- User must have an active card

**API Call:**
```bash
curl -X GET http://localhost:3000/api/wingside-card/balance \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "card_serial": "WS123456",
  "balance": 10000,
  "currency": "NGN",
  "source": "embedly",
  "last_updated": "2026-02-06T...",
  "customer_info": {
    "fullname": "Test User",
    "phone": "2348012345678",
    "valid": true
  },
  "card_info": {
    "status": "active",
    "max_debit": 50000,
    "last_used_at": null,
    "total_transactions": 0,
    "total_spent": 0
  }
}
```

**UI Test:**
1. Go to `/my-account/cards`
2. Should see balance displayed on card UI
3. Balance should match wallet balance

**Debug:**
```typescript
// Check what Embedly returns
import { getCardBalance } from '@/lib/embedly/tap-client';

const result = await getCardBalance('WS123456');
console.log(result);
```

---

### Test 3: Card Transaction History

**Purpose:** View card transaction history

**Prerequisites:**
- User must have an active card
- Card should have some transactions (or test with empty history)

**API Call:**
```bash
# Default: Last 30 days
curl -X GET http://localhost:3000/api/wingside-card/history \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Custom date range
curl -X GET "http://localhost:3000/api/wingside-card/history?fromDate=2026-01-01&toDate=2026-02-06" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "card_serial": "WS123456",
  "transactions": [
    {
      "transactionId": "tx123",
      "cardSerial": "WS123456",
      "amount": 5000,
      "type": "DEBIT",
      "description": "Purchase at Wingside Store",
      "merchantName": "Wingside",
      "timestamp": "2026-02-05T14:30:00Z",
      "balanceAfter": 5000,
      "reference": "ref123"
    }
  ],
  "total_count": 1,
  "from_date": "2026-01-07",
  "to_date": "2026-02-06",
  "source": "embedly"
}
```

**UI Test:**
1. Go to `/my-account/cards`
2. Click "History" button
3. Should see list of transactions (or empty state if none)

---

### Test 4: Top Up Card

**Purpose:** Add funds to card/wallet

**Prerequisites:**
- User must have an active card
- User must have phone_number in profile

**Test Data:**
```json
{
  "amount": 5000
}
```

**API Call:**
```bash
curl -X POST http://localhost:3000/api/wingside-card/top-up \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "amount": 5000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "card_serial": "WS123456",
  "amount": 5000,
  "reference": "CARD_TOPUP_1738851234567",
  "message": "Completed",
  "timestamp": "2026-02-06T..."
}
```

**Validation:**
```bash
# Check balance increased
curl -X GET http://localhost:3000/api/wingside-card/balance \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Verify transaction was recorded
curl -X GET http://localhost:3000/api/wingside-card/history \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

---

### Test 5: Search Customer by Card Serial

**Purpose:** Find customer details by card serial (admin/support use)

**Prerequisites:**
- Card must be onboarded

**Test Script:**
```typescript
import { searchCustomer } from '@/lib/embedly/tap-client';

async function testSearchCustomer() {
  const result = await searchCustomer('WS123456');

  if (result.success && result.data) {
    console.log('Customer ID:', result.data.customerId);
    console.log('Wallet ID:', result.data.walletId);
    console.log('Name:', result.data.fullname);
    console.log('Phone:', result.data.phone);
    console.log('Status:', result.data.status);
  } else {
    console.error('Search failed:', result.error);
  }
}

testSearchCustomer();
```

**Expected Output:**
```
Customer ID: embedly-customer-id-123
Wallet ID: embedly-wallet-id-456
Name: Test User
Phone: 2348012345678
Status: active
```

---

## Error Testing

### Test Error 1: Duplicate Card Onboarding

**Purpose:** Verify ONE card per user constraint

**Steps:**
1. Onboard a card successfully
2. Try to onboard another card with same user
3. Should fail with error

**Expected Error:**
```json
{
  "error": "You already have an active Wingside Card. Each customer can only have one card."
}
```

### Test Error 2: Card Serial Already Linked

**Purpose:** Verify card uniqueness

**Steps:**
1. Onboard card with User A
2. Try to onboard same card with User B
3. Should fail with error

**Expected Error:**
```json
{
  "error": "This card is already linked to another account"
}
```

### Test Error 3: Invalid Card Serial Format

**Purpose:** Verify format validation

**Test Data:**
```json
{
  "card_serial": "INVALID123",  // Wrong format
  "card_pin": "1234"
}
```

**Expected Error:**
```json
{
  "error": "Invalid card serial format. Expected: WS123456"
}
```

### Test Error 4: Invalid PIN Format

**Purpose:** Verify PIN validation

**Test Data:**
```json
{
  "card_serial": "WS123456",
  "card_pin": "12"  // Too short
}
```

**Expected Error:**
```json
{
  "error": "PIN must be 4-6 digits"
}
```

### Test Error 5: Missing Phone Number for Top-Up

**Purpose:** Verify phone number requirement

**Steps:**
1. Remove phone_number from user profile
2. Try to top up card
3. Should fail with error

**Expected Error:**
```json
{
  "error": "Phone number required for top-up. Please update your profile."
}
```

---

## Integration Testing with Embedly

### Manual API Testing (Bypassing App)

Use these to test Embedly API directly:

#### 1. Onboard Card Direct
```bash
curl -X POST https://waas-staging.embedly.ng/embedded/api/v1/tap/onboard-customer \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "customerId": "your-embedly-customer-id",
    "walletId": "your-embedly-wallet-id",
    "cardSerial": "WS123456",
    "transactionPin": "1234",
    "maxDebit": 50000
  }'
```

#### 2. Get Balance Direct
```bash
curl -X POST https://waas-staging.embedly.ng/embedded/api/v1/tap/get-balance \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "cardSerial": "WS123456"
  }'
```

#### 3. Get Transaction History Direct
```bash
curl -X GET "https://waas-staging.embedly.ng/embedded/api/v1/tap/transaction-history?cardSerial=WS123456&fromDate=2026-01-01&toDate=2026-02-06" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY"
```

#### 4. Top Up Direct
```bash
curl -X POST https://waas-staging.embedly.ng/embedded/api/v1/tap/credit-or-topup-customer \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "mobileNumber": "2348012345678",
    "amount": 5000,
    "cardSerial": "WS123456"
  }'
```

---

## Test Results Template

Use this template to document your test results:

```markdown
## Test Results - YYYY-MM-DD

### Environment
- Environment: Staging / Production
- API Key: (first 10 chars) xxxx...
- Base URL: https://waas-staging.embedly.ng/embedded/api/v1/tap

### Test 1: Card Onboarding
- Status: ✅ Pass / ❌ Fail
- Card Serial: WS123456
- Notes:

### Test 2: Get Balance
- Status: ✅ Pass / ❌ Fail
- Balance Returned: ₦10,000
- Notes:

### Test 3: Transaction History
- Status: ✅ Pass / ❌ Fail
- Transactions Found: 5
- Notes:

### Test 4: Top Up
- Status: ✅ Pass / ❌ Fail
- Amount: ₦5,000
- New Balance: ₦15,000
- Notes:

### Test 5: Search Customer
- Status: ✅ Pass / ❌ Fail
- Customer Found: Yes
- Notes:

### Error Tests
- Duplicate card: ✅ Pass / ❌ Fail
- Card serial taken: ✅ Pass / ❌ Fail
- Invalid serial format: ✅ Pass / ❌ Fail
- Invalid PIN: ✅ Pass / ❌ Fail
- Missing phone: ✅ Pass / ❌ Fail

### Issues Found
1.
2.
3.

### Overall Status
✅ All tests passed
⚠️ Some tests failed (see issues)
❌ Major failures
```

---

## Debugging Tips

### Check Environment Variable
```typescript
// In any API route or page
console.log('TAP API URL:', process.env.EMBEDLY_TAP_API_URL || 'auto-selected');
console.log('API Key exists:', !!process.env.EMBEDLY_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### Test TAP Client Directly
```typescript
// Create a test script: scripts/test-tap-api.ts
import { getCardBalance } from '@/lib/embedly/tap-client';

async function test() {
  const result = await getCardBalance('WS123456');
  console.log(JSON.stringify(result, null, 2));
}

test();
```

### Check Database State
```sql
-- All cards
SELECT
  card_serial,
  status,
  p.email,
  p.full_name
FROM wingside_cards wc
JOIN profiles p ON p.id = wc.user_id;

-- Card with full details
SELECT * FROM wingside_cards WHERE card_serial = 'WS123456';
```

### Monitor API Calls
```typescript
// In lib/embedly/tap-client.ts, add logging:
console.log('[TAP API]', {
  url,
  method: options.method,
  body: options.body,
  timestamp: new Date().toISOString()
});
```

---

## Production Checklist

Before deploying to production:

- [ ] All tests pass in staging
- [ ] Environment variables set in production
- [ ] API key verified with Embedly
- [ ] Database migrations run
- [ ] Error handling tested
- [ ] User documentation updated
- [ ] Admin can monitor card transactions
- [ ] Webhook endpoints configured (if applicable)
- [ ] Rate limiting in place
- [ ] Logging configured
- [ ] Backup/rollback plan ready

---

**Happy Testing! 🎉**
