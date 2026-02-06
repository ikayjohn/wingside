# Embedly TAP Cards - Corrections Applied

**Date:** 2026-02-06
**Status:** ✅ Implementation Updated to Match Official API

---

## Summary of Changes

Based on official Embedly TAP API documentation, the following critical corrections were made:

### 1. ✅ Base URL Corrected

**Before:**
```typescript
// WRONG - Placeholder URL
const EMBEDLY_TAP_BASE_URL = 'https://api.embedly.com/tap/v1';
```

**After:**
```typescript
// CORRECT - Official Embedly endpoints
Staging:    https://waas-staging.embedly.ng/embedded/api/v1/tap
Production: https://waas-prod.embedly.ng/embedded/api/v1/tap
```

### 2. ✅ Authentication Fixed

**Before:**
```typescript
// WRONG - Bearer token auth
headers: {
  'Authorization': `Bearer ${EMBEDLY_TAP_API_KEY}`
}
```

**After:**
```typescript
// CORRECT - x-api-key header (same as wallet API)
headers: {
  'Content-Type': 'application/json',
  'x-api-key': EMBEDLY_API_KEY  // Uses same key as wallet API
}
```

### 3. ✅ API Endpoints Updated

| Operation | Old Endpoint (Wrong) | New Endpoint (Correct) |
|-----------|---------------------|------------------------|
| Onboard Card | `POST /cards/onboard` | `POST /onboard-customer` |
| Get Balance | `GET /cards/{serial}/balance` | `POST /get-balance` |
| Get History | `GET /cards/{serial}/transactions` | `GET /transaction-history?cardSerial=...` |
| Search Customer | N/A | `POST /search-customer` |
| Top Up | `POST /cards/topup` | `POST /credit-or-topup-customer` |

### 4. ✅ Request/Response Format Updated

**Embedly TAP Response Structure:**
```typescript
{
  data: {
    error: {
      message: string,
      status: number,      // 0 = no error
      details: any
    },
    success: {
      message: string,
      status: number,      // 1 = success, 0 = failure
      details: any
    },
    content: T,            // Actual data payload
    statusCode: number,
    newStatusCode: number
  },
  status: number,
  message: string
}
```

**Success Detection:**
```typescript
// Check data.success.status === 1 (not HTTP status code)
if (apiResponse.data.success.status === 1) {
  // Success - use apiResponse.data.content
} else {
  // Error - use apiResponse.data.error.message
}
```

---

## Updated API Functions

### 1. Onboard Card

**Request:**
```typescript
POST /onboard-customer
{
  "customerId": string,     // Embedly customer ID
  "walletId": string,       // Embedly wallet ID
  "cardSerial": string,     // e.g., "WS123456"
  "transactionPin": string, // 4-6 digits
  "maxDebit": number       // Transaction limit (default: 50000)
}
```

**Response:**
```typescript
{
  data: {
    success: {
      message: "Card linked successfully",
      status: 1
    },
    content: { valueKind: 6 },
    statusCode: 200
  }
}
```

**Usage:**
```typescript
import { onboardCard } from '@/lib/embedly/tap-client';

const result = await onboardCard({
  customer_id: 'embedly-customer-id',
  wallet_id: 'embedly-wallet-id',
  card_serial: 'WS123456',
  card_pin: '1234',
  max_debit: 50000
});

if (result.success) {
  console.log(result.message); // "Card linked successfully"
} else {
  console.error(result.error);
}
```

### 2. Get Balance

**Request:**
```typescript
POST /get-balance
{
  "cardSerial": string
}
```

**Response:**
```typescript
{
  data: {
    success: {
      message: "Found customer",
      status: 1
    },
    content: {
      phone: string,
      fullname: string,
      walletBalance: number,  // Balance in kobo/minor units
      valid: number           // 1 = valid, 0 = invalid
    },
    statusCode: 200
  }
}
```

**Usage:**
```typescript
import { getCardBalance } from '@/lib/embedly/tap-client';

const result = await getCardBalance('WS123456');

if (result.success && result.data) {
  console.log('Balance:', result.data.walletBalance);
  console.log('Customer:', result.data.fullname);
  console.log('Valid:', result.data.valid === 1);
}
```

### 3. Get Transaction History

**Request:**
```typescript
GET /transaction-history?cardSerial={serial}&fromDate={from}&toDate={to}

Query Params:
- cardSerial: string (required)
- fromDate: YYYY-MM-DD (required)
- toDate: YYYY-MM-DD (required)
```

**Response:**
```typescript
{
  data: {
    content: {
      transactions: Array<{
        transactionId: string,
        cardSerial: string,
        amount: number,
        type: 'DEBIT' | 'CREDIT',
        description: string,
        merchantName?: string,
        merchantLocation?: string,
        timestamp: string,
        balanceAfter: number,
        reference: string
      }>,
      totalCount: number
    }
  }
}
```

**Usage:**
```typescript
import { getCardHistory } from '@/lib/embedly/tap-client';

const result = await getCardHistory(
  'WS123456',
  '2026-01-01',  // fromDate
  '2026-02-06'   // toDate
);

if (result.success && result.data) {
  console.log('Transactions:', result.data.transactions);
  console.log('Total:', result.data.totalCount);
}
```

### 4. Search Customer

**Request:**
```typescript
POST /search-customer
{
  "cardSerial": string
}
```

**Response:**
```typescript
{
  data: {
    content: {
      customerId: string,
      walletId: string,
      fullname: string,
      phone: string,
      email?: string,
      cardSerial: string,
      status: string
    }
  }
}
```

**Usage:**
```typescript
import { searchCustomer } from '@/lib/embedly/tap-client';

const result = await searchCustomer('WS123456');

if (result.success && result.data) {
  console.log('Customer:', result.data.fullname);
  console.log('Phone:', result.data.phone);
  console.log('Embedly Customer ID:', result.data.customerId);
}
```

### 5. Top Up Card

**Request:**
```typescript
POST /credit-or-topup-customer
{
  "mobileNumber": string,  // Customer's phone number
  "amount": number,        // Amount in kobo/minor units
  "cardSerial": string     // Card to top up
}
```

**Response:**
```typescript
{
  data: {
    success: {
      message: "Completed",
      status: 1
    },
    content: { valueKind: 1 },
    statusCode: 200
  }
}
```

**Usage:**
```typescript
import { topUpCard } from '@/lib/embedly/tap-client';

const result = await topUpCard({
  mobile_number: '2348012345678',
  amount: 5000,  // ₦50 in kobo
  card_serial: 'WS123456'
});

if (result.success) {
  console.log(result.message); // "Completed"
}
```

---

## Environment Variables

### Required Configuration

Add to `.env.local` or `.env.production`:

```bash
# Embedly API Key (shared by Wallet and TAP APIs)
EMBEDLY_API_KEY=your_api_key_here

# Optional: Override TAP API base URL
# EMBEDLY_TAP_API_URL=https://waas-staging.embedly.ng/embedded/api/v1/tap
# EMBEDLY_TAP_API_URL=https://waas-prod.embedly.ng/embedded/api/v1/tap

# Automatic selection based on NODE_ENV
# - production → waas-prod.embedly.ng
# - development/staging → waas-staging.embedly.ng
```

### Notes:
- **Single API key** for both Wallet and TAP APIs (unlike previous assumption)
- **No separate `EMBEDLY_TAP_API_KEY`** needed
- Base URL auto-selects based on `NODE_ENV`
- Override with `EMBEDLY_TAP_API_URL` if needed

---

## Files Updated

### 1. TAP Client Library
**File:** `lib/embedly/tap-client.ts`

**Changes:**
- ✅ Correct base URLs (staging/production)
- ✅ Fixed authentication (x-api-key instead of Bearer)
- ✅ Updated all endpoint paths
- ✅ Proper response structure handling
- ✅ Added helper validation functions
- ✅ Documented all API functions with examples

### 2. Balance API Route
**File:** `app/api/wingside-card/balance/route.ts`

**Changes:**
- ✅ Updated to use `walletBalance` from response (not `balance`)
- ✅ Added customer info fields (fullname, phone, valid)
- ✅ Proper fallback handling

### 3. History API Route
**File:** `app/api/wingside-card/history/route.ts`

**Changes:**
- ✅ Changed from pagination (page/limit) to date range (fromDate/toDate)
- ✅ Default to last 30 days if no dates provided
- ✅ Updated response to use `totalCount` field

### 4. Top-Up API Route
**File:** `app/api/wingside-card/top-up/route.ts`

**Changes:**
- ✅ Added mobile number requirement (fetched from profile)
- ✅ Removed `source` and `reference` parameters (not in API)
- ✅ Updated to match Embedly request format
- ✅ Proper transaction recording

---

## Testing Checklist

### Pre-Production Testing

Before deploying to production, test the following:

#### 1. Environment Setup
```bash
# Verify environment variables
echo $EMBEDLY_API_KEY
echo $NODE_ENV

# Should auto-select staging URL in development
# Should auto-select production URL in production
```

#### 2. Card Onboarding
```bash
# Test with valid card serial and PIN
curl -X POST http://localhost:3000/api/wingside-card/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "card_serial": "WS123456",
    "card_pin": "1234"
  }'

# Expected: Success response with card linked message
```

#### 3. Balance Check
```bash
# Test balance retrieval
curl -X GET http://localhost:3000/api/wingside-card/balance

# Expected: Balance, customer info, and card info
```

#### 4. Transaction History
```bash
# Test with date range
curl -X GET "http://localhost:3000/api/wingside-card/history?fromDate=2026-01-01&toDate=2026-02-06"

# Expected: Array of transactions
```

#### 5. Top-Up
```bash
# Test card top-up
curl -X POST http://localhost:3000/api/wingside-card/top-up \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000
  }'

# Expected: Success with transaction reference
```

#### 6. Search Customer
```typescript
// Test in admin panel or script
import { searchCustomer } from '@/lib/embedly/tap-client';

const result = await searchCustomer('WS123456');
console.log(result);

// Expected: Customer details
```

---

## Common Errors & Solutions

### Error 1: "TAP card service not configured"
**Cause:** Missing `EMBEDLY_API_KEY` environment variable
**Solution:**
```bash
# Add to .env.local
EMBEDLY_API_KEY=your_actual_api_key
```

### Error 2: "Invalid API key"
**Cause:** Wrong API key or incorrect header format
**Solution:** Verify the API key in Embedly dashboard and ensure it's set correctly

### Error 3: "Card serial format invalid"
**Cause:** Card serial doesn't match WS######  format
**Solution:**
```typescript
// Use validation helper
import { validateCardSerial } from '@/lib/embedly/tap-client';

if (!validateCardSerial(cardSerial)) {
  throw new Error('Invalid card serial format');
}
```

### Error 4: "Phone number required for top-up"
**Cause:** User profile missing phone number
**Solution:** Ensure user has phone_number in profiles table before allowing top-up

### Error 5: Response shows success: false
**Cause:** Check `data.error.message` in response
**Solution:** Log full response and check Embedly dashboard for error details

---

## Migration Guide

If you have existing cards in the database, no migration needed. The changes are backward-compatible:

1. ✅ Database schema unchanged
2. ✅ API routes unchanged (same endpoints)
3. ✅ Frontend code unchanged (same response format)
4. ✅ Only internal API client updated

**Action Required:**
1. Set `EMBEDLY_API_KEY` environment variable
2. Test in staging first
3. Deploy to production

---

## Next Steps

### Immediate (Before Production)
1. ✅ TAP client updated
2. ✅ API routes updated
3. ⏳ Test in staging environment
4. ⏳ Verify with actual Embedly TAP API
5. ⏳ Update `.env.production` with correct API key

### Short-Term (Within 1 Week)
1. Add card transaction webhook handler
2. Implement real-time balance sync
3. Add POS transaction recording
4. Create admin panel for card management

### Long-Term (Within 1 Month)
1. Card analytics dashboard
2. Automated card issuance workflow
3. Card replacement process
4. Gift card implementation

---

## API Reference Quick Links

### Embedly TAP Endpoints

**Base URLs:**
- Staging: `https://waas-staging.embedly.ng/embedded/api/v1/tap`
- Production: `https://waas-prod.embedly.ng/embedded/api/v1/tap`

**Authentication:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Endpoints:**
1. `POST /onboard-customer` - Link physical card
2. `POST /get-balance` - Get wallet balance
3. `GET /transaction-history` - Get transaction history
4. `POST /search-customer` - Find customer by card serial
5. `POST /credit-or-topup-customer` - Top up card

---

## Support & Documentation

**Embedly Support:**
- Email: support@embedly.ng
- Dashboard: https://dashboard.embedly.ng

**Internal Documentation:**
- Original Analysis: `EMBEDLY_CARDS_ANALYSIS.md`
- This Document: `EMBEDLY_CARDS_CORRECTIONS.md`
- Database Schema: `supabase/migrations/20260201_create_wingside_cards.sql`

---

**Last Updated:** 2026-02-06
**Status:** ✅ Ready for Staging Testing
**Next Review:** After staging verification
