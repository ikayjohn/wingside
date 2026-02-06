# Quick Start: Testing Embedly TAP Cards

**Get up and running with TAP card testing in 5 minutes**

---

## Prerequisites

- ✅ Embedly TAP API corrected (already done)
- ✅ Admin panel created (already done)
- ⏳ Environment variables set
- ⏳ Database ready

---

## Step 1: Set Environment Variable (1 minute)

```bash
# Add to .env.local
EMBEDLY_API_KEY=your_actual_embedly_api_key_here

# Optional: Override API URL (defaults to staging in dev)
# EMBEDLY_TAP_API_URL=https://waas-staging.embedly.ng/embedded/api/v1/tap
```

---

## Step 2: Install Test Dependencies (1 minute)

```bash
# Install tsx for running TypeScript scripts
npm install -D tsx

# Or use existing installation
```

---

## Step 3: Run Test Suite (2 minutes)

```bash
# Run comprehensive test suite
npx tsx scripts/test-tap-cards.ts
```

**Expected Output:**
```
============================================================
🧪 Embedly TAP Cards Test Suite
============================================================

============================================================
1️⃣  Configuration Tests
============================================================

ℹ️  Running: Environment Variables...
ℹ️  API Key exists: sk_live_xxx...
ℹ️  NODE_ENV: development
ℹ️  TAP API Base URL: https://waas-staging.embedly.ng/embedded/api/v1/tap
✅ Environment Variables (45ms)

ℹ️  Running: Validation Helpers...
✅ All validation helpers work correctly
✅ Validation Helpers (12ms)

ℹ️  Running: Response Format Parsing...
✅ Response parsing logic correct
ℹ️  Successfully extracted content from nested structure
✅ Response Format Parsing (5ms)

============================================================
2️⃣  Database Tests
============================================================

ℹ️  Running: Database Connection...
✅ Database connection successful
✅ Database Connection (234ms)

ℹ️  Running: Wingside Cards Table...
✅ wingside_cards table exists and is accessible
ℹ️  Total cards in database: 0
✅ Wingside Cards Table (156ms)

============================================================
3️⃣  Embedly TAP API Tests
============================================================

⚠️  These tests require a valid test card in Embedly
⚠️  Set TEST_CARD_SERIAL env var to test with real card

ℹ️  Running: Get Balance API...
⚠️  Testing with card serial: WS000001
ℹ️  Note: This will fail if card doesn't exist in Embedly
⚠️  Balance API returned error: Card not found
ℹ️  This is expected if test card doesn't exist yet
✅ Get Balance API (456ms)

============================================================
📊 Test Results Summary
============================================================

Total Tests: 6
Passed: 6
Failed: 0
Total Duration: 908ms

============================================================
🏁 Final Verdict
============================================================

✅ ALL TESTS PASSED! 🎉
✅ Your Embedly TAP Cards setup is working correctly!

Next steps:
1. Test card onboarding via UI at /my-account/cards
2. Test with real card serial and PIN
3. Monitor logs for any errors
```

---

## Step 4: Test Admin Panel (1 minute)

```bash
# Start dev server
npm run dev
```

**Navigate to:**
```
http://localhost:3000/admin/wingside-cards
```

**You should see:**
- Stats dashboard (Total Cards, Active Cards, etc.)
- Search and filter controls
- Cards table (empty if no cards yet)
- "Generate Card Serial" button

**Try:**
1. Click "Generate Card Serial"
2. Generate 5 test serials
3. Copy them for later use

---

## Step 5: Test Card Onboarding (Optional - requires Embedly account)

If you have access to Embedly TAP API:

### A. Generate Test Card Serial

```bash
# In admin panel
1. Click "Generate Card Serial"
2. Generate 1 serial (e.g., WS123456)
3. Copy it
```

### B. Create Test User

```bash
# Create test user via your app or directly in Supabase
# Ensure user has:
# - embedly_customer_id
# - embedly_wallet_id
# - phone_number
```

### C. Link Card

```bash
# Login as test user
http://localhost:3000/login

# Navigate to cards page
http://localhost:3000/my-account/cards

# Click "Link Your Card"
# Enter:
# - Card Serial: WS123456
# - PIN: 1234

# Expected: Success message and card details displayed
```

---

## What Each Component Does

### Test Script (`scripts/test-tap-cards.ts`)
- ✅ Verifies environment variables
- ✅ Tests validation helpers
- ✅ Checks database connectivity
- ✅ Tests TAP API endpoints (if card exists)
- ✅ Provides detailed pass/fail report

### Admin Panel (`/admin/wingside-cards`)
- 📊 View all cards and statistics
- 🔍 Search by serial, customer, email, phone
- 🎛️ Filter by status
- 🆕 Generate new card serials
- 📝 View card details
- ⚙️ Update card status

### User Card Page (`/my-account/cards`)
- 🔗 Link new physical card
- 💳 View card details
- 💰 Check balance
- 📊 View transactions
- 🚫 Suspend/manage card

---

## Troubleshooting

### Test Failed: "EMBEDLY_API_KEY not set"

**Fix:**
```bash
# Add to .env.local
EMBEDLY_API_KEY=your_api_key_here
```

### Test Failed: "Database connection failed"

**Fix:**
```bash
# Check Supabase credentials in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Test Failed: "wingside_cards table"

**Fix:**
```bash
# Run migration
psql -f supabase/migrations/20260201_create_wingside_cards.sql

# Or apply via Supabase dashboard
```

### Admin Panel Shows Empty

**This is normal!** No cards linked yet.

**To see data:**
1. Generate card serial in admin panel
2. Create test user with Embedly wallet
3. Link card via user interface
4. Refresh admin panel

---

## Next Steps After Testing

### If All Tests Pass:

1. ✅ **Test in staging** with real Embedly account
2. ✅ **Generate real card serials** for physical cards
3. ✅ **Print card serials** on physical cards
4. ✅ **Distribute cards** to customers
5. ✅ **Monitor admin panel** for card activity

### Before Production:

1. ⏳ **Run cleanup** - Remove virtual card code (see `CLEANUP_VIRTUAL_CARDS.md`)
2. ⏳ **Set production env vars**
3. ⏳ **Test end-to-end flow**
4. ⏳ **Train support staff** on card management
5. ⏳ **Deploy to production**

---

## Useful Commands

```bash
# Run test suite
npx tsx scripts/test-tap-cards.ts

# Run test suite with test card
TEST_CARD_SERIAL=WS123456 npx tsx scripts/test-tap-cards.ts

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `EMBEDLY_CARDS_ANALYSIS.md` | Full architecture overview |
| `EMBEDLY_CARDS_CORRECTIONS.md` | API corrections applied |
| `EMBEDLY_TAP_TESTING_GUIDE.md` | Detailed testing procedures |
| `CLEANUP_VIRTUAL_CARDS.md` | Remove unused code |
| **`QUICK_START_TESTING.md`** | **This file - Quick start** |

---

## Success Criteria

Your TAP cards setup is ready when:

- ✅ Test script passes all tests
- ✅ Admin panel loads without errors
- ✅ Can generate card serials
- ✅ Can link card (if testing with real Embedly account)
- ✅ Can view card details in admin panel
- ✅ Can update card status
- ✅ No TypeScript errors
- ✅ No console errors

---

## Support

**Issues?**
1. Check `EMBEDLY_TAP_TESTING_GUIDE.md` for detailed troubleshooting
2. Review `EMBEDLY_CARDS_CORRECTIONS.md` for API details
3. Run test script with verbose logging

**Questions?**
- API not working? → Check environment variables
- Database errors? → Run migrations
- UI not loading? → Check console for errors
- Cards not showing? → Generate and link test card first

---

**Estimated Time:** 5-15 minutes depending on environment setup

**Last Updated:** 2026-02-06
