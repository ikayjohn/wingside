# Nomba Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Get Credentials
1. Login to [Nomba Dashboard](https://dashboard.nomba.com)
2. Go to **Settings → API Keys**
3. Copy: Client ID, Client Secret, Account ID

### 2. Add to `.env.local`
```env
NOMBA_CLIENT_ID=your_client_id
NOMBA_CLIENT_SECRET=your_client_secret
NOMBA_ACCOUNT_ID=your_account_id
```

### 3. Configure Webhook
In Nomba Dashboard, add webhook URL:
```
https://yourdomain.com/api/payment/nomba/webhook
```
Subscribe to: `payment_success`

### 4. Test It!
- Go to checkout
- Select "Pay with Nomba"
- Complete payment
- Order should be confirmed automatically ✅

## 📁 Files Created

```
app/api/payment/nomba/
├── initialize/route.ts    # Creates checkout, returns payment URL
├── verify/route.ts        # Verifies transaction status
└── webhook/route.ts       # Handles payment notifications

app/payment/nomba/
└── callback/page.tsx      # Customer redirect after payment

app/checkout/page.tsx      # Updated with Nomba option
```

## 🔧 How It Works

```
Customer Checkout
    ↓
Selects "Pay with Nomba"
    ↓
POST /api/payment/nomba/initialize
    ↓
Returns checkout URL
    ↓
Customer pays on Nomba
    ↓
Nomba sends webhook
    ↓
Order marked as paid ✅
    ↓
Customer redirected to confirmation
```

## 🎯 API Endpoints

### Initialize Payment
```bash
POST /api/payment/nomba/initialize
{
  "order_id": "123",
  "amount": 5000,
  "email": "user@example.com"
}
→ Returns checkout URL
```

### Verify Payment
```bash
POST /api/payment/nomba/verify
{
  "transactionRef": "WEB-ONLINE_C-..."
}
→ Returns payment status
```

### Webhook
```bash
POST /api/payment/nomba/webhook
→ Receives payment_success event
→ Updates order status
→ Awards loyalty points
→ Syncs to CRM
```

## 🔐 Security

- ✅ OAuth2 authentication
- ✅ Access tokens (auto-refresh)
- ⚠️ Webhook signature verification (recommended for production)

## 🎨 UI Changes

Checkout page now shows:
- **Pay with Card (Paystack)** - Default option
- **Pay with Nomba** - New option with badge
- **Pay with Wallet** - If user has wallet
- **Split Payment** - If wallet has insufficient balance

## 🧪 Testing

### Test Flow
1. Add items to cart
2. Proceed to checkout
3. Fill delivery details
4. Select "Pay with Nomba"
5. Click "Place Order"
6. Redirected to Nomba checkout
7. Complete test payment
8. Redirected back to site
9. Order confirmed ✅

### Test Cards (Sandbox)
Check Nomba docs for sandbox test cards.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Payment gateway not configured" | Add NOMBA_* env vars |
| "Failed to authenticate" | Check Client ID/Secret |
| Webhook not received | Verify URL in dashboard |
| Order not updating | Check server logs |

## 📊 Payment Flow Comparison

| Feature | Paystack | Nomba |
|---------|----------|-------|
| Card Payments | ✅ | ✅ |
| Bank Transfer | ✅ | ✅ |
| Webhooks | ✅ | ✅ |
| QR Code | ❌ | ✅ |
| Tokenization | ✅ | ✅ |

## 🔄 Switching Between Gateways

No code changes needed! Customers can choose at checkout:
- Both gateways use same order flow
- Webhooks handled independently
- Order tracks which gateway used

## 📞 Support

- **Nomba Docs**: [developer.nomba.com](https://developer.nomba.com)
- **Nomba Support**: support@nomba.com
- **Integration Guide**: See `NOMBA_SETUP.md`

## ✨ Next Steps

1. ✅ Integration complete
2. 🧪 Test in sandbox
3. 🔐 Add webhook signature verification
4. 🚀 Deploy to production
5. 📊 Monitor payment success rates

## 🎉 You're Done!

Your Wingside store now accepts payments via Nomba! 🚀
