# Nomba Payment Amount Fix

**Date:** January 30, 2026
**Status:** ✅ Fixed

## The Bug

Customer payments were failing because amounts were being sent to Nomba in the wrong format:

- **Expected by Nomba:** Decimal naira format (e.g., `"250.00"` for ₦250)
- **What we were sending:** Integer kobo format (e.g., `"25000"` for ₦250)
- **Result:** ₦250 products appeared as ₦25,000 on Nomba's checkout page

## Root Cause

A previous commit attempted to "fix" Nomba by making it work like Paystack (which expects amounts in kobo/cents). However, **Nomba uses a different format** - it expects amounts in naira with 2 decimal places.

### The Bad Code (commit 35cd08d)
```typescript
// WRONG: Multiplying by 100 treats it like Paystack
const amountInKobo = Math.round(amount * 100)
amount: amountInKobo.toString()  // "25000" for ₦250
```

### The Fixed Code
```typescript
// CORRECT: Nomba expects naira format
const amountInNaira = Number(amount).toFixed(2)
amount: amountInNaira  // "250.00" for ₦250
```

## Files Changed

- `app/api/payment/nomba/initialize/route.ts` (lines 144-163)

## Testing

### Quick Test
```bash
# 1. Start dev server
npm run dev

# 2. Run the test script
node scripts/test-nomba-amount-fix.js
```

### What the Test Does

The test script will:
1. ✅ Show the difference between buggy format (kobo) vs fixed format (naira)
2. ✅ Create real Nomba checkout orders with various amounts
3. ✅ Generate checkout links you can verify in browser
4. ✅ Test your API endpoint (if dev server is running)

### Test Cases

| Amount | Buggy Output | Fixed Output | Nomba Displays |
|--------|-------------|--------------|----------------|
| ₦250   | "25000"     | "250.00"     | ₦250 ✅        |
| ₦100   | "10000"     | "100.00"     | ₦100 ✅        |
| ₦1,500 | "150000"    | "1500.00"    | ₦1,500 ✅      |
| ₦5,000.50 | "500050" | "5000.50"    | ₦5,000.50 ✅   |

### Manual Verification

1. Run the test script - it will generate Nomba checkout links
2. Open a checkout link in your browser
3. Verify the amount shows correctly (e.g., ₦250, not ₦25,000)
4. **DO NOT complete the payment** (test purposes only)

## Key Differences: Nomba vs Paystack

| Gateway  | Format      | Example (₦250) | API Expects |
|----------|-------------|----------------|-------------|
| Paystack | Kobo (int)  | `25000`        | Smallest currency unit |
| Nomba    | Naira (decimal) | `"250.00"` | Decimal string |

## Production Deployment

After testing:

1. ✅ Verify test script passes all tests
2. ✅ Test a real checkout on staging/dev
3. ✅ Verify amount appears correctly on Nomba's page
4. ✅ Deploy to production
5. ✅ Monitor first few production payments

## Logs

The fixed code logs amount conversions for debugging:

```
[Nomba Initialize INIT-1738228800000] Amount: ₦250 → "250.00" (naira format)
```

Look for this in your server logs to confirm the fix is active.

## References

- Original test report: `docs/NOMBA_GATEWAY_TEST_REPORT.md` (line 73-77)
- Nomba API docs: Checkout order endpoint expects `amount` as string with 2 decimals
- Related commit: 35cd08d (introduced the bug)
- Fix commit: (this commit)

## Support

If you still see incorrect amounts:

1. Check server logs for amount conversion messages
2. Verify you're using the latest code (`git pull`)
3. Restart your dev server
4. Run the test script to confirm the fix
5. Check `.env.local` has valid Nomba credentials
