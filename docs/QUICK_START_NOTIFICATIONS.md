# Quick Start Guide: Notification System

This guide will help you set up and test the Wingside notification system in 10 minutes.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies ✅
```bash
npm install
```
Already done! Dependencies installed.

### Step 2: Add Environment Variables

Copy the VAPID keys to your `.env.local` file:

```bash
# Add these lines to your .env.local file:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG4d5U2zRTKYpMVagfpWx6PTKPcaU4ROd8pJUbUlexJsLI-heCwlnL7HLmmGVWi_fUtBXd9q4hYh3dy9N5HRFR8
VAPID_PRIVATE_KEY=CqQw2g2dPo9K_haTgUYhhJlAA80LOxbYEDSq0rHVbwU
NEXT_PUBLIC_VAPID_SUBJECT=mailto:admin@wingside.ng

# Add your Resend API key (get it from https://resend.com/api-keys)
RESEND_API_KEY=re_your_api_key_here
```

### Step 3: Apply Database Migration

The SQL editor is open in your browser. Follow these steps:

1. In the Supabase SQL editor, copy and paste the contents of:
   ```
   supabase/migrations/20250105_notifications_system.sql
   ```

2. Click "Run" to execute the migration

3. Verify tables were created by running:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name IN (
     'notification_preferences',
     'email_templates',
     'notification_logs',
     'push_subscriptions'
   );
   ```
   Should return 4 tables.

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Testing (5 minutes)

### Test 1: Verify Environment Setup

Visit: http://localhost:3000/api/notifications/push/vapid

Should return:
```json
{
  "publicKey": "BG4d5U2zRTKYpMVagfpWx6PTKPcaU4ROd8pJUbUlexJsLI-heCwlnL7HLmmGVWi_fUtBXd9q4hYh3dy9N5HRFR8"
}
```

### Test 2: Check Notification Preferences Page

1. Go to: http://localhost:3000/my-account/notifications
2. You should see the notification preferences UI
3. Try toggling email notifications on/off
4. Save preferences

### Test 3: Test Email Notifications

**Before running, update the test email in the script:**

Edit `scripts/test-email-notifications.js`, line 9:
```javascript
to: 'your-email@example.com', // Change this to your email
```

Then run:
```bash
node scripts/test-email-notifications.js order confirmation
```

Check your inbox! You should receive an order confirmation email.

### Test 4: Test Push Notifications (Optional)

1. Open: http://localhost:3000/my-account/notifications
2. Click the "Push Notifications" toggle
3. Grant permission when browser prompts
4. Check browser console for subscription success

To send a test push:
```bash
node scripts/test-push-notifications.js test
```

## 🎯 What's Working

Now you have:

✅ **Email Notifications**
- Order confirmations
- Order status updates
- Promotional emails
- Reward notifications
- Password resets

✅ **Push Notifications**
- Order status updates
- Promotional push messages
- Reward notifications
- Service worker installed

✅ **User Preferences**
- Users can control notification types
- Granular email/push/SMS settings
- Preference UI at `/my-account/notifications`

✅ **Admin Dashboard**
- View notification logs at `/admin/notifications`
- Track success/failure rates
- Resend failed notifications

## 📱 User Flow

### For Customers:
1. User logs in → Dashboard
2. Clicks notification bell → See notifications
3. Clicks "⚙️ Notification Settings" → Configure preferences
4. Places order → Receives email confirmation
5. Order status updates → Receives push notification
6. Order delivered → Receives reward email

### For Admins:
1. Admin logs in → `/admin/notifications`
2. Views notification stats and logs
3. Filters by type (email, push, failed)
4. Resends failed notifications if needed
5. Creates promotional campaigns

## 🔗 Integration Points

### With Order System

When an order is created:
```typescript
import { onOrderCreated } from '@/lib/notifications/order-notifications';

// After creating order
await onOrderCreated(orderId);
```

When order status changes:
```typescript
import { onOrderStatusChanged } from '@/lib/notifications/order-notifications';

// After updating status
await onOrderStatusChanged(orderId, 'out_for_delivery');
```

### Send Promotional Campaign

```typescript
import { sendPromotionToUsers } from '@/lib/notifications/order-notifications';

await sendPromotionToUsers({
  promoTitle: 'Weekend Special! 🔥',
  promoMessage: 'Get 20% off all wings this weekend',
  discountCode: 'WINGS20',
  expiryDate: '2026-01-10',
  ctaUrl: 'https://wingside.ng/order',
  ctaText: 'Order Now'
}, { userSegment: 'all' });
```

## 🐛 Troubleshooting

### "VAPID public key not configured"
- Make sure you added the VAPID keys to `.env.local`
- Restart the dev server after adding keys

### "Template not found" error
- Database migration wasn't applied
- Check Supabase dashboard > Database > Tables
- Verify `email_templates` table has data

### Emails not sending
- Check `RESEND_API_KEY` is correct
- Verify domain is verified in Resend dashboard
- Check browser console for errors

### Push notifications not working
- Must use HTTPS or localhost
- Check browser supports Service Worker
- Grant notification permission
- Check browser console for subscription errors

### Migration failed
- Tables might already exist (that's OK!)
- Verify tables have correct structure
- Check Supabase migration history

## 📚 Next Steps

1. **Configure Resend**: Sign up at https://resend.com/
   - Verify your domain
   - Create API key
   - Add to `.env.local`

2. **Test with Real Orders**: Place a test order and verify:
   - Order confirmation email received
   - Status update notifications work

3. **Customize Email Templates**: Edit templates in Supabase:
   - Go to Database > email_templates
   - Update HTML/content as needed

4. **Set Up Admin Access**: Ensure admin role can access:
   - `/admin/notifications`
   - View logs and stats

5. **Monitor Performance**: Check notification logs regularly:
   - Success rates
   - Failure patterns
   - User engagement

## 🎉 Success Criteria

You'll know everything is working when:

- ✅ Can view notification preferences page
- ✅ Can toggle email notifications on/off
- ✅ Can subscribe to push notifications
- ✅ Receive test email in inbox
- ✅ Can view admin notification dashboard
- ✅ See notification logs in database
- ✅ Service worker is registered (check console)

## 📞 Need Help?

- Check documentation: `docs/NOTIFICATIONS_SETUP.md`
- Check system README: `lib/notifications/README.md`
- Review test scripts in `scripts/`
- Check browser console for errors
- Review Supabase logs

---

**Estimated Time to Complete**: 10 minutes
**Difficulty Level**: Easy
**Status**: Ready to use! 🚀
