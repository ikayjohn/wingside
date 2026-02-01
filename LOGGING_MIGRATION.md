# Logging System Migration Guide

This guide documents the migration from `console.log` statements to structured logging using the new `lib/logger.ts` utility.

## Overview

The new logging system provides:
- **Structured logging** with consistent format
- **Log levels** (debug, info, warn, error)
- **Contextual information** via metadata
- **Environment-based configuration** (LOG_LEVEL env var)
- **Pre-configured domain loggers** for different parts of the app

## Quick Start

### Import the logger

```typescript
import { loggers } from '@/lib/logger'
```

### Replace console.log statements

**Before:**
```typescript
console.log('Order created:', orderId)
console.error('Failed to update order:', error)
console.warn('Redis unavailable, using memory cache')
```

**After:**
```typescript
loggers.order.info('Order created', { orderId })
loggers.order.error('Failed to update order', error, { orderId })
loggers.cache.warn('Redis unavailable, using memory cache')
```

## Available Loggers

Pre-configured loggers for different domains:

- `loggers.auth` - Authentication and authorization
- `loggers.payment` - Payment processing (Paystack, Nomba, etc.)
- `loggers.order` - Order management
- `loggers.webhook` - Webhook handlers
- `loggers.database` - Database operations
- `loggers.cache` - Caching (Redis, memory)
- `loggers.email` - Email sending
- `loggers.sms` - SMS notifications
- `loggers.api` - General API routes
- `loggers.admin` - Admin operations
- `loggers.wallet` - Wallet and Embedly operations
- `loggers.rewards` - Loyalty and rewards
- `loggers.streak` - Streak tracking
- `loggers.integrations` - Third-party integrations (Zoho, etc.)

You can also create custom loggers:

```typescript
import { createLogger } from '@/lib/logger'
const customLogger = createLogger('MyFeature')
```

## Log Levels

### debug
Verbose information for development and troubleshooting.
**When to use:** Detailed flow, variable values, internal state

```typescript
loggers.payment.debug('Initializing Paystack transaction', {
  amount,
  email,
  reference
})
```

### info
General information about application flow.
**When to use:** Successful operations, important milestones, configuration

```typescript
loggers.order.info('Order confirmed', { orderId, total })
loggers.webhook.info('Paystack webhook signature verified')
```

### warn
Non-critical issues that should be addressed.
**When to use:** Deprecations, fallbacks, missing optional config

```typescript
loggers.cache.warn('Redis unavailable, falling back to memory cache')
loggers.payment.warn('PAYSTACK_SECRET_KEY not configured - dev mode only')
```

### error
Critical issues that need immediate attention.
**When to use:** Exceptions, failed operations, data integrity issues

```typescript
loggers.database.error('Failed to create order', error, { userId })
loggers.email.error('Email delivery failed', emailError, {
  recipient: order.customer_email,
  orderNumber: order.order_number
})
```

## Migration Pattern by File Type

### API Routes (app/api/**/route.ts)

```typescript
// Before
export async function POST(request: NextRequest) {
  console.log('Processing request...')
  try {
    // logic
    console.log('Success:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// After
import { loggers } from '@/lib/logger'

export async function POST(request: NextRequest) {
  loggers.api.info('Processing request')
  try {
    // logic
    loggers.api.info('Request successful', { result })
  } catch (error) {
    loggers.api.error('Request failed', error)
  }
}
```

### Webhook Handlers

```typescript
// Before
console.log('Webhook received:', event.type)
console.log(`Order ${orderId} payment confirmed`)

// After
import { loggers } from '@/lib/logger'

loggers.webhook.info('Webhook received', { eventType: event.type })
loggers.webhook.info('Order payment confirmed', { orderId })
```

### Database Operations

```typescript
// Before
console.error('Database error:', dbError)
console.log('Query result:', data)

// After
import { loggers } from '@/lib/logger'

loggers.database.error('Database query failed', dbError, { query: 'orders' })
loggers.database.debug('Query result', { data })
```

### Integration Calls

```typescript
// Before
console.log('Syncing to Zoho CRM...')
console.log('✅ Synced to Zoho:', contactId)

// After
import { loggers } from '@/lib/logger'

loggers.integrations.info('Syncing customer to Zoho CRM')
loggers.integrations.info('Customer synced to Zoho', { contactId })
```

## Environment Configuration

Set the `LOG_LEVEL` environment variable to control logging verbosity:

```bash
# Show all logs (development)
LOG_LEVEL=debug

# Show info, warn, error (default production)
LOG_LEVEL=info

# Show only warnings and errors
LOG_LEVEL=warn

# Show only errors
LOG_LEVEL=error
```

**Defaults:**
- Development: `debug` (all logs)
- Production: `info` (info, warn, error)

## Migration Checklist

Track progress on replacing console.log statements:

### High Priority (Business Critical)
- [x] app/api/payment/webhook/route.ts (Paystack webhook) - Partially migrated
- [ ] app/api/payment/nomba/webhook/route.ts (Nomba webhook)
- [ ] app/api/payment/nomba/initialize/route.ts
- [ ] app/api/orders/route.ts
- [ ] lib/supabase/admin.ts
- [ ] lib/redis.ts

### Medium Priority (Infrastructure)
- [ ] lib/integrations/index.ts
- [ ] lib/integrations/zoho.ts
- [ ] lib/integrations/embedly.ts
- [ ] lib/emails/service.ts
- [ ] lib/notifications/sms.ts
- [ ] lib/streak/helper.ts

### Lower Priority (Admin & Features)
- [ ] app/api/admin/**/route.ts files
- [ ] app/api/rewards/**/route.ts files
- [ ] app/api/user/**/route.ts files

## Best Practices

1. **Use appropriate log levels**
   - Don't use `error` for non-critical warnings
   - Don't use `info` for debugging details

2. **Include contextual data**
   ```typescript
   // Good
   loggers.order.error('Failed to create order', error, {
     userId,
     items: items.length,
     total
   })

   // Bad
   loggers.order.error('Failed to create order')
   ```

3. **Remove emoji from logs**
   ```typescript
   // Before
   console.log('✅ Payment successful')
   console.error('❌ Payment failed')

   // After
   loggers.payment.info('Payment successful')
   loggers.payment.error('Payment failed')
   ```

4. **Don't log sensitive data**
   ```typescript
   // Bad
   loggers.payment.info('Processing payment', {
     cardNumber,
     cvv,
     password
   })

   // Good
   loggers.payment.info('Processing payment', {
     last4: cardNumber.slice(-4),
     orderId
   })
   ```

5. **Batch related logs**
   ```typescript
   // Before
   console.log('Checking user...')
   console.log('User found:', userId)
   console.log('Checking wallet...')
   console.log('Wallet balance:', balance)

   // After
   loggers.wallet.debug('User wallet lookup', {
     userId,
     balance
   })
   ```

## Future Enhancements

The logger is designed to support future integrations:

- External logging services (Sentry, LogRocket, Datadog)
- Log aggregation (CloudWatch, Papertrail)
- Structured JSON logging for production
- Performance monitoring integration
- Error tracking and alerting

## Questions?

See the implementation in `lib/logger.ts` or create a custom logger for your use case.
