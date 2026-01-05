# Wingside Notification System

A comprehensive push notification and email notification system for the Wingside application.

## Features

### ✉️ Email Notifications
- **Transactional emails**: Order confirmations, status updates, delivery notifications
- **Marketing emails**: Promotions, newsletters, special offers
- **Reward emails**: Points earned, tier upgrades, milestone achievements
- **Account emails**: Password resets, verification emails

### 🔔 Push Notifications
- **Order updates**: Real-time notifications for order status changes
- **Promotions**: Time-sensitive offers and discounts
- **Rewards**: Points earned and reward notifications
- **Browser-based**: Works on modern browsers with service worker support

### ⚙️ Notification Preferences
- **User control**: Users can enable/disable specific notification types
- **Channel preferences**: Separate controls for email, push, and SMS
- **Granular settings**: Fine-grained control over notification categories
- **Default settings**: Sensible defaults that respect user privacy

### 📊 Admin Dashboard
- **Notification logs**: Track all sent notifications
- **Analytics**: View success/failure rates
- **Filtering**: Filter by type, status, date
- **Resend capability**: Retry failed notifications

## Architecture

```
lib/notifications/
├── index.ts                 # Main notification functions
├── email.ts                 # Email notification logic
├── push.ts                  # Push notification logic
└── order-notifications.ts   # Order-specific notifications

components/
├── NotificationPreferences.tsx     # User preference UI
└── admin/
    └── NotificationDashboard.tsx   # Admin dashboard

app/api/notifications/
├── route.ts                 # Notification endpoints
├── preferences/route.ts     # Preference management
└── push/
    ├── subscribe/route.ts   # Push subscription
    └── vapid/route.ts       # VAPID key endpoint

app/api/admin/notifications/
├── logs/route.ts            # Notification logs
├── stats/route.ts           # Statistics
└── resend/route.ts          # Resend failed notifications

scripts/
├── test-email-notifications.js    # Email testing
└── test-push-notifications.js     # Push testing

public/
└── sw.js                    # Service worker for push notifications
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy the example env file
   cp .env.example .env.local

   # Add your credentials
   RESEND_API_KEY=re-your-key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key
   ```

3. **Generate VAPID keys** (if needed):
   ```bash
   node scripts/generate-vapid-keys.js
   ```

4. **Run database migrations**:
   ```bash
   npx supabase db push
   ```

5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## Usage

### Sending Notifications

#### Order Confirmation
```typescript
import { notifyOrderConfirmation } from '@/lib/notifications';

await notifyOrderConfirmation(
  userId,
  userEmail,
  userName,
  {
    orderNumber: 'WC-123456',
    totalAmount: '₦15,500',
    paymentMethod: 'Card',
    deliveryAddress: '123 Main St',
    estimatedTime: 30,
    orderTrackingUrl: 'https://wingside.ng/orders/123'
  }
);
```

#### Order Status Update
```typescript
import { onOrderStatusChanged } from '@/lib/notifications/order-notifications';

await onOrderStatusChanged(orderId, 'out_for_delivery');
```

#### Promotion
```typescript
import { sendPromotionToUsers } from '@/lib/notifications/order-notifications';

await sendPromotionToUsers(
  {
    promoTitle: 'Weekend Special! 🔥',
    promoMessage: 'Get 20% off all wings',
    discountCode: 'WINGS20',
    expiryDate: '2026-01-10',
    ctaUrl: 'https://wingside.ng/order',
    ctaText: 'Order Now'
  },
  { userSegment: 'all' }
);
```

### User Preferences

Users can manage their preferences at `/my-account/notifications`:

```typescript
import NotificationPreferences from '@/components/NotificationPreferences';

export default function SettingsPage() {
  return <NotificationPreferences />;
}
```

### Admin Dashboard

Access at `/admin/notifications`:

```typescript
import NotificationDashboard from '@/components/admin/NotificationDashboard';

export default function AdminPage() {
  return <NotificationDashboard />;
}
```

## Testing

### Test Email Notifications
```bash
# Test all email templates
node scripts/test-email-notifications.js all

# Test specific template
node scripts/test-email-notifications.js "order confirmation"
```

### Test Push Notifications
```bash
# List subscriptions
node scripts/test-push-notifications.js list

# Send test notification
node scripts/test-push-notifications.js test
```

## Email Templates

The system includes the following email templates:

1. **order_confirmation** - Sent when an order is placed
2. **order_ready** - Sent when order is ready for pickup/delivery
3. **order_delivered** - Sent when order is delivered
4. **promotion** - Promotional emails
5. **reward_earned** - Reward points notifications
6. **password_reset** - Password reset emails

Templates are stored in the `email_templates` table and can be customized without code changes.

## Push Notification Types

- **order_confirmation**: Order placed successfully
- **order_status**: Status updates (preparing, ready, out for delivery, delivered)
- **promotion**: Special offers and discounts
- **reward**: Points earned and rewards
- **system**: System announcements

## Service Worker

The service worker (`/public/sw.js`) handles:
- PWA functionality and caching
- Push notification display
- Notification click events
- Background sync

Make sure to register it in your app:

```typescript
import { registerSW } from '@/lib/service-worker';

useEffect(() => {
  registerSW();
}, []);
```

## Database Schema

### notification_preferences
Stores user notification preferences for different channels and types.

### email_templates
Contains email templates with HTML and plain text versions.

### notification_logs
Audit log of all notifications sent through the system.

### push_subscriptions
Stores web push subscription data for users.

## API Endpoints

### Public Endpoints
- `GET /api/notifications/push/vapid` - Get VAPID public key
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update user preferences
- `POST /api/notifications/push/subscribe` - Subscribe/unsubscribe from push

### Admin Endpoints
- `GET /api/admin/notifications/logs` - Get notification logs
- `GET /api/admin/notifications/stats` - Get notification statistics
- `POST /api/admin/notifications/resend` - Resend failed notification

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key | Yes |
| `VAPID_PRIVATE_KEY` | VAPID private key | Yes |
| `NEXT_PUBLIC_VAPID_SUBJECT` | VAPID subject email | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Site URL for links | Yes |

## Security Considerations

- **Never commit** private keys or API keys to git
- **Use service role key** only server-side
- **Respect user preferences** before sending notifications
- **Rate limit** notification endpoints to prevent abuse
- **Validate** all user inputs
- **Use HTTPS** for push notifications (required)

## Troubleshooting

### Push Notifications Not Working
- Check browser supports Service Worker and Push API
- Verify VAPID keys are correct
- Ensure user has granted permission
- Check browser console for errors

### Emails Not Sending
- Verify Resend API key
- Check domain is verified in Resend
- Review notification logs for errors
- Ensure email templates exist in database

### High Failure Rate
- Check notification logs for error patterns
- Verify all environment variables are set
- Ensure database migrations are applied
- Check service worker registration

## Performance Tips

- **Batch emails**: Use `sendBatchEmails` for multiple recipients
- **Queue notifications**: For large campaigns, use background jobs
- **Monitor logs**: Regularly check for failed notifications
- **Optimize templates**: Keep email templates lightweight
- **Cache preferences**: Cache user preferences to reduce database queries

## Contributing

When adding new notification types:

1. Add email template to database migration
2. Create helper function in `email.ts` or `push.ts`
3. Add to main `index.ts` exports
4. Update user preferences UI if needed
5. Add tests for the new notification
6. Update documentation

## License

MIT

## Support

For issues or questions:
- Check the documentation: `docs/NOTIFICATIONS_SETUP.md`
- Review notification logs in admin dashboard
- Check browser console for client-side errors
- Review server logs for backend errors
