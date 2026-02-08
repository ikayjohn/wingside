# Embedly TAP Card Setup Guide

## Required Environment Variables

### Minimum Configuration (What You MUST Have)

```bash
# Your Embedly API Key (shared between Wallet and TAP APIs)
EMBEDLY_API_KEY=BSK-xxxxxxxxxxxxxxxxxxxxx

# TAP API Endpoint (choose based on your key)
EMBEDLY_TAP_API_URL=https://waas-prod.embedly.ng/embedded/api/v1/tap
# OR for staging:
# EMBEDLY_TAP_API_URL=https://waas-staging.embedly.ng/embedded/api/v1/tap
```

## Current Issue: 401 Unauthorized

You're getting this error because either:

### Option 1: Wrong Environment
- Your `EMBEDLY_API_KEY` is for **staging** but you're hitting **production**
- **Fix:** Change `EMBEDLY_TAP_API_URL` to staging URL

### Option 2: No TAP Permissions
- Your API key works for wallet but **NOT for TAP cards**
- **Fix:** Contact Embedly to enable TAP card access

### Option 3: Wrong API Key
- You might have multiple keys and using the wrong one
- **Fix:** Check your Embedly dashboard for the correct TAP key

## How to Verify Your Setup

### 1. Check Which Embedly Account You're Using

Contact Embedly support and ask:
- "Is my API key `BSK-iAYk...` for production or staging?"
- "Does this key have TAP card API access enabled?"
- "What is the correct base URL for TAP cards with this key?"

### 2. Test the API Directly

You can test if your credentials work using curl:

```bash
curl -X POST https://waas-prod.embedly.ng/embedded/api/v1/tap/get-balance \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{"cardSerial": "12345678"}'
```

Expected responses:
- **200 OK** - Credentials work (even if card not found)
- **401 Unauthorized** - Wrong key or wrong endpoint
- **403 Forbidden** - No TAP access on this key

### 3. Common Embedly Environments

| Environment | Wallet Base URL | TAP Base URL |
|-------------|----------------|--------------|
| Production | checkout-prod.embedly.ng | waas-prod.embedly.ng/embedded/api/v1/tap |
| Staging | checkout-staging.embedly.ng | waas-staging.embedly.ng/embedded/api/v1/tap |

## Quick Fix Options

### Option A: Try Staging URL
```bash
# Edit .env.local
EMBEDLY_TAP_API_URL=https://waas-staging.embedly.ng/embedded/api/v1/tap
```

### Option B: Get TAP-Specific Key
Ask Embedly if there's a separate API key for TAP cards:
```bash
# If they give you a TAP-specific key
EMBEDLY_TAP_API_KEY=your-tap-specific-key
```
(Note: Code currently doesn't support separate TAP key, would need modification)

### Option C: Use Test Mode
If you don't have TAP access yet, you can test the UI/UX without real API:
```bash
# Set this to skip Embedly API calls (for UI testing only)
SKIP_EMBEDLY_TAP=true
```
(Note: Would need to add this feature to the code)

## Next Steps

1. **Contact Embedly Support** with these questions:
   ```
   Hi Embedly Team,

   I'm trying to use the TAP Card API and getting 401 Unauthorized.

   My API key starts with: BSK-iAYk...

   Questions:
   - Is this key for production or staging?
   - Does this key have TAP card API access enabled?
   - What is the correct TAP API base URL for this key?
   - Do I need a separate API key for TAP cards?

   Thank you!
   ```

2. **Try both endpoints** while waiting:
   - Production: `https://waas-prod.embedly.ng/embedded/api/v1/tap`
   - Staging: `https://waas-staging.embedly.ng/embedded/api/v1/tap`

3. **Check your Embedly dashboard** for:
   - API key permissions/scopes
   - TAP card feature toggle
   - Test card serials for your environment

## Summary

**You have:** ✅ EMBEDLY_API_KEY
**You need:** ❓ TAP API access enabled on that key
**Next:** Contact Embedly to verify TAP permissions
