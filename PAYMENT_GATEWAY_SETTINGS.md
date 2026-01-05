# Payment Gateway Enable/Disable Feature

## Overview

Admins can now enable/disable payment gateways (Paystack, Nomba, Wallet) from the admin settings page. Disabled gateways will not appear as options during checkout.

## Setup Instructions

### Step 1: Run the Migration

Add payment gateway settings to your database:

**Option A: Using Supabase Dashboard** (Recommended if CLI not linked)

1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
2. Paste and run this SQL:

```sql
-- Enable/disable Paystack payment gateway
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_paystack_enabled',
  'true',
  'payment',
  'Enable or disable Paystack payment gateway (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable/disable Nomba payment gateway
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_nomba_enabled',
  'true',
  'payment',
  'Enable or disable Nomba payment gateway (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable/disable Wallet payment option
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_wallet_enabled',
  'true',
  'payment',
  'Enable or disable Wallet payment option (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
```

**Option B: Using Supabase CLI** (If linked)

```bash
npx supabase db push
```

### Step 2: Access Admin Settings

1. Go to: http://localhost:3000/admin/settings
2. Scroll to **"Payment Settings"** section
3. You'll see three new settings:
   - `Payment Gateway Paystack Enabled` ✅
   - `Payment Gateway Nomba Enabled` ✅
   - `Payment Gateway Wallet Enabled` ✅

### Step 3: Toggle Gateways

- **Check the box** = Enable the gateway
- **Uncheck the box** = Disable the gateway
- Click **"Save Settings"** to apply changes

## How It Works

### Checkout Page Behavior

When settings are changed:

1. **Disabled gateways** are hidden from payment options
2. **Auto-selection**: If a customer's selected gateway is disabled, the first available gateway is auto-selected
3. **Real-time updates**: Settings are fetched on page load
4. **Caching**: Settings cached for 5 minutes (Redis) or 2 minutes (memory)

### Gateway Availability Logic

```javascript
const enabledGateways = {
  paystack: settings.payment_gateway_paystack_enabled === 'true',
  nomba: settings.payment_gateway_nomba_enabled === 'true',
  wallet: settings.payment_gateway_wallet_enabled === 'true',
};
```

### Fallback Behavior

- If **all gateways disabled**: Shows error message
- If **current gateway disabled**: Auto-selects first available
- If **wallet disabled**: Hides wallet and split payment options

## Admin Interface

### Payment Settings Section

Located in: **app/admin/settings/page.tsx**

Settings appear under "Payment Settings" category:

| Setting Key | Description | Default |
|-------------|-------------|---------|
| `payment_gateway_paystack_enabled` | Enable/disable Paystack | `true` |
| `payment_gateway_nomba_enabled` | Enable/disable Nomba | `true` |
| `payment_gateway_wallet_enabled` | Enable/disable Wallet | `true` |

Each setting renders as:
- Checkbox toggle
- Status text (Enabled/Disabled)
- Auto-saves when "Save Settings" clicked

## Testing

### Test 1: Disable Nomba

1. Go to `/admin/settings`
2. Uncheck "Payment Gateway Nomba Enabled"
3. Click "Save Settings"
4. Go to checkout
5. **Result**: Nomba option should not appear ✅

### Test 2: Disable All But One

1. Disable Paystack and Wallet
2. Keep only Nomba enabled
3. Go to checkout
4. **Result**: Only Nomba option appears, auto-selected ✅

### Test 3: Disable Current Selection

1. Select "Pay with Paystack" at checkout
2. Go to admin settings
3. Disable Paystack
4. Return to checkout (refresh page)
5. **Result**: Nomba auto-selected (or next available gateway) ✅

## Cache Invalidation

Settings are cached for performance. To force update:

```javascript
// Clear Redis cache
await redis.del('settings')

// Clear memory cache
memoryCache.delete('settings')
```

Or simply wait 2-5 minutes for cache to expire.

## Database Schema

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX idx_site_settings_category ON site_settings(category);
```

## API Endpoints

### GET /api/settings
Returns all settings including payment gateway status:

```json
{
  "settings": {
    "payment_gateway_paystack_enabled": "true",
    "payment_gateway_nomba_enabled": "true",
    "payment_gateway_wallet_enabled": "true",
    ...
  },
  "settingsByCategory": {
    "payment": {
      "payment_gateway_paystack_enabled": "true",
      "payment_gateway_nomba_enabled": "true",
      "payment_gateway_wallet_enabled": "true"
    }
  }
}
```

### PUT /api/admin/settings
Update settings (admin only):

```json
{
  "settings": {
    "payment_gateway_nomba_enabled": "false"
  }
}
```

## Troubleshooting

### Issue: Gateway still shows after disabling

**Cause**: Cache not invalidated
**Solution**: Wait 2-5 minutes or clear cache manually

### Issue: "No payment methods available" error

**Cause**: All gateways disabled
**Solution**: Enable at least one gateway in admin settings

### Issue: Settings don't save

**Cause**: Permission error or database connection issue
**Solution**: Check admin role and database connectivity

## Security

- **Admin-only**: Only admin users can update settings
- **Validation**: Settings validated server-side
- **Cache control**: ETag support for cache validation
- **Rate limiting**: Applied to settings API

## Future Enhancements

Possible improvements:
- [ ] Per-gateway fee configuration
- [ ] Gateway-specific order limits
- [ ] A/B testing different gateways
- [ ] Analytics dashboard for gateway performance
- [ ] Automatic gateway failover
- [ ] Gateway priority/ordering configuration

---

**Status**: ✅ Ready to use

**Migration**: Required (see Step 1 above)

**Test**: Visit `/admin/settings` and look for "Payment Settings" section
