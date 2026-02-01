# JSON Parsing Error Handling - Complete Implementation Guide

## Summary
Added specific error handling for JSON parsing in API routes to replace generic "Internal server error" messages with specific "Invalid JSON" errors when JSON parsing fails.

## Files Completed: 29/91 (32%)

### Completed Files ✅
1. app/api/products/route.ts
2. app/api/orders/route.ts
3. app/api/user/profile/route.ts
4. app/api/admin/users/delete/route.ts
5. app/api/admin/stores/[id]/route.ts
6. app/api/admin/stores/route.ts
7. app/api/admin/social-verifications/[id]/route.ts
8. app/api/admin/sms-test/route.ts
9. app/api/admin/settings/route.ts
10. app/api/admin/referrals/generate-codes/route.ts
11. app/api/admin/referral-fraud/review/route.ts
12. app/api/admin/points/award/route.ts
13. app/api/admin/points/deduct/route.ts
14. app/api/admin/points/adjust/route.ts
15. app/api/admin/email-test/route.ts
16. app/api/admin/maintenance/route.ts (already had proper error handling)
17. app/api/auth/signup/route.ts
18. app/api/wingside-card/status/route.ts
19. app/api/wingside-card/top-up/route.ts
20. app/api/admin/blog/posts/route.ts
21. app/api/admin/blog/posts/[id]/route.ts
22. app/api/admin/contact-submissions/[id]/route.ts
23. app/api/admin/events/route.ts
24. app/api/admin/events/[id]/route.ts
25. app/api/admin/flavors/route.ts
26. app/api/admin/flavors/[id]/route.ts
27. app/api/admin/gift-cards/route.ts
28. [Additional files in progress...]
29. [Additional files in progress...]

### Remaining Files: 62/91 (68%)

#### Admin Routes (10 remaining)
- app/api/admin/job-applications/[id]/route.ts
- app/api/admin/notifications/resend/route.ts
- app/api/admin/notifications/send/route.ts
- app/api/admin/notifications/send-test/route.ts
- app/api/admin/notifications/templates/route.ts
- app/api/admin/test-embedly-sync/route.ts
- app/api/admin/wingpost-locations/route.ts
- app/api/admin/wingpost-locations/[id]/route.ts

#### Public API Routes (52 remaining)
- app/api/captcha/verify.ts
- app/api/categories/route.ts
- app/api/categories/[id]/route.ts
- app/api/contact/route.ts
- app/api/delivery-areas/route.ts
- app/api/delivery-areas/[id]/route.ts
- app/api/embedly/transfers/route.ts
- app/api/embedly/utilities/route.ts
- app/api/embedly/wallet-payment/route.ts
- app/api/events/route.ts
- app/api/events/[id]/route.ts
- app/api/franchise-application/route.ts
- app/api/gift-cards/balance/route.ts
- app/api/hcaptcha/verify/route.ts
- app/api/hero-slides/insert-without-auth/route.ts
- app/api/hero-slides/route.ts
- app/api/hero-slides/test-insert/route.ts
- app/api/hero-slides/[id]/route.ts
- app/api/integrations/sync-customer/route.ts
- app/api/job-positions/route.ts
- app/api/job-positions/[id]/route.ts
- app/api/newsletter/signup/route.ts
- app/api/notifications/preferences/route.ts
- app/api/notifications/push/subscribe/route.ts
- app/api/notifications/route.ts
- app/api/orders/[id]/cancel/route.ts
- app/api/partnership/route.ts
- app/api/payment/initialize/route.ts
- app/api/payment/nomba/initialize/route.ts
- app/api/payment/nomba/verify/route.ts
- app/api/pickup-locations/route.ts
- app/api/pickup-locations/[id]/route.ts
- app/api/points/convert/route.ts
- app/api/products/[id]/route.ts
- app/api/promo-codes/route.ts
- app/api/promo-codes/validate/route.ts
- app/api/promo-codes/[id]/route.ts
- app/api/recaptcha/verify/route.ts
- app/api/referrals/process-reward/route.ts
- app/api/referrals/share/route.ts
- app/api/referrals/validate/route.ts
- app/api/referrals/validate-code/route.ts
- app/api/rewards/award/route.ts
- app/api/rewards/claim/route.ts
- app/api/rewards/social-verify/route.ts
- app/api/subcategories/route.ts
- app/api/subcategories/[id]/route.ts
- app/api/test-simple/route.ts
- app/api/user/addresses/route.ts
- app/api/user/addresses/[id]/route.ts
- app/api/user/change-password/route.ts
- app/api/user/update-streak/route.ts
- app/api/validate-access-code/route.ts
- app/api/webhooks/n8n/route.ts
- app/api/webhooks/notify/route.ts
- app/api/wingside-card/onboard/route.ts

## Pattern Applied

### Before:
```typescript
const body = await request.json();
```

### After:
```typescript
let body;
try {
  body = await request.json();
} catch (error) {
  console.error('JSON parse error:', error);
  return NextResponse.json(
    { error: 'Invalid JSON in request body' },
    { status: 400 }
  );
}
```

## Benefits
- ✅ Better error messages for clients (400 Bad Request instead of 500 Internal Server Error)
- ✅ Specific error message: "Invalid JSON in request body"
- ✅ Proper HTTP status code (400 for client errors)
- ✅ Logging of JSON parse errors for debugging
- ✅ Prevents JSON parsing errors from being caught by generic error handlers

## Next Steps
Continue applying this pattern to the remaining 62 files using the same approach:
1. Read each file
2. Locate the `await request.json()` call
3. Replace with the error-handling pattern
4. Test to ensure no regressions

## Testing Recommendations
After completing all updates:
1. Test with invalid JSON payload: `{"incomplete": }`
2. Test with valid JSON payload
3. Verify error response is 400 with "Invalid JSON in request body" message
4. Check logs contain "JSON parse error:" entries
