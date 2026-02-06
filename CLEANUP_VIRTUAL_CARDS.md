# Virtual Card Code Cleanup Guide

**Purpose:** Remove unused Embedly virtual card code to simplify codebase
**Decision:** Keep only physical Wingside Tap Cards

---

## Files to Delete

### 1. Webhook Handler for Virtual Cards
```bash
rm app/api/embedly/webhooks/cards/route.ts
```

**Why:** This handles virtual card webhooks (ATM, POS, checkout) which we're not using.

---

## Code to Remove from Existing Files

### 1. `lib/embedly/client.ts`

**Remove Lines 42-78** (Virtual Card Interfaces):
```typescript
export interface EmbedlyCard { ... }
export interface CreateCardRequest { ... }
export interface FundCardRequest { ... }
export interface UpdateCardLimitRequest { ... }
```

**Remove Lines 656-726** (Virtual Card Functions):
```typescript
async createCard() { ... }
async getCards() { ... }
async getCardDetails() { ... }
async blockCard() { ... }
async unblockCard() { ... }
async freezeCard() { ... }
async unfreezeCard() { ... }
async fundCard() { ... }
async updateCardLimit() { ... }
```

**Before Removal:**
```typescript
export interface EmbedlyCard {
  id: string;
  cardId: string;
  customerId: string;
  walletId: string;
  cardType: 'VIRTUAL' | 'PHYSICAL';
  cardStatus: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'TERMINATED';
  maskedPan: string;
  expiryDate: string;
  balance: number;
  currencyId: string;
  cardPinSet: boolean;
  spendLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  isDefault: boolean;
  createdAt: string;
}

// ... more interfaces ...

// Card Management
async createCard(cardData: CreateCardRequest): Promise<EmbedlyCard> {
  const response = await this.makeRequest<{
    statusCode: number;
    message: string;
    data: EmbedlyCard;
  }>('/cards/create', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }, this.cardUrl);

  return response.data;
}

// ... 8 more card functions ...
```

**Keep:**
- All wallet-related functions
- TAP card client (`lib/embedly/tap-client.ts`) - DO NOT DELETE
- Checkout wallet functions
- Customer management functions

---

## Database Cleanup (Optional)

If these tables exist and have no data:

```sql
-- Check if tables exist and are empty
SELECT COUNT(*) FROM cards;
SELECT COUNT(*) FROM card_transactions;

-- If both are empty, you can drop them:
-- DROP TABLE IF EXISTS card_transactions;
-- DROP TABLE IF EXISTS cards;
```

**⚠️ WARNING:** Only drop tables if:
1. They actually exist (may not be created yet)
2. They are completely empty
3. You're 100% sure you won't use virtual cards

**Recommendation:** Leave tables for now. They don't hurt anything if empty.

---

## Environment Variables Cleanup

### `lib/embedly/client.ts`

**Current:**
```typescript
this.cardUrl = process.env.EMBEDLY_CARD_URL || defaultUrls.cardUrl;
```

**After Cleanup:**
```typescript
// Remove cardUrl property entirely
// Remove from constructor initialization
// Remove from defaultUrls object
```

### `.env.example`

**Current:**
```bash
# EMBEDLY_CARD_URL=https://waas-card-middleware-api-prod.embedly.ng
```

**After Cleanup:**
```bash
# Remove this line entirely (or add comment explaining it's not needed)
```

---

## Step-by-Step Cleanup Process

### Step 1: Backup Current Code
```bash
# Create a backup branch
git checkout -b backup/before-virtual-card-cleanup
git add .
git commit -m "Backup before removing virtual card code"
git checkout main
```

### Step 2: Delete Webhook Handler
```bash
rm app/api/embedly/webhooks/cards/route.ts
```

### Step 3: Edit `lib/embedly/client.ts`

Open the file and:

1. **Remove virtual card interfaces** (lines ~42-78):
   - `EmbedlyCard`
   - `CreateCardRequest`
   - `FundCardRequest`
   - `UpdateCardLimitRequest`

2. **Remove card URL from constructor**:
   ```typescript
   // REMOVE THIS:
   private cardUrl: string;

   // REMOVE FROM defaultUrls:
   cardUrl: 'https://waas-card-middleware-api-prod.embedly.ng',

   // REMOVE FROM initialization:
   this.cardUrl = process.env.EMBEDLY_CARD_URL || defaultUrls.cardUrl;
   ```

3. **Remove card management functions** (lines ~656-726):
   - `createCard()`
   - `getCards()`
   - `getCardDetails()`
   - `blockCard()`
   - `unblockCard()`
   - `freezeCard()`
   - `unfreezeCard()`
   - `fundCard()`
   - `updateCardLimit()`

### Step 4: Update `.env.example`

Remove or comment out:
```bash
# EMBEDLY_CARD_URL=https://waas-card-middleware-api-prod.embedly.ng
```

Add note:
```bash
# Note: Virtual card features removed. Only Wingside Tap Cards are supported.
# Tap Card API uses EMBEDLY_API_KEY (same as wallet API)
```

### Step 5: Test the Application

```bash
# Run the test script
npx tsx scripts/test-tap-cards.ts

# Start dev server
npm run dev

# Test these features still work:
# 1. Wallet operations (balance, transactions, transfers)
# 2. Checkout wallets
# 3. Customer management
# 4. Wingside Tap Cards (at /my-account/cards)
```

### Step 6: Commit Changes

```bash
git add .
git commit -m "Remove unused virtual card code

- Deleted virtual card webhook handler
- Removed virtual card interfaces and functions from Embedly client
- Updated env example
- Kept only Wingside Tap Cards (physical cards)
"
```

---

## What to Keep

✅ **DO NOT DELETE:**

1. **`lib/embedly/tap-client.ts`** - Wingside Tap Cards client
2. **`app/api/wingside-card/**`** - All Wingside Card API routes
3. **`app/my-account/cards/page.tsx`** - User card management UI
4. **`app/admin/wingside-cards/page.tsx`** - Admin card management
5. **`supabase/migrations/20260201_create_wingside_cards.sql`** - Wingside Cards table
6. **Wallet functions** in `lib/embedly/client.ts`:
   - `createCustomer()`
   - `getCustomerById()`
   - `createWallet()`
   - `getWalletById()`
   - `getWalletHistory()`
   - `walletToWalletTransfer()`
   - `interBankTransfer()`
   - `createCheckoutWallet()`
   - `getCheckoutWallets()`
   - etc.

---

## Files Summary

### Files to Delete (1 file):
```
app/api/embedly/webhooks/cards/route.ts
```

### Files to Edit (2 files):
```
lib/embedly/client.ts          # Remove virtual card code
.env.example                   # Remove EMBEDLY_CARD_URL
```

### Files to Keep (Everything Else):
```
lib/embedly/tap-client.ts                          # ✅ Keep
app/api/wingside-card/**                           # ✅ Keep
app/my-account/cards/page.tsx                      # ✅ Keep
app/admin/wingside-cards/page.tsx                  # ✅ Keep
supabase/migrations/20260201_create_wingside_cards.sql  # ✅ Keep
```

---

## Verification Checklist

After cleanup, verify:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Test script passes: `npx tsx scripts/test-tap-cards.ts`
- [ ] Wallet operations still work
- [ ] Wingside Tap Cards still work at `/my-account/cards`
- [ ] Admin panel shows cards at `/admin/wingside-cards`
- [ ] No console errors in browser
- [ ] No broken imports

---

## Rollback Plan

If something breaks:

```bash
# Revert to backup
git checkout backup/before-virtual-card-cleanup

# Or revert specific commit
git revert HEAD
```

---

## Benefits of Cleanup

1. ✅ **Simpler codebase** - Less code to maintain
2. ✅ **Clearer architecture** - One card system instead of two
3. ✅ **Easier onboarding** - New developers won't be confused
4. ✅ **Better documentation** - Focus on what we actually use
5. ✅ **Reduced attack surface** - Less unused code = fewer potential bugs

---

## Timeline

**Recommended:** Do this cleanup after testing Tap Cards implementation

1. ✅ Test Tap Cards thoroughly (1-2 days)
2. ⏳ Run cleanup (30 minutes)
3. ⏳ Test again after cleanup (1 hour)
4. ⏳ Deploy to staging (if tests pass)
5. ⏳ Monitor for issues (1 week)
6. ⏳ Deploy to production

---

**Questions?** Review `EMBEDLY_CARDS_ANALYSIS.md` for context on why we're removing virtual cards.
