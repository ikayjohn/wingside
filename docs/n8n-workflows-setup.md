# n8n Workflows Setup Guide

This guide shows how to set up n8n workflows for syncing Wingside with Zoho CRM and Embedly.ng.

## Prerequisites

1. n8n hosted on Hostinger (your setup)
2. Zoho CRM account with API access
3. Embedly.ng account with API credentials
4. Wingside webhook endpoints ready

---

## Step 1: Get Your Credentials

### Zoho CRM API
1. Go to https://api-console.zoho.com/
2. Create a **Self Client** application
3. Generate tokens with scopes: `ZohoCRM.modules.ALL`, `ZohoCRM.users.READ`
4. Note down: **Client ID**, **Client Secret**, **Refresh Token**

### Embedly.ng API
1. Log in to Embedly dashboard
2. Go to Profile Settings → API Credentials
3. Note down: **API Key**, **Organization ID**

### Wingside Webhook
1. Add to your `.env.local`:
   ```
   N8N_WEBHOOK_URL=https://your-n8n-hostinger-url.com/webhook/wingside
   N8N_WEBHOOK_SECRET=create-a-random-secret
   ```

---

## Workflow 1: New Customer → Zoho CRM + Embedly

**Trigger:** Customer creates account on Wingside  
**Actions:** Create contact in Zoho CRM, Create wallet in Embedly

### n8n Setup:

```
[Webhook] → [Zoho CRM: Create Contact] → [Embedly: Create Customer] → [Embedly: Create Wallet] → [HTTP Request: Update Wingside]
```

### Node 1: Webhook (Trigger)
- **Authentication:** None
- **HTTP Method:** POST
- **Path:** `wingside` (URL will be: `https://your-n8n.com/webhook/wingside`)

### Node 2: Zoho CRM - Create Contact
- **Resource:** Contact
- **Operation:** Create
- **Fields:**
  - Email: `{{ $json.data.email }}`
  - First Name: `{{ $json.data.full_name.split(' ')[0] }}`
  - Last Name: `{{ $json.data.full_name.split(' ').slice(1).join(' ') }}`
  - Phone: `{{ $json.data.phone }}`

### Node 3: HTTP Request - Create Embedly Customer
- **Method:** POST
- **URL:** `https://waas-prod.embedly.ng/api/v1/customer`
- **Headers:**
  - `x-api-key`: Your Embedly API key
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "email": "{{ $('Webhook').item.json.data.email }}",
  "firstName": "{{ $('Webhook').item.json.data.full_name.split(' ')[0] }}",
  "lastName": "{{ $('Webhook').item.json.data.full_name.split(' ').slice(1).join(' ') }}",
  "phone": "{{ $('Webhook').item.json.data.phone }}"
}
```

### Node 4: HTTP Request - Create Embedly Wallet
- **Method:** POST
- **URL:** `https://waas-prod.embedly.ng/api/v1/wallet`
- **Headers:**
  - `x-api-key`: Your Embedly API key
- **Body (JSON):**
```json
{
  "customerId": "{{ $json.data.id }}",
  "currency": "NGN"
}
```

### Node 5: HTTP Request - Update Wingside with Embedly IDs
- **Method:** POST
- **URL:** `https://your-wingside-site.com/api/webhooks/n8n`
- **Headers:**
  - `x-webhook-secret`: Your secret
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "event": "customer.sync",
  "data": {
    "email": "{{ $('Webhook').item.json.data.email }}",
    "embedly_customer_id": "{{ $('HTTP Request - Create Embedly Customer').item.json.data.id }}",
    "embedly_wallet_id": "{{ $('HTTP Request - Create Embedly Wallet').item.json.data.id }}"
  }
}
```

---

## Workflow 2: Order Paid → Credit Rewards + Update Zoho

**Trigger:** Payment confirmed on Wingside  
**Actions:** Credit loyalty points to Embedly wallet, Update Zoho with order

### n8n Setup:

```
[Webhook] → [Calculate Points] → [Embedly: Credit Wallet] → [Zoho CRM: Create Note] → [HTTP Request: Update Balance]
```

### Node 1: Webhook (Trigger)
- Same as Workflow 1, filter by `{{ $json.event === 'order.paid' }}`

### Node 2: Code Node - Calculate Points
- **Mode:** Run Once for Each Item
- **Code:**
```javascript
// 10 points per ₦100 spent
const total = $input.item.json.data.total;
const points = Math.floor(total / 10);

return {
  ...items[0].json,
  points_earned: points
};
```

### Node 3: HTTP Request - Credit Embedly Wallet
- **Method:** POST
- **URL:** `https://waas-prod.embedly.ng/api/v1/wallet/credit`
- **Headers:**
  - `x-api-key`: Your Embedly API key
- **Body:**
```json
{
  "walletId": "{{ customer_wallet_id }}",
  "amount": "{{ $json.points_earned }}",
  "description": "Points from order {{ $json.data.order_number }}"
}
```

### Node 4: Zoho CRM - Add Note to Contact
- **Resource:** Note
- **Operation:** Create
- **Note Title:** `Order {{ $json.data.order_number }}`
- **Note Content:** `Order total: ₦{{ $json.data.total }}, Points earned: {{ $json.points_earned }}`

### Node 5: HTTP Request - Update Wingside Balance
- **Method:** POST
- **URL:** `https://your-wingside-site.com/api/webhooks/n8n`
- **Headers:**
  - `x-webhook-secret`: Your secret
- **Body:**
```json
{
  "event": "wallet.balance_update",
  "data": {
    "email": "{{ $json.data.customer_email }}",
    "wallet_balance": "{{ new_balance_from_embedly }}"
  }
}
```

---

## Workflow 3: Zoho CRM → Wingside (Bi-directional Sync)

**Trigger:** Contact updated in Zoho CRM  
**Action:** Update customer in Wingside

### Option A: Zoho Webhook (if available)
1. In Zoho CRM → Settings → Automation → Webhooks
2. Create webhook pointing to your n8n

### Option B: Scheduled Sync
Use **Schedule Trigger** node to poll Zoho every hour:

```
[Schedule Trigger] → [Zoho: Get Modified Contacts] → [Loop] → [HTTP Request: Sync to Wingside]
```

### Node 1: Schedule Trigger
- **Interval:** Every 1 hour

### Node 2: Zoho CRM - Get Contacts
- **Resource:** Contact
- **Operation:** Get Many
- **Options:** Modified after last sync time

### Node 3: HTTP Request - Sync Each to Wingside
- **Method:** POST
- **URL:** `https://your-wingside-site.com/api/webhooks/n8n`
- **Body:**
```json
{
  "event": "customer.sync",
  "data": {
    "email": "{{ $json.Email }}",
    "full_name": "{{ $json.First_Name }} {{ $json.Last_Name }}",
    "phone": "{{ $json.Phone }}"
  }
}
```

---

## Workflow 4: In-Store Order (Embedly) → Wingside

**Trigger:** Order made via Embedly POS in-store  
**Action:** Sync order to Wingside database

### Option A: Embedly Webhook
If Embedly supports webhooks, configure them to call your n8n:

```
[Webhook from Embedly] → [Transform Data] → [HTTP Request: Sync to Wingside]
```

### Node: HTTP Request - Sync Order
- **Method:** POST  
- **URL:** `https://your-wingside-site.com/api/webhooks/n8n`
- **Body:**
```json
{
  "event": "order.sync",
  "data": {
    "customer_email": "{{ $json.customer.email }}",
    "customer_name": "{{ $json.customer.name }}",
    "customer_phone": "{{ $json.customer.phone }}",
    "subtotal": "{{ $json.subtotal }}",
    "tax": "{{ $json.tax }}",
    "total": "{{ $json.total }}",
    "payment_method": "card",
    "source": "in-store",
    "items": "{{ $json.items }}"
  }
}
```

---

## Testing Your Workflows

1. **Activate** the workflow in n8n
2. Use **Test URL** first (shown in Webhook node)
3. Create a test customer on Wingside checkout
4. Check n8n execution log
5. Verify data in Zoho CRM and Embedly dashboard
6. Switch to **Production URL** when ready

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving | Check n8n is running, workflow is active |
| Zoho auth error | Refresh token may have expired, regenerate |
| Embedly 401 error | Check API key is correct |
| Wingside 401 error | Check `x-webhook-secret` header matches `.env` |

---

## Environment Variables Summary

```env
# Wingside .env.local
N8N_WEBHOOK_URL=https://your-n8n-hostinger.com/webhook/wingside
N8N_WEBHOOK_SECRET=your-random-secret-here
```

Your n8n Hostinger URL format is likely:
```
https://n8n.yourdomain.com/webhook/wingside
```
or
```
https://yourdomain.com:5678/webhook/wingside
```

Check your Hostinger n8n setup for the exact URL.
