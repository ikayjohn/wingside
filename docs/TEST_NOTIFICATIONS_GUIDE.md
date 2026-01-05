# 🧪 Testing Notifications from Admin Dashboard

## Quick Test from Browser

You can now send **real test emails** directly from the admin dashboard!

### Send Test Email

1. Go to: http://localhost:3000/admin/notifications
2. Click **📧 Send Test Email**
3. Enter any email address (defaults to `admin@wingside.ng`)
4. Click OK
5. Wait for the success message
6. Check your inbox!

### Send Test Push Notification

1. Go to: http://localhost:3000/admin/notifications
2. Click **🔔 Send Test Push Notification**
3. Confirm the action
4. All active push subscribers will receive the notification

## What Happens

### Email Test
- Sends a real order confirmation email
- Uses the `order_confirmation` template from database
- Includes dynamic test data
- Logs the notification in `notification_logs` table

### Push Notification Test
- Sends to all users with active push subscriptions
- Shows "Test Notification" with bell emoji
- Links to dashboard when clicked
- Logs the notification in `notification_logs` table

## Features

✅ **Real Email Delivery** via Resend
✅ **Real Push Notifications** via Web Push API
✅ **Any Email Address** - Send to anyone for testing
✅ **Loading Indicators** - Shows "Sending..." while processing
✅ **Success/Error Messages** - Clear feedback
✅ **Audit Trail** - All tests logged in database

## API Endpoint

The Quick Actions use this endpoint:
```
POST /api/admin/notifications/send-test
```

**Body:**
```json
{
  "type": "email" | "push",
  "recipient": "email@example.com" // optional, defaults to admin email
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent to admin@wingside.ng!",
  "messageId": "resend-message-id"
}
```

## Error Handling

If sending fails, you'll see:
- Red error message at the top
- Detailed error description
- Check browser console for more details

Common errors:
- **Resend API key missing** - Check `.env.local`
- **Domain not verified** - Verify domain in Resend dashboard
- **No push subscribers** - Users need to enable push notifications first

## Alternative: Command Line Testing

You can still test from command line:

```bash
# Test email
node scripts/test-email-notifications.js order confirmation

# Test push
node scripts/test-push-notifications.js test
```

## Production Considerations

Before deploying to production:
1. Verify Resend domain is verified
2. Test with real email addresses
3. Check spam folder settings
4. Monitor rate limits (Resend free tier: 100 emails/day)
5. Ensure VAPID keys are production-ready

## Monitoring

Check sent notifications:
- Admin dashboard: `/admin/notifications`
- Database: `notification_logs` table
- Resend dashboard: https://resend.com/dashboard
