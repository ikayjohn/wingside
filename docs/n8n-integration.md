# n8n Integration Guide

This document describes how to connect Wingside to n8n for syncing customer and order data with external services like Embedly and Zoho CRM.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        WINGSIDE                             │
│                                                             │
│  Checkout ──▶ /api/webhooks/notify ──▶ n8n                 │
│  Payment  ──▶ Paystack webhook ──▶ n8n                     │
│                                                             │
│  n8n ──▶ /api/webhooks/n8n ──▶ Sync data back              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │            n8n                │
              │                               │
              │  ──▶ Embedly (wallets/cards) │
              │  ──▶ Zoho CRM (customer data)│
              │  ──▶ Email notifications     │
              │  ──▶ SMS notifications       │
              └───────────────────────────────┘
```

## Environment Variables

Add to your `.env.local`:

```env
# n8n webhook URL (where Wingside sends events TO)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/wingside

# Secret for validating incoming webhooks FROM n8n (optional but recommended)
N8N_WEBHOOK_SECRET=your-secret-key-here
```

---

## Outgoing Webhooks (Wingside → n8n)

These events are sent FROM Wingside TO n8n.

### 1. Customer Created

Triggered when a new account is created during checkout.

**Endpoint:** Your `N8N_WEBHOOK_URL`  
**Method:** POST  
**Payload:**

```json
{
  "event": "customer.created",
  "timestamp": "2024-12-19T14:00:00.000Z",
  "data": {
    "id": "uuid-of-user",
    "email": "customer@example.com",
    "full_name": "John Doe",
    "phone": "+234XXXXXXXXXX"
  }
}
```

### 2. Order Paid

Triggered when payment is confirmed via Paystack webhook.

**Endpoint:** Your `N8N_WEBHOOK_URL`  
**Method:** POST  
**Payload:**

```json
{
  "event": "order.paid",
  "timestamp": "2024-12-19T14:00:00.000Z",
  "data": {
    "id": "order-uuid",
    "order_number": "WS-20241219-ABC123",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "customer_phone": "+234XXXXXXXXXX",
    "total": 15000,
    "items": [
      {
        "product_name": "10 Pcs Wings",
        "quantity": 2,
        "unit_price": 5000,
        "total_price": 10000
      }
    ]
  }
}
```

---

## Incoming Webhooks (n8n → Wingside)

These events are sent FROM n8n TO Wingside to sync data back.

**Endpoint:** `POST /api/webhooks/n8n`  
**Headers:**
```
Content-Type: application/json
x-webhook-secret: your-secret-key-here
```

### 1. Customer Sync

Sync customer data from external source (e.g., in-store registration via Embedly).

**Payload:**

```json
{
  "event": "customer.sync",
  "data": {
    "email": "customer@example.com",
    "full_name": "John Doe",
    "phone": "+234XXXXXXXXXX",
    "embedly_customer_id": "emb_cust_123",
    "embedly_wallet_id": "emb_wallet_456"
  }
}
```

**Response:**

```json
{
  "success": true,
  "action": "created", // or "updated"
  "id": "profile-uuid"
}
```

### 2. Wallet Balance Update

Update customer wallet balance from Embedly.

**Payload:**

```json
{
  "event": "wallet.balance_update",
  "data": {
    "email": "customer@example.com",
    "wallet_balance": 5000.00
  }
}
```

### 3. Order Sync

Sync in-store orders from Embedly POS to Wingside database.

**Payload:**

```json
{
  "event": "order.sync",
  "data": {
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "customer_phone": "+234XXXXXXXXXX",
    "subtotal": 10000,
    "tax": 750,
    "total": 10750,
    "payment_method": "card",
    "source": "in-store",
    "items": [
      {
        "product_name": "10 Pcs Wings",
        "quantity": 1,
        "unit_price": 10000,
        "total_price": 10000
      }
    ]
  }
}
```

---

## n8n Workflow Examples

### Workflow 1: New Customer → Create Embedly Wallet → Update Zoho CRM

1. **Webhook Trigger** - Receive `customer.created` from Wingside
2. **HTTP Request** - Create customer in Embedly API
3. **HTTP Request** - Create wallet in Embedly API
4. **HTTP Request** - POST to Wingside `/api/webhooks/n8n` with `customer.sync` to save Embedly IDs
5. **HTTP Request** - Create/Update contact in Zoho CRM

### Workflow 2: Order Paid → Credit Rewards → Notify

1. **Webhook Trigger** - Receive `order.paid` from Wingside
2. **Calculate** - Calculate reward points (e.g., 10 points per ₦100)
3. **HTTP Request** - Credit points to Embedly wallet
4. **HTTP Request** - Update Wingside via `/api/webhooks/n8n` with `wallet.balance_update`
5. **Email/SMS** - Send order confirmation + points earned

### Workflow 3: In-Store Order → Sync to Website

1. **Webhook Trigger** - Receive from Embedly when in-store order is made
2. **HTTP Request** - POST to Wingside `/api/webhooks/n8n` with `order.sync`
3. **HTTP Request** - Update Zoho CRM with order

---

## Database Schema Updates

Run this SQL in Supabase to add required columns:

```sql
-- Add Embedly integration fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedly_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedly_wallet_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0;

-- Add source field to orders for tracking online vs in-store
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'online';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_customer_id ON profiles(embedly_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_wallet_id ON profiles(embedly_wallet_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
```

---

## Testing

1. Set `N8N_WEBHOOK_URL` to a test endpoint (e.g., webhook.site)
2. Create an account during checkout
3. Verify webhook is received with correct payload
4. Complete a payment and verify `order.paid` event is sent
