# Email Notifications Setup Guide

This document explains how email notifications are configured and how to set them up for the Wingside application.

## Overview

The Wingside app uses **Resend** for sending transactional emails. Email notifications are sent for:

1. **Contact Form Submissions** - Admin receives notification when someone submits the contact form
2. **Order Confirmations** - Customer receives order confirmation email with order details
3. **Payment Confirmations** - Customer receives payment confirmation email after successful payment
4. **Order Notifications** - Admin receives notification when a new order is placed

## Prerequisites

### 1. Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Verify your email address
3. Get your API key from [dashboard.resend.com/api-keys](https://dashboard.resend.com/api-keys)

### 2. Domain Configuration (Recommended)

For production use, configure your custom domain:

1. Go to [dashboard.resend.com/domains](https://dashboard.resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `wingside.ng`)
4. Add the DNS records to your domain provider
5. Wait for DNS verification

**Without domain configuration**, emails will be sent from `@resend.dev` addresses (limited to 3 emails per day).

## Environment Variables

Add the following to your `.env.local` file:

```env
# Resend API Key (already configured)
RESEND_API_KEY=re_RWJWK4Tx_JTLqoyZfLf658amFegn5RrhG

# From email address
FROM_EMAIL=Wingside <noreply@wingside.ng>

# Admin email (receives contact forms and order notifications)
ADMIN_EMAIL=reachus@wingside.ng

# App URL (for links in emails)
NEXT_PUBLIC_APP_URL=https://www.wingside.ng
```

## Email Templates

All email templates are located in `lib/emails/service.ts`:

### Contact Form Notification

**Function:** `sendContactNotification()`

**Sent to:** Admin (`ADMIN_EMAIL`)

**Contains:**
- Submission type (Catering, Office Lunch, Sports Community, etc.)
- Contact information (name, email, phone, company)
- Message and additional form data

**Template style:** Yellow header (#F7C400), dark brown text (#552627)

### Order Confirmation

**Function:** `sendOrderConfirmation()`

**Sent to:** Customer

**Contains:**
- Order number (formatted as `WSXXXXX`)
- Order status badge
- Order items (product name, size, flavors, quantities, prices)
- Price breakdown (subtotal, delivery fee, tax, total)
- Delivery address
- Track order button

**Template style:** Yellow header, order items in cards, prominent total display

### Payment Confirmation

**Function:** `sendPaymentConfirmation()`

**Sent to:** Customer

**Contains:**
- Success checkmark
- Order number
- Payment amount (large, prominent)
- Payment method
- Transaction reference
- Confirmation date/time

**Template style:** Green success badge, large amount display, clean details

### Order Notification (Admin)

**Function:** `sendOrderNotification()`

**Sent to:** Admin (`ADMIN_EMAIL`)

**Contains:**
- Order number
- Total amount
- Customer information (name, email, phone)
- Delivery address
- Order items summary
- Payment method
- Link to view order in admin

**Template style:** Dark brown header (#552627), yellow text, grid layout for customer info

## Email Sending Logic

### Error Handling

Email sending is **non-blocking** - if an email fails to send, the operation still succeeds:

```typescript
try {
  const emailResult = await sendOrderConfirmation({...});
  if (!emailResult.success) {
    console.error('Failed to send email:', emailResult.error);
    // Don't fail the request
  }
} catch (emailError) {
  console.error('Error sending email:', emailError);
  // Don't fail the request
}
```

This ensures that:
- Orders still complete even if emails fail
- Payment verification still succeeds even if confirmation email fails
- Contact forms still save to database even if notification fails

### Logging

All email sends are logged to console:
- Success: `console.log('Email sent successfully:', data)`
- Failure: `console.error('Failed to send email:', error)`

Check your server logs for email delivery status.

## Integration Points

### 1. Contact Forms

**Route:** `app/api/contact/route.ts`

```typescript
import { sendContactNotification } from '@/lib/emails/service';

// After saving to database
await sendContactNotification({
  type: 'sports-community',
  name,
  email,
  phone,
  company,
  message,
  formData,
});
```

### 2. Order Creation

**Route:** `app/api/orders/route.ts`

```typescript
import { sendOrderConfirmation, sendOrderNotification } from '@/lib/emails/service';

// After creating order
await sendOrderConfirmation({
  orderNumber: order.order_number,
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  items: orderItems,
  subtotal,
  deliveryFee,
  tax,
  total,
  deliveryAddress,
  status,
});

await sendOrderNotification({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  total,
  deliveryAddress,
  paymentMethod,
});
```

### 3. Payment Verification (Paystack)

**Route:** `app/api/payment/verify/route.ts`

```typescript
import { sendPaymentConfirmation } from '@/lib/emails/service';

// After verifying payment
await sendPaymentConfirmation({
  orderNumber: order.order_number,
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  amount: paymentAmount,
  paymentMethod: 'paystack',
  transactionReference: reference,
});
```

### 4. Payment Verification (Nomba)

**Route:** `app/api/payment/nomba/verify/route.ts`

```typescript
import { sendPaymentConfirmation } from '@/lib/emails/service';

// After verifying payment
await sendPaymentConfirmation({
  orderNumber: order.order_number,
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  amount: transaction.amount,
  paymentMethod: 'nomba',
  transactionReference: transactionRef,
});
```

## Testing Email Functionality

### Test Script

Run the test script to verify email sending:

```bash
node scripts/test-email-sending.js
```

This will send test emails to verify your configuration.

### Manual Testing

1. **Contact Form:**
   - Go to `/sports` page
   - Fill out the "Join the Wingside Sports Community" form
   - Submit and check admin email

2. **Order Confirmation:**
   - Place an order through the checkout flow
   - Check customer email for order confirmation
   - Check admin email for order notification

3. **Payment Confirmation:**
   - Complete a payment
   - Check customer email for payment confirmation

## Troubleshooting

### Emails Not Sending

1. **Check API Key:**
   ```bash
   echo $RESEND_API_KEY
   ```
   Ensure it's set and valid

2. **Check Logs:**
   ```bash
   npm run dev
   # Look for email-related console output
   ```

3. **Verify Domain:**
   - Go to Resend dashboard
   - Check domain status
   - Ensure DNS records are correct

4. **Test API:**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "Wingside <noreply@wingside.ng>",
       "to": "your-email@example.com",
       "subject": "Test Email",
       "html": "<p>This is a test email</p>"
     }'
   ```

### Email Going to Spam

1. **Verify SPF/DKIM records** in your DNS
2. **Check domain reputation** at [MXToolbox](https://mxtoolbox.com)
3. **Ensure FROM_EMAIL matches verified domain**
4. **Avoid spam trigger words** in subject lines

### Rate Limiting

Resend free tier: 3,000 emails per month
Resend pro tier: 50,000 emails per month

If you exceed limits:
- Check usage at [dashboard.resend.com](https://dashboard.resend.com)
- Upgrade plan if needed
- Implement batching for bulk emails

## Adding New Email Types

To add a new email type:

1. **Create function in `lib/emails/service.ts`:**

```typescript
export async function sendNewEmailType(data: {
  // Define your parameters
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* Your CSS styles */
        </style>
      </head>
      <body>
        <!-- Your email template -->
      </body>
    </html>
  `;

  return sendEmail({
    to: data.recipientEmail,
    subject: 'Your Subject',
    html,
  });
}
```

2. **Import and use in your API route:**

```typescript
import { sendNewEmailType } from '@/lib/emails/service';

await sendNewEmailType({
  recipientEmail: 'user@example.com',
  // other parameters
});
```

## Best Practices

1. **Always use non-blocking email sends** - Don't fail the main operation if email fails
2. **Log all email attempts** - Success and failures
3. **Use environment variables** - Never hardcode credentials
4. **Test before production** - Use test email addresses
5. **Monitor deliverability** - Check bounce and complaint rates
6. **Keep templates branded** - Use consistent colors (#F7C400, #552627)
7. **Make emails responsive** - Mobile-friendly templates
8. **Include plain text fallback** - For email clients that don't support HTML

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://github.com/resend/resend-node)
- [Email HTML Best Practices](https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/)
- [Email Template Design](https://www.emailonacid.com/blog/article/email-marketing/designing-html-emails/)
