# JSON Parsing Error Handling - Bulk Update Summary

## Goal
Add specific error handling for JSON parsing in all API routes that use `await request.json()`.

## Pattern Applied
Replace:
```typescript
const body = await request.json();
```

With:
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

## Files Completed (23/91)
- ✅ app/api/products/route.ts
- ✅ app/api/orders/route.ts
- ✅ app/api/user/profile/route.ts
- ✅ app/api/admin/users/delete/route.ts
- ✅ app/api/admin/stores/[id]/route.ts
- ✅ app/api/admin/stores/route.ts
- ✅ app/api/admin/social-verifications/[id]/route.ts
- ✅ app/api/admin/sms-test/route.ts
- ✅ app/api/admin/settings/route.ts
- ✅ app/api/admin/referrals/generate-codes/route.ts
- ✅ app/api/admin/referral-fraud/review/route.ts
- ✅ app/api/admin/points/award/route.ts
- ✅ app/api/admin/points/deduct/route.ts
- ✅ app/api/admin/points/adjust/route.ts
- ✅ app/api/admin/email-test/route.ts
- ✅ app/api/admin/maintenance/route.ts (already had error handling)
- ✅ app/api/auth/signup/route.ts
- ✅ app/api/wingside-card/status/route.ts
- ✅ app/api/wingside-card/top-up/route.ts
- ✅ app/api/admin/blog/posts/route.ts
- ✅ app/api/admin/blog/posts/[id]/route.ts
- ✅ app/api/admin/contact-submissions/[id]/route.ts
- ✅ app/api/admin/events/route.ts

## Remaining Files (68/91)
Organized by category:

### Admin Routes (15)
- app/api/admin/events/[id]/route.ts
- app/api/admin/flavors/route.ts
- app/api/admin/flavors/[id]/route.ts
- app/api/admin/gift-cards/route.ts
- app/api/admin/job-applications/[id]/route.ts
- app/api/admin/notifications/resend/route.ts
- app/api/admin/notifications/send/route.ts
- app/api/admin/notifications/send-test/route.ts
- app/api/admin/notifications/templates/route.ts
- app/api/admin/test-embedly-sync/route.ts
- app/api/admin/wingpost-locations/route.ts
- app/api/admin/wingpost-locations/[id]/route.ts

### Public API Routes (53)
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

## Next Steps
Due to the large number of remaining files (68), it's recommended to:
1. Continue with systematic batch processing
2. Process 10-15 files at a time
3. Verify each batch before continuing
4. OR use a script-based approach with careful review

## Status
✅ 25% complete (23/91 files updated)
⏳ 75% remaining (68/91 files to update)
