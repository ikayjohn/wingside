# Nomba Payment Gateway - Bulletproof Implementation Plan

**Goal:** Ensure Nomba payments NEVER fail again

---

## ✅ Immediate Fixes (Deploy Today)

### 1. Deploy Missing Database Function
**Status:** ⚠️ CRITICAL - Not deployed yet

**Run in Supabase SQL Editor:**
```sql
-- Create claim_first_order_reward function
CREATE OR REPLACE FUNCTION claim_first_order_reward(
    p_user_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_bonus_points INTEGER := 50;
    v_already_claimed BOOLEAN;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM reward_claims
        WHERE user_id = p_user_id
        AND reward_type = 'first_order'
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RAISE NOTICE 'User % already claimed first order bonus', p_user_id;
        RETURN FALSE;
    END IF;

    RETURN claim_reward(
        p_user_id,
        'first_order',
        v_bonus_points,
        'First order bonus - thank you for your first order!',
        jsonb_build_object('order_id', p_order_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_first_order_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_first_order_reward(UUID, UUID) TO service_role;
```

---

### 2. Fix Webhook Signature Verification
**Status:** ⚠️ FAILING - Currently bypassed

**Problem:** Signature string format doesn't match Nomba's requirements

**Current Code (WRONG):**
```typescript
const signatureString = [
  parsedEvent.event_type || '',
  parsedEvent.requestId || parsedEvent.request_id || '',
  parsedEvent.data?.merchant?.userId || '',
  // ... etc
].join(':')
```

**Fix:** Add detailed logging to see actual payload structure

```typescript
// Add to webhook/route.ts after parsing event
console.log('🔍 [Signature Debug] Full event structure:', JSON.stringify(event, null, 2))
console.log('🔍 [Signature Debug] Headers:', {
  signature: signature,
  timestamp: timestamp,
  allHeaders: Object.fromEntries(request.headers.entries())
})

// Then build signature with exact field names from payload
const signatureString = [
  event.event_type,
  event.requestId,
  event.data?.merchant?.userId ?? '',
  event.data?.merchant?.walletId ?? '',
  event.data?.transaction?.transactionId ?? '',
  event.data?.transaction?.type ?? '',
  event.data?.transaction?.time ?? '',
  event.data?.transaction?.responseCode ?? '',
  timestamp
].join(':')

console.log('🔍 [Signature Debug] Built string:', signatureString)
console.log('🔍 [Signature Debug] Expected:', expectedSignature)
console.log('🔍 [Signature Debug] Received:', signature)
```

**Then compare logs with Nomba docs:** https://developer.nomba.com/products/webhooks/signature-verification-new

---

### 3. Add Webhook Idempotency
**Status:** ⚠️ MISSING - Can process same payment twice

**Problem:** If webhook is retried, we might award points twice

**Solution:** Check if order is already processed

```typescript
// Add at start of webhook handler (after signature verification)

// Idempotency check: Skip if already processed
if (order.payment_status === 'paid') {
  console.log(`✓ Order ${order.order_number} already processed (idempotent check)`)

  // Return 200 so Nomba doesn't retry
  return NextResponse.json({
    success: true,
    message: 'Already processed',
    idempotent: true
  })
}
```

---

## 🔧 Reliability Improvements (Deploy This Week)

### 4. Add Database Transaction Logging
**Purpose:** Track every payment attempt for debugging

**Create table:**
```sql
-- Payment processing audit log
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    event_type TEXT NOT NULL,
    transaction_id TEXT,
    order_reference TEXT,
    payload JSONB NOT NULL,
    signature TEXT,
    signature_valid BOOLEAN,
    processed_successfully BOOLEAN DEFAULT false,
    error_message TEXT,
    processing_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_webhooks_order_id ON payment_webhooks(order_id);
CREATE INDEX idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);
```

**Log every webhook:**
```typescript
// At start of webhook handler
const webhookStartTime = Date.now()

try {
  // ... process webhook

  // Log success
  await admin.from('payment_webhooks').insert({
    order_id: order.id,
    event_type: event.event_type,
    transaction_id: event.data?.transaction?.transactionId,
    order_reference: event.data?.order?.orderReference,
    payload: event,
    signature: signature,
    signature_valid: true,
    processed_successfully: true,
    processing_duration_ms: Date.now() - webhookStartTime
  })
} catch (error) {
  // Log failure
  await admin.from('payment_webhooks').insert({
    event_type: event.event_type,
    payload: event,
    signature: signature,
    processed_successfully: false,
    error_message: error.message,
    processing_duration_ms: Date.now() - webhookStartTime
  })
}
```

---

### 5. Add Real-time Monitoring
**Purpose:** Get notified immediately when payments fail

**Setup Supabase Webhooks:**
```sql
-- Create function to send admin notification on webhook failure
CREATE OR REPLACE FUNCTION notify_webhook_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processed_successfully = false THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NULL,
            'webhook_processing_failed',
            'Nomba Webhook Failed',
            'A payment webhook failed to process. Immediate investigation required.',
            jsonb_build_object(
                'webhook_id', NEW.id,
                'event_type', NEW.event_type,
                'order_reference', NEW.order_reference,
                'error', NEW.error_message
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on webhook insert
CREATE TRIGGER webhook_failure_notification
    AFTER INSERT ON payment_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION notify_webhook_failure();
```

---

### 6. Add Automatic Retry Logic
**Purpose:** Retry failed external operations (email, CRM sync)

**Retry helper function:**
```typescript
// lib/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options

  let lastError: Error
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }
  }

  throw lastError!
}
```

**Use in webhook:**
```typescript
// Email notifications with retry
try {
  await retryWithBackoff(() =>
    sendPaymentConfirmation({...}),
    { maxRetries: 3 }
  )
  console.log('✅ Email sent (with retries)')
} catch (error) {
  console.error('⚠️ Email failed after retries:', error)
  // Log but don't fail the webhook
}
```

---

## 📊 Monitoring Dashboard (Next Sprint)

### 7. Create Payment Analytics View
**Purpose:** Monitor payment success rate

```sql
-- Payment success rate view
CREATE VIEW payment_analytics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_webhooks,
    SUM(CASE WHEN processed_successfully THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN processed_successfully THEN 0 ELSE 1 END) as failed,
    ROUND(100.0 * SUM(CASE WHEN processed_successfully THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
    AVG(processing_duration_ms) as avg_duration_ms
FROM payment_webhooks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Query it
SELECT * FROM payment_analytics;
```

---

### 8. Setup Alerts
**Purpose:** Get notified when success rate drops

**Supabase Edge Function (runs every hour):**
```typescript
// supabase/functions/payment-health-check/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Check last hour's success rate
  const { data } = await supabase.rpc('get_hourly_payment_stats')

  if (data.success_rate < 95) {
    // Send alert (email, Slack, SMS)
    await fetch('YOUR_ALERT_WEBHOOK', {
      method: 'POST',
      body: JSON.stringify({
        alert: 'Payment Success Rate Below 95%',
        success_rate: data.success_rate,
        failed_count: data.failed_count
      })
    })
  }

  return new Response('OK')
})
```

**Schedule it:**
```bash
# Run every hour
supabase functions deploy payment-health-check
supabase functions schedule payment-health-check --cron "0 * * * *"
```

---

## 🧪 Testing Strategy

### 9. Automated Payment Flow Tests
**Purpose:** Catch issues before production

**Test script:**
```typescript
// scripts/test-payment-flow.ts
async function testPaymentFlow() {
  console.log('🧪 Testing Nomba payment flow...')

  // 1. Create test order
  const order = await createTestOrder()
  console.log('✓ Order created:', order.id)

  // 2. Initialize payment
  const checkout = await initializePayment(order.id)
  console.log('✓ Checkout initialized:', checkout.checkout_url)

  // 3. Simulate webhook (using test signature)
  const webhook = await simulateWebhook(order.id)
  console.log('✓ Webhook processed:', webhook.success)

  // 4. Verify order status
  const updatedOrder = await getOrder(order.id)
  assert(updatedOrder.payment_status === 'paid', 'Order should be paid')
  console.log('✓ Order confirmed')

  // 5. Verify rewards awarded
  const points = await getPointsHistory(order.user_id)
  assert(points.length > 0, 'Points should be awarded')
  console.log('✓ Rewards awarded')

  console.log('✅ All tests passed!')
}
```

**Run before every deployment:**
```bash
npm run test:payments
```

---

## 📋 Deployment Checklist

### Before Every Deploy:
- [ ] Run payment flow tests
- [ ] Check Supabase functions are deployed
- [ ] Verify environment variables
- [ ] Test webhook signature in staging
- [ ] Check database migrations applied
- [ ] Monitor error logs for 10 minutes after deploy

### Weekly:
- [ ] Review payment analytics
- [ ] Check webhook success rate (should be >99%)
- [ ] Review failed webhooks and fix patterns
- [ ] Update Nomba API credentials if rotated

### Monthly:
- [ ] Security audit of payment flow
- [ ] Review and optimize database queries
- [ ] Check for Nomba API updates
- [ ] Load test payment system

---

## 🎯 Success Metrics

**Target KPIs:**
- Webhook success rate: **>99%**
- Payment confirmation time: **<5 seconds**
- Rewards processing success: **>99%**
- Zero payment rollbacks
- Zero false order cancellations

**Monitor:**
```sql
-- Daily health check
SELECT
    COUNT(*) as total_payments,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM orders
WHERE payment_gateway = 'nomba'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 🚀 Implementation Timeline

### Today (Immediate):
1. ✅ Deploy claim_first_order_reward function
2. ✅ Add signature debugging logs
3. ✅ Add idempotency check

### This Week:
4. ⏳ Create payment_webhooks audit table
5. ⏳ Add retry logic for external services
6. ⏳ Setup basic monitoring

### Next Sprint:
7. ⏳ Payment analytics dashboard
8. ⏳ Automated alerts
9. ⏳ Comprehensive test suite

---

## 📚 Resources

- [Nomba Webhook Signature Verification](https://developer.nomba.com/products/webhooks/signature-verification-new)
- [Nomba Checkout Documentation](https://developer.nomba.com/products/checkout/introduction)
- [Nomba SDK Overview](https://developer.nomba.com/plugins-and-sdk/overview)

---

## ✅ Current Status

**Fixed:**
- ✅ RLS blocking updates
- ✅ Callback race conditions
- ✅ Payment rollbacks removed
- ✅ Webhook processes payments correctly

**Pending:**
- ⏳ Database function deployment
- ⏳ Signature verification fix
- ⏳ Idempotency implementation
- ⏳ Monitoring and alerts

**Once Complete:**
- 🎯 Nomba will be bulletproof!
