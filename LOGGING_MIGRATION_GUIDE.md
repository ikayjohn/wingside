# Logging Migration Guide

## Overview

This guide explains how to migrate from raw `console.*` statements to the structured logger in `lib/logger.ts`.

## Why Migrate?

**Current Issues with console.error:**
- ❌ No environment awareness (logs in production unnecessarily)
- ❌ No structured context (hard to debug)
- ❌ No log levels (everything is equal priority)
- ❌ No namespacing (can't filter by domain)
- ❌ Difficult to aggregate in production monitoring tools

**Benefits of Structured Logging:**
- ✅ Environment-aware (debug logs suppressed in production)
- ✅ Structured context (attach metadata to logs)
- ✅ Log levels (debug, info, warn, error)
- ✅ Namespaced loggers (filter by Auth, Payment, etc.)
- ✅ Easy to integrate with monitoring tools (Sentry, Datadog, etc.)

## Migration Patterns

### Pattern 1: Replace console.error

**Before:**
```typescript
console.error('Failed to create order:', error);
```

**After:**
```typescript
import { loggers } from '@/lib/logger';

loggers.order.error('Failed to create order', error);
```

### Pattern 2: Replace console.error with context

**Before:**
```typescript
console.error('Payment failed:', error, 'Order ID:', orderId);
```

**After:**
```typescript
import { loggers } from '@/lib/logger';

loggers.payment.error('Payment failed', error, { orderId });
```

### Pattern 3: Replace console.log/debug

**Before:**
```typescript
console.log('Processing order:', orderId);
```

**After:**
```typescript
import { loggers } from '@/lib/logger';

// For debug info (suppressed in production)
loggers.order.debug('Processing order', { orderId });

// For important info (shown in production)
loggers.order.info('Processing order', { orderId });
```

### Pattern 4: Replace console.warn

**Before:**
```typescript
console.warn('Rate limit approaching:', remainingRequests);
```

**After:**
```typescript
import { loggers } from '@/lib/logger';

loggers.api.warn('Rate limit approaching', { remainingRequests });
```

## Available Namespaced Loggers

```typescript
import { loggers } from '@/lib/logger';

loggers.auth        // Authentication & authorization
loggers.payment     // Payment processing
loggers.order       // Order management
loggers.webhook     // Webhook handlers
loggers.database    // Database operations
loggers.cache       // Redis/caching operations
loggers.email       // Email notifications
loggers.sms         // SMS notifications
loggers.api         // API routes
loggers.admin       // Admin operations
loggers.wallet      // Wallet operations
loggers.rewards     // Loyalty & rewards
loggers.streak      // Streak tracking
loggers.integrations // External integrations (Zoho, Embedly)
```

## Creating Custom Loggers

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('MyFeature');

logger.debug('Debug info');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

## Environment-Aware Logging

### Log Levels by Environment

**Development** (NODE_ENV=development):
- `logger.debug()` ✅ Shown
- `logger.info()` ✅ Shown
- `logger.warn()` ✅ Shown
- `logger.error()` ✅ Shown

**Production** (NODE_ENV=production):
- `logger.debug()` ❌ Suppressed
- `logger.info()` ✅ Shown
- `logger.warn()` ✅ Shown
- `logger.error()` ✅ Shown

### Override with LOG_LEVEL

```bash
# .env.production
LOG_LEVEL=warn  # Only show warnings and errors

# .env.development
LOG_LEVEL=debug # Show everything (default)
```

## Migration Checklist

### Priority 1: API Routes (High Impact)
- [ ] `/api/payment/**/*` - Payment webhooks
- [ ] `/api/orders/**/*` - Order processing
- [ ] `/api/auth/**/*` - Authentication
- [ ] `/api/user/**/*` - User operations
- [ ] `/api/rewards/**/*` - Loyalty system
- [ ] `/api/embedly/**/*` - Wallet integrations

### Priority 2: Critical Components
- [ ] Payment callback pages
- [ ] Order confirmation pages
- [ ] User dashboard pages
- [ ] Admin dashboard pages

### Priority 3: Other Components
- [ ] General pages
- [ ] Utility components
- [ ] UI components

## Quick Find & Replace Guide

### Find all console.error in API routes:
```bash
grep -r "console.error" app/api/**/*.ts
```

### Find all console.log in API routes:
```bash
grep -r "console.log" app/api/**/*.ts
```

### Find all console.warn in API routes:
```bash
grep -r "console.warn" app/api/**/*.ts
```

## Example Migration: Payment Webhook

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received webhook:', body);

    if (!body.reference) {
      console.error('Missing payment reference');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const order = await processPayment(body);
    console.log('Order processed:', order.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**After:**
```typescript
import { loggers } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    loggers.webhook.debug('Received webhook', { body });

    if (!body.reference) {
      loggers.webhook.error('Missing payment reference', null, { body });
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const order = await processPayment(body);
    loggers.webhook.info('Order processed', { orderId: order.id, reference: body.reference });

    return NextResponse.json({ success: true });
  } catch (error) {
    loggers.webhook.error('Webhook processing failed', error, { body });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Best Practices

### 1. Choose Appropriate Log Levels

**debug** - Verbose information for development:
```typescript
loggers.api.debug('Cache hit', { key, ttl });
```

**info** - Important application flow information:
```typescript
loggers.order.info('Order confirmed', { orderId, total });
```

**warn** - Non-critical issues that should be addressed:
```typescript
loggers.cache.warn('Redis unavailable, using memory cache');
```

**error** - Critical issues requiring immediate attention:
```typescript
loggers.payment.error('Payment gateway timeout', error, { orderId });
```

### 2. Include Relevant Context

**Good:**
```typescript
loggers.order.error('Order creation failed', error, {
  userId,
  items: order.items.length,
  total: order.total,
  paymentMethod: order.paymentMethod
});
```

**Bad:**
```typescript
loggers.order.error('Order creation failed', error);
```

### 3. Don't Log Sensitive Data

**Never log:**
- ❌ Full credit card numbers
- ❌ Passwords or tokens
- ❌ Full email addresses in production
- ❌ Personal identification numbers
- ❌ API keys or secrets

**Safe to log:**
- ✅ Order IDs / Reference numbers
- ✅ User IDs (internal)
- ✅ Payment status
- ✅ Masked card numbers (last 4 digits)
- ✅ Error messages (sanitized)

### 4. Use Consistent Namespaces

**Route:** `/api/payment/webhook/route.ts`
**Logger:** `loggers.payment` or `loggers.webhook`

**Route:** `/api/orders/route.ts`
**Logger:** `loggers.order`

**Route:** `/api/auth/signup/route.ts`
**Logger:** `loggers.auth`

## Automated Migration Script

```bash
# Find all files with console.error
find app/api -name "*.ts" -exec grep -l "console.error" {} \;

# Count total console.error statements
grep -r "console.error" app/api --include="*.ts" | wc -l

# Find files needing migration in priority order
echo "=== Payment Routes ===" && grep -l "console.error" app/api/payment/**/*.ts
echo "=== Order Routes ===" && grep -l "console.error" app/api/orders/**/*.ts
echo "=== Webhook Routes ===" && grep -l "console.error" app/api/**/webhook/**/*.ts
```

## Testing

### Verify Logging Works
```typescript
import { loggers, isProduction, isDevelopment } from '@/lib/logger';

// Test in development
if (isDevelopment) {
  loggers.api.debug('This should appear in dev console');
}

// Test in production (set NODE_ENV=production)
if (isProduction) {
  loggers.api.debug('This should NOT appear');
  loggers.api.error('This SHOULD appear');
}
```

### Verify Environment Detection
```bash
# Development
NODE_ENV=development npm run dev
# Should see debug logs

# Production
NODE_ENV=production npm start
# Should NOT see debug logs
```

## Integration with Monitoring Tools

### Sentry Integration (Future)
```typescript
import * as Sentry from '@sentry/nextjs';

export function createLogger(namespace?: string) {
  return {
    error(message: string, error?: Error | unknown, context?: LogContext): void {
      // Log to console
      console.error(formatLogEntry(entry));

      // Send to Sentry in production
      if (isProduction && error instanceof Error) {
        Sentry.captureException(error, {
          tags: { namespace },
          extra: { message, ...context }
        });
      }
    }
  };
}
```

### Datadog Integration (Future)
```typescript
import { datadogLogs } from '@datadog/browser-logs';

// Send logs to Datadog in production
if (isProduction) {
  datadogLogs.logger.error(message, context);
}
```

## Progress Tracking

### Files Migrated: 2/50+

**Completed:**
- ✅ `app/api/payment/webhook/route.ts`
- ✅ `app/api/embedly/webhooks/route.ts`

**In Progress:**
- ⏳ API routes migration

**Remaining:**
- ⬜ Component migration
- ⬜ Page migration

## References

- [Winston Logger](https://github.com/winstonjs/winston) - Popular Node.js logger
- [Pino Logger](https://github.com/pinojs/pino) - Fast JSON logger
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/structured-logging/)
- [12-Factor App Logs](https://12factor.net/logs)

## Support

For questions or issues with logging migration:
1. Check this guide
2. Review `lib/logger.ts` implementation
3. See examples in `/api/payment/webhook/route.ts`
