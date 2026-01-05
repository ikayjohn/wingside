# Environment Variables Setup Guide

This guide explains how to configure environment variables for the Wingside application.

## Quick Setup

### Step 1: Copy the example file

```bash
cp .env.local.example .env.local
```

### Step 2: Add your credentials

Replace the placeholder values with your actual API credentials.

### Step 3: Restart the dev server

```bash
npm run dev
```

---

## 📋 Required Environment Variables

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to get these:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings → API**
4. Copy the URL, anon key, and service role key

---

### Paystack Payment Gateway

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

**Where to get this:**
1. Go to [paystack.co](https://paystack.co)
2. Login to dashboard
3. Go to **Settings → API Keys**
4. Copy the **Secret Key** (use test key for development)

---

### Nomba Payment Gateway ⭐ NEW

```env
NOMBA_CLIENT_ID=2242b79d-f2cf-4ccc-ada1-e890bd1a9f0d
NOMBA_CLIENT_SECRET=JFJ8yq3G4+DvjivJMsji0YkZBkkKdSdjifR+TgT9RLM=
NOMBA_ACCOUNT_ID=01a10aeb-d989-460a-bbde-9842f2b4320f
NOMBA_WEBHOOK_SECRET=optional_webhook_secret
```

**Where to get these:**
1. Go to [nomba.com](https://nomba.com)
2. Login to dashboard
3. Go to **Settings → API Keys**
4. Copy the credentials:
   - **Client ID** - Used for OAuth authentication
   - **Client Secret** - Used for OAuth authentication
   - **Account ID** - Your merchant account ID

**For webhook secret:**
1. Go to **Webhooks** in dashboard
2. Add webhook URL: `https://yourdomain.com/api/payment/nomba/webhook`
3. Copy the webhook secret (if provided)

---

### Embedly Loyalty & Wallet

```env
EMBEDLY_API_KEY=your_api_key
EMBEDLY_MERCHANT_ID=your_merchant_id
```

**Where to get these:**
Contact Embedly support to get your API credentials.

---

### Zoho CRM Integration

```env
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORGANIZATION_ID=your_org_id
```

**Where to get these:**
1. Go to [zoho.com](https://www.zoho.com)
2. Create a CRM app in Developer Console
3. Generate self-client credentials
4. Use OAuth to get refresh token

---

### Next.js Configuration

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Development:** `http://localhost:3000`
**Production:** `https://yourdomain.com`

---

## 🔒 Security Best Practices

### DO:
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use test keys in development
- ✅ Never commit `.env.local` to git

### DON'T:
- ❌ Commit `.env.local` to version control
- ❌ Share your API keys publicly
- ❌ Use production keys in development
- ❌ Hardcode credentials in source code

---

## 🧪 Testing Your Setup

### Test Supabase Connection

```bash
curl http://localhost:3000/api/health
```

### Test Paystack

```bash
# Use test card number from Paystack docs
# Card: 4084 0840 8400 4081
```

### Test Nomba

```bash
# Create a test order and select Nomba payment
# Use Nomba sandbox test cards
```

---

## 🚀 Deployment

### Vercel

1. Go to **Project Settings → Environment Variables**
2. Add each variable with production values
3. Redeploy

### Manual Deployment

Export variables before starting:

```bash
export NEXT_PUBLIC_SUPABASE_URL="..."
export PAYSTACK_SECRET_KEY="..."
# ... etc
npm run build
npm start
```

---

## 🐛 Troubleshooting

### "API key not configured"

**Solution:** Check that the variable is in `.env.local` and restart the dev server.

### "Invalid credentials"

**Solution:**
- Verify you copied the correct key
- Check for extra spaces
- Ensure you're using the right environment (test vs production)

### "Environment variable undefined"

**Solution:**
- Make sure variable name matches exactly (case-sensitive)
- Restart dev server after adding new variables
- Check `.env.local` is in project root

---

## 📝 Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase admin key |
| `PAYSTACK_SECRET_KEY` | ✅ Yes | Paystack secret key |
| `NOMBA_CLIENT_ID` | ✅ Yes | Nomba OAuth client ID |
| `NOMBA_CLIENT_SECRET` | ✅ Yes | Nomba OAuth client secret |
| `NOMBA_ACCOUNT_ID` | ✅ Yes | Nomba merchant account ID |
| `NOMBA_WEBHOOK_SECRET` | ⚠️ Recommended | Webhook signature verification |
| `EMBEDLY_API_KEY` | ✅ Yes | Embedly API key |
| `EMBEDLY_MERCHANT_ID` | ✅ Yes | Embedly merchant ID |
| `ZOHO_CLIENT_ID` | ⚠️ Optional | Zoho OAuth client ID |
| `ZOHO_CLIENT_SECRET` | ⚠️ Optional | Zoho OAuth client secret |
| `ZOHO_REFRESH_TOKEN` | ⚠️ Optional | Zoho OAuth refresh token |
| `ZOHO_ORGANIZATION_ID` | ⚠️ Optional | Zoho CRM organization ID |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Application base URL |

---

## ✅ Setup Checklist

- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add Supabase credentials
- [ ] Add Paystack secret key
- [ ] Add Nomba credentials (Client ID, Secret, Account ID)
- [ ] Add Embedly credentials
- [ ] Add Zoho credentials (if using CRM)
- [ ] Set `NEXT_PUBLIC_APP_URL`
- [ ] Restart dev server
- [ ] Test payment gateways
- [ ] Verify webhook URLs in dashboards

---

## 📞 Need Help?

- **Paystack**: [support.paystack.co](https://support.paystack.co)
- **Nomba**: [developer.nomba.com](https://developer.nomba.com)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

**Important:** Never share your `.env.local` file or commit it to git! 🚨
