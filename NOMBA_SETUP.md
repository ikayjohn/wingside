# Nomba Payment Gateway Integration

This guide explains how to set up and configure the Nomba payment gateway for Wingside.

## Overview

Nomba is a Nigerian payment gateway that supports:
- **Payment Methods**: Visa, Mastercard, Verve, American Express
- **Alternative Payments**: Bank transfer, QR code
- **Features**: Secure checkout, instant notifications, webhook support

## Prerequisites

Before integrating Nomba, you need:

1. **Nomba Account**: Sign up at [nomba.com](https://nomba.com)
2. **Business Verification**: Complete KYB (Know Your Business) verification
3. **API Keys**: Obtain your API credentials from the Nomba dashboard

## Setup Instructions

### Step 1: Get Your Nomba Credentials

1. Log in to your [Nomba Dashboard](https://dashboard.nomba.com)
2. Navigate to **Settings** → **API Keys**
3. Copy the following credentials:
   - **Client ID**
   - **Client Secret**
   - **Account ID**

### Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Nomba Payment Gateway
NOMBA_CLIENT_ID=your_client_id_here
NOMBA_CLIENT_SECRET=your_client_secret_here
NOMBA_ACCOUNT_ID=your_account_id_here
NOMBA_WEBHOOK_SECRET=your_webhook_secret_here  # Optional but recommended
```

### Step 3: Configure Webhook

1. In your Nomba Dashboard, navigate to **Webhooks**
2. Add a new webhook URL: `https://yourdomain.com/api/payment/nomba/webhook`
3. Subscribe to the following events:
   - `payment_success` - Notifies when payment is successful
   - `payment_failed` - Notifies when payment fails
4. Copy the webhook secret (if provided) to your environment variables

### Step 4: Test the Integration

1. **Sandbox Mode**: Nomba provides a sandbox environment for testing
2. **Test Cards**: Use Nomba's test card numbers to simulate payments
3. **Webhook Testing**: Use Nomba's webhook debugger to test webhook handlers

## API Endpoints Created

The integration creates the following API endpoints:

### 1. Initialize Payment
```
POST /api/payment/nomba/initialize
```
Creates a checkout order and returns a checkout URL.

**Request Body:**
```json
{
  "order_id": "uuid",
  "amount": 5000.00,
  "email": "customer@example.com",
  "metadata": {
    "customer_name": "John Doe",
    "phone": "+2348012345678"
  }
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.nomba.com/...",
  "order_reference": "WS-ORD-123456-1234567890"
}
```

### 2. Verify Transaction
```
POST /api/payment/nomba/verify
```
Verifies the status of a payment transaction.

**Request Body:**
```json
{
  "transactionRef": "WEB-ONLINE_C-..."
}
```

**Response:**
```json
{
  "success": true,
  "status": "SUCCESSFUL",
  "amount": 5000.00,
  "reference": "WEB-ONLINE_C-...",
  "order_id": "uuid"
}
```

### 3. Webhook Handler
```
POST /api/payment/nomba/webhook
```
Receives and processes payment notifications from Nomba.

**Events Handled:**
- `payment_success` - Updates order status, syncs to CRM, awards loyalty points
- `payment_failed` - Marks order as failed

## How It Works

### Payment Flow

1. **Customer selects Nomba** at checkout
2. **Order created** in database with `payment_gateway: 'nomba'`
3. **Checkout link generated** via Nomba API
4. **Customer redirected** to Nomba checkout page
5. **Customer completes payment** (card/bank transfer)
6. **Webhook received** confirming payment
7. **Order status updated** to `paid` and `confirmed`
8. **Customer redirected** to order confirmation page

### Callback Handling

After payment, customers are redirected to:
```
/payment/nomba/callback?order_id={uuid}
```

This page:
1. Verifies the payment with Nomba API
2. Updates order status
3. Displays success/failure message
4. Redirects to order confirmation page

## Database Changes

The `orders` table stores:
- `payment_reference`: Nomba order reference
- `payment_gateway`: 'nomba' (identifies which gateway was used)
- `payment_status`: 'pending' | 'paid' | 'failed'
- `paid_at`: Timestamp of successful payment

## Webhook Security

For production use, implement webhook signature verification:

```typescript
const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET
const signature = request.headers.get('x-nomba-signature')

// Verify HMAC signature
const expectedSignature = crypto
  .createHmac('sha512', webhookSecret)
  .update(rawBody)
  .digest('hex')

if (signature !== expectedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

## Testing Checklist

- [ ] Create test order via checkout
- [ ] Select Nomba payment method
- [ ] Complete payment with test card
- [ ] Verify webhook is received
- [ ] Check order status updated to 'paid'
- [ ] Confirm customer redirected correctly
- [ ] Test failed payment scenario
- [ ] Verify webhook handles errors

## Troubleshooting

### Common Issues

**1. "Payment gateway not configured"**
- Check that all environment variables are set
- Verify `.env.local` file is in the project root

**2. "Failed to authenticate"**
- Verify Client ID and Client Secret are correct
- Check that your Nomba account is active

**3. "Webhook not received"**
- Verify webhook URL is correct in Nomba dashboard
- Check your server allows incoming requests from Nomba IPs
- Ensure webhook endpoint returns 200 OK

**4. "Order not found after payment"**
- Check that `payment_reference` is saved correctly
- Verify webhook handler is updating orders table

### Debugging

Enable debug logging by checking server logs:
```bash
# For Next.js development
npm run dev

# Check logs for:
# - "Nomba webhook event: payment_success"
# - "Order {id} payment confirmed via Nomba webhook"
```

## Rate Limits

Nomba API has rate limits:
- **Sandbox**: 100 requests/minute
- **Production**: Depends on your plan

Monitor your usage in the Nomba dashboard.

## Support

- **Nomba Docs**: [developer.nomba.com](https://developer.nomba.com)
- **Nomba Support**: support@nomba.com
- **API Reference**: [developer.nomba.com/docs](https://developer.nomba.com/docs)

## Migration from Paystack

The integration allows you to offer both Paystack and Nomba:

- Customers can choose their preferred payment gateway
- Both gateways use the same order flow
- Webhooks are handled separately for each gateway
- Orders track which gateway was used via `payment_gateway` field

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Rotate keys** regularly (every 90 days)
3. **Use webhook secrets** to verify requests
4. **Monitor transactions** for suspicious activity
5. **Keep SDKs updated** to latest versions
6. **Log errors** but never log sensitive data

## Future Enhancements

Possible improvements:
- [ ] Card tokenization for recurring payments
- [ ] Split payments across multiple gateways
- [ ] Payment method selector based on success rates
- [ ] Automated webhook retry logic
- [ ] Payment analytics dashboard
- [ ] Refund processing via API
