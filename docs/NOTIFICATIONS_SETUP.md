# Notifications Setup Guide

This guide will help you set up and configure the push notifications and email notifications system for Wingside.

## Prerequisites

- Supabase project with database migrations applied
- Resend account for email delivery (or another email service)
- VAPID keys for web push notifications
- Next.js development environment

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Supabase Configuration

```bash
# Supabase URL and Anon Key (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Email Configuration (Resend)

```bash
# Resend API Key for email notifications
RESEND_API_KEY=re-your-resend-api-key
```

Get your API key from: https://resend.com/api-keys

### Push Notifications Configuration (VAPID)

```bash
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
NEXT_PUBLIC_VAPID_SUBJECT=mailto:admin@wingside.ng
```

### Site Configuration

```bash
# Your application URL (used in email links and redirects)
NEXT_PUBLIC_APP_URL=https://wingside.ng
```

## Generating VAPID Keys

VAPID keys are required for web push notifications. Generate them using the provided script:

```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public Key:', keys.publicKey); console.log('Private Key:', keys.privateKey);"
```

Or use the Node.js script:

```javascript
// scripts/generate-vapid-keys.js
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('VAPID Keys Generated:');
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);
console.log('\nAdd these to your .env.local file:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
```

Run it:
```bash
node scripts/generate-vapid-keys.js
```

## Database Setup

Run the notifications system migration:

```bash
npx supabase db push
```

Or apply the migration manually:

```bash
npx supabase migration up --file 20250105_notifications_system.sql
```

This will create the following tables:
- `notification_preferences` - User notification preferences
- `email_templates` - Email templates with dynamic variables
- `notification_logs` - Log of all sent notifications
- `push_subscriptions` - Web push subscription data

## Setting Up Resend for Email

1. Sign up at https://resend.com/
2. Verify your email domain (e.g., wingside.ng)
3. Create an API key
4. Add the API key to your environment variables:
   ```bash
   RESEND_API_KEY=re-your-api-key
   ```
5. Configure your domain settings in Resend

## Testing Notifications

### Test Email Notifications

```bash
# Test all email templates
node scripts/test-email-notifications.js all

# Test specific template
node scripts/test-email-notifications.js order confirmation
node scripts/test-email-notifications.js promotion
node scripts/test-email-notifications.js reward
```

**Important:** Update the test email address in `scripts/test-email-notifications.js` before running.

### Test Push Notifications

```bash
# List active push subscriptions
node scripts/test-push-notifications.js list

# Send test notification
node scripts/test-push-notifications.js test

# Send order confirmation
node scripts/test-push-notifications.js order
```

## Integration with Order System

To automatically send notifications when orders are created or status changes:

```typescript
import { onOrderCreated, onOrderStatusChanged } from '@/lib/notifications/order-notifications';

// When order is created
await onOrderCreated(orderId);

// When order status changes
await onOrderStatusChanged(orderId, 'preparing');
await onOrderStatusChanged(orderId, 'ready');
await onOrderStatusChanged(orderId, 'delivered');
```

### Example: Order Creation API

```typescript
// app/api/orders/route.ts
import { onOrderCreated } from '@/lib/notifications/order-notifications';

export async function POST(request: Request) {
  // ... create order logic ...

  const { data: order } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  // Send order confirmation notification
  await onOrderCreated(order.id);

  return NextResponse.json(order);
}
```

### Example: Order Status Update

```typescript
// app/api/orders/[id]/status/route.ts
import { onOrderStatusChanged } from '@/lib/notifications/order-notifications';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status } = await request.json();

  // ... update order status ...

  // Send status update notification
  await onOrderStatusChanged(params.id, status);

  return NextResponse.json({ success: true });
}
```

## Admin Dashboard

Access the notification dashboard at `/admin/notifications`:

- View notification logs
- See success/failure rates
- Filter by type (email, push, SMS)
- Resend failed notifications

## User Notification Preferences

Users can manage their notification preferences at `/my-account/notifications`:

- Enable/disable email notifications
- Enable/disable push notifications
- Configure specific notification types
- Subscribe/unsubscribe from marketing emails

## Service Worker

The service worker (`/public/sw.js`) handles:
- PWA caching
- Push notification display
- Notification click handling
- Background sync

Make sure the service worker is registered in your app:

```typescript
// app/layout.tsx
import { registerSW } from '@/lib/service-worker';

useEffect(() => {
  registerSW();
}, []);
```

## Troubleshooting

### Push Notifications Not Working

1. **Check browser support**: Push notifications require HTTPS (except localhost)
2. **Verify VAPID keys**: Ensure keys are correctly set in environment variables
3. **Service worker registration**: Check browser console for registration errors
4. **Permission status**: Ensure user has granted notification permission

### Emails Not Sending

1. **Verify Resend API key**: Check that `RESEND_API_KEY` is correct
2. **Domain verification**: Ensure your domain is verified in Resend
3. **Check logs**: View notification logs in admin dashboard
4. **Email templates**: Verify templates exist in database

### Database Connection Issues

1. **Check Supabase credentials**: Verify URL and keys in environment variables
2. **RLS policies**: Ensure RLS policies are correctly configured
3. **Migration status**: Verify all migrations have been applied

## Security Considerations

- **Never commit** `.env.local` to version control
- **Service role key** should only be used server-side
- **VAPID private key** must be kept secret
- **API rate limiting** should be implemented for notification endpoints
- **User preferences** must always be respected before sending notifications

## Best Practices

1. **Respect user preferences**: Always check preferences before sending
2. **Don't spam**: Limit frequency of promotional notifications
3. **Test thoroughly**: Test all notification types before production
4. **Monitor logs**: Regularly check notification logs for failures
5. **Handle errors**: Gracefully handle failed notifications
6. **Provide value**: Ensure notifications provide real value to users

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review notification logs in admin dashboard
3. Verify all environment variables are set correctly
4. Check database migrations are applied
5. Review test scripts for usage examples
