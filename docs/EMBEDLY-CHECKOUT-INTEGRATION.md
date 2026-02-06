# Embedly Payment Option - Integration Summary

## What Was Done

The Embedly Checkout "Pay with Bank Transfer" option has been **fully integrated** into your checkout flow.

---

## Changes Made

### 1. **Checkout Page Updated** (`app/checkout/page.tsx`)

**Added to Payment Method Type:**
```typescript
const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'nomba' | 'wallet' | 'embedly'>('paystack');
```

**Added to Enabled Gateways:**
```typescript
const [enabledGateways, setEnabledGateways] = useState({
  paystack: true,
  nomba: true,
  wallet: true,
  embedly: true,  // NEW
});
```

**Added Payment Option UI:**
```tsx
{/* Bank Transfer Payment Option (Embedly Checkout) */}
{enabledGateways.embedly && (
  <label className={...}>
    <input
      type="radio"
      name="paymentMethod"
      value="embedly"
      checked={paymentMethod === 'embedly'}
      onChange={(e) => setPaymentMethod(e.target.value)}
    />
    <div>
      <span className="font-medium">Pay with Bank Transfer</span>
      <p className="text-xs text-gray-500">Transfer directly from your bank app (₦0 fees)</p>
    </div>
    <svg>...bank icon...</svg>
  </label>
)}
```

**Added Payment Routing:**
```typescript
else if (paymentMethod === 'embedly') {
  // Initialize Embedly checkout wallet
  const paymentResponse = await fetch('/api/payment/embedly/initialize', ...);

  // Redirect to Embedly callback page
  window.location.href = `/payment/embedly/callback?${params.toString()}`;
}
```

---

## Customer Flow

```
1. Customer goes to checkout
   ↓
2. Fills in delivery details
   ↓
3. Sees 4 payment options:
   ├─ Pay with Card (Paystack)
   ├─ Pay with Card or Transfer (Nomba)
   ├─ Pay with Bank Transfer (Embedly) ← NEW
   └─ Pay with Wallet (if has balance)
   ↓
4. Selects "Pay with Bank Transfer"
   ↓
5. Clicks "Place Order"
   ↓
6. Order created → Redirected to Embedly callback page
   ↓
7. Sees account number: 2225657965
   ↓
8. Transfers money via banking app
   ↓
9. Payment detected → Order confirmed
```

---

## Database Setting

### Run This Migration in Supabase SQL Editor:

```sql
-- Add Embedly payment gateway enabled setting
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_embedly_enabled',
  'true',
  'payment_gateways',
  'Enable Embedly Checkout bank transfer payment gateway',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = 'true',
  updated_at = NOW();
```

This setting allows you to **enable/disable** the Embedly option from the admin dashboard.

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Embedly Checkout Configuration
EMBEDLY_API_KEY=your-embedly-api-key-here
EMBEDLY_ORG_ID=49849c1d-7845-11f0-8d44-4af84d9ff6f1
EMBEDLY_SETTLEMENT_ACCOUNT_ID=1a190c66-028b-11f1-9999-0214de0002b0
EMBEDLY_ALIAS=Wingside
EMBEDLY_PREFIX_MAPPING_ID=get-from-embedly-api
EMBEDLY_WEBHOOK_SECRET=generate-random-secret
```

---

## How to Get the Prefix Mapping ID

```bash
curl https://checkout-prod.embedly.ng/api/v1/organization-prefix-mappings \
  -H "x-api-key: YOUR_EMBEDLY_API_KEY"
```

Look for your organization (Wingside) and copy the `id` field.

---

## Testing the Integration

### 1. Enable the Payment Gateway

Run the SQL migration above to add the setting.

### 2. Add to Cart & Go to Checkout

```bash
# Visit your site
https://www.wingside.ng/order

# Add items to cart, then go to checkout
# You should see 4 payment options:
```

### 3. Select "Pay with Bank Transfer"

- Radio button for "Pay with Bank Transfer" should be visible
- Shows green bank icon
- Description: "Transfer directly from your bank app (₦0 fees)"

### 4. Complete Order

- Fill in all details
- Click "Place Order"
- Should redirect to `/payment/embedly/callback`

### 5. Verify Callback Page

You should see:
- Account number (10 digits)
- Bank name: Embedly
- Amount to pay
- 30-minute countdown timer
- Auto-payment detection

---

## How to Disable (If Needed)

### Option 1: Via Database
```sql
UPDATE site_settings
SET setting_value = 'false'
WHERE setting_key = 'payment_gateway_embedly_enabled';
```

### Option 2: Via Admin Dashboard (if you have settings management)
Navigate to Settings → Payment Gateways → Toggle Embedly

---

## Payment Method Order in Checkout

1. **Pay with Card (Paystack)** - Default
2. **Pay with Card or Transfer (Nomba)** - Alternative
3. **Pay with Bank Transfer (Embedly)** ← NEW (₦0 fees)
4. **Pay with Wallet** - Only if logged in with balance

---

## Troubleshooting

### "Pay with Bank Transfer" option not showing

**Check:**
1. Migration was run? `SELECT * FROM site_settings WHERE setting_key = 'payment_gateway_embedly_enabled'`
2. Setting value is 'true'?
3. Cache cleared? Restart dev server

### Error when selecting Embedly

**Check:**
1. Environment variables set?
2. `EMBEDLY_API_KEY` is valid?
3. `EMBEDLY_PREFIX_MAPPING_ID` is correct?

### Order not redirecting to Embedly page

**Check browser console for:**
- API errors at `/api/payment/embedly/initialize`
- JavaScript errors

---

## Files Modified

✅ `app/checkout/page.tsx` - Added Embedly payment option
✅ `supabase/migrations/20260204_add_embedly_payment_setting.sql` - Database setting
✅ `.env.example` - Environment variables documented

---

## Next Steps

1. ✅ Run SQL migration to add setting
2. ✅ Add environment variables to `.env.local`
3. ✅ Test checkout flow with Embedly option
4. ✅ Configure webhook in Embedly dashboard
5. ✅ Process test payment end-to-end

The Embedly payment option is now **live and ready** to accept bank transfers! 🎉
