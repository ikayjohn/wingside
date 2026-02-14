# Manual Recovery Checklist - Order WS202602130138

**Customer:** Princewill NSIEGBE
**Email:** prinxwill@gmail.com
**Phone:** +2348037238781
**Order Date:** 2026-02-13 10:11:03
**Missing Data:** Handwritten card message (notes)

---

## ✅ Automated Checks (Run Script First)

```bash
node scripts/comprehensive-order-recovery.js WS202602130138
```

This will automatically check:
- ✓ Database tables (orders, order_items, audit logs)
- ✓ Redis cache
- ✓ Paystack transaction metadata
- ✓ Notification logs

---

## 📋 Manual Dashboard Checks

### 1. Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/[your-project-id]/logs

**Steps:**
1. Go to Logs section
2. Select "Postgres Logs" or "API Logs"
3. Filter date: 2026-02-13
4. Filter time: 10:00 - 10:15 (order created at 10:11:03)
5. Search for: `WS202602130138` OR `INSERT INTO order_items`
6. Look for full INSERT statement with payload
7. Check if notes field is in the INSERT

**What to look for:**
```sql
INSERT INTO order_items (product_name, notes, ...)
VALUES ('Handwritten Card', 'Happy Valentine...', ...)
```

**Screenshot:** If found, take screenshot!

---

### 2. Resend Email Dashboard

**URL:** https://resend.com/emails

**Steps:**
1. Login to Resend dashboard
2. Go to Emails section
3. Filter by:
   - Recipient: `prinxwill@gmail.com`
   - Date: 2026-02-13
4. Find order confirmation email
5. Click to view email details
6. Check "View Source" or "Raw Message"
7. Search for "notes", "handwritten", "message", "card"

**Note:** Current template doesn't include cart items, but check anyway:
- Email may have been customized
- Previous version might have included items
- Check HTML source for hidden data

---

### 3. Paystack Dashboard

**URL:** https://dashboard.paystack.com

**Steps:**
1. Login to Paystack
2. Go to Transactions
3. Filter date: 2026-02-13
4. Search for amount: ₦88,000 (or order total)
5. Or search customer email: prinxwill@gmail.com
6. Click transaction to view details
7. Check "Metadata" section
8. Look for `custom_fields`, `items`, `cart`, or any order data

**What to look for:**
```json
{
  "metadata": {
    "order_number": "WS202602130138",
    "custom_fields": {
      "items": [...],  // Check if exists
      "cart": [...]    // Check if exists
    }
  }
}
```

**Alternative:** Use Paystack API (already checked by script)

---

### 4. Termii SMS Dashboard

**URL:** https://www.termii.com

**Steps:**
1. Login to Termii dashboard
2. Go to Message History or Logs
3. Filter date: 2026-02-13
4. Search for recipient: 08037238781 (without +234)
5. Click message to view full content
6. Check if SMS includes order details

**What to look for:**
- Order confirmation SMS
- May include: order number, items, total
- Unlikely to have notes (SMS is limited), but check

---

### 5. Embedly Dashboard (If Used)

**URL:** [Your Embedly Dashboard URL]

**Steps:**
1. Login to Embedly
2. Check Checkout Wallets or Transactions
3. Filter date: 2026-02-13
4. Look for transaction matching order amount
5. Check transaction metadata/details
6. Look for any order-related data

**Note:** Only if order was paid via Embedly checkout wallet

---

### 6. n8n Workflow Dashboard (If Configured)

**URL:** [Your n8n Instance URL]

**Steps:**
1. Login to n8n
2. Go to Executions
3. Filter date: 2026-02-13 around 10:11 AM
4. Look for order creation workflow
5. Click execution to view details
6. Check webhook payload
7. Look for cart/items data in input

**What to look for:**
```json
{
  "order_number": "WS202602130138",
  "items": [
    {
      "product_name": "Handwritten Card",
      "notes": "..."  // ← This!
    }
  ]
}
```

---

### 7. Hosting/Server Logs

#### If Deployed on Vercel:

**URL:** https://vercel.com/[your-team]/wingside/logs

**Steps:**
1. Go to project logs
2. Filter date/time: 2026-02-13 10:00-10:15
3. Search for: `POST /api/orders`
4. Click log entry to expand
5. Check if request body is logged
6. Look for `console.log` statements that might have logged payload

#### If Deployed on VPS/Hostinger:

**SSH into server:**
```bash
ssh user@server

# Check application logs (PM2)
pm2 logs wingside --lines 5000 --nostream | grep -i "WS202602130138"
pm2 logs wingside --lines 5000 --nostream | grep -i "handwritten"
pm2 logs wingside --lines 5000 --nostream | grep -i "notes"

# Check nginx access logs
sudo grep "POST /api/orders" /var/log/nginx/access.log | grep "2026-02-13"

# Check nginx error logs
sudo grep -i "WS202602130138" /var/log/nginx/error.log

# Check system logs
sudo journalctl -u wingside --since "2026-02-13 10:00:00" --until "2026-02-13 10:15:00"

# Search for any mention
sudo grep -r "WS202602130138" /var/log/
```

---

### 8. Redis Commander (If Accessible)

**URL:** http://[your-server]:8081 (or your Redis GUI)

**Steps:**
1. Connect to Redis instance
2. Search for keys containing:
   - `WS202602130138`
   - `prinxwill@gmail.com`
   - `cart`
   - `order`
3. Check values for matching keys
4. Look for cached order data

**CLI Alternative:**
```bash
redis-cli
> KEYS *WS202602130138*
> KEYS *prinxwill*
> KEYS *cart*
> GET [matching-key]
```

---

### 9. Google Analytics (If Configured)

**URL:** https://analytics.google.com

**Steps:**
1. Login to Google Analytics
2. Select Wingside property
3. Go to Events → All Events
4. Filter date: 2026-02-13
5. Look for:
   - `purchase` event
   - `begin_checkout` event
   - Custom events
6. Check event parameters
7. Look for `items`, `order_id`, or custom dimensions

**What to look for:**
- Event parameters may include order data
- Custom dimensions (if configured)
- Ecommerce data (if ecommerce tracking enabled)

---

### 10. Sentry/Error Tracking (If Configured)

**URL:** https://sentry.io

**Steps:**
1. Login to Sentry
2. Select Wingside project
3. Go to Issues or Events
4. Filter time: 2026-02-13 10:00-10:15
5. Look for any events around order creation
6. Check breadcrumbs and context
7. May show request payload

---

### 11. Zoho CRM (If Integrated)

**URL:** https://crm.zoho.com

**Steps:**
1. Login to Zoho CRM
2. Search for contact: Princewill NSIEGBE or prinxwill@gmail.com
3. Check contact timeline/activities
4. Look for order created on 2026-02-13
5. Check if order details synced
6. May include notes if sync includes full order data

---

### 12. Database Point-in-Time Recovery (Last Resort)

**Supabase:**
1. Go to Database → Backups
2. Check if Point-in-Time Recovery is available
3. **DO NOT RESTORE PRODUCTION!**
4. If available, create a separate branch/clone
5. Restore to timestamp: 2026-02-13 10:11:03
6. Query the restored database for order data

**Note:** This won't help since bug existed before order was placed

---

## 🌐 Customer Browser Sources

### Send This to Customer:

**Subject: Urgent: Retrieve Your Valentine's Order Details**

Hi Princewill,

We need to retrieve the special message for your Valentine's Day order handwritten card.

**Option 1 - Easiest (5 minutes):**
1. Open the **same browser** you used to place your order yesterday
2. Visit: https://www.wingside.ng/check-cart.html
3. Take a screenshot of what appears
4. Send the screenshot to us

**Option 2 - Alternative:**
1. Open the **same browser** used for your order
2. Press **F12** on your keyboard
3. Click the "Application" tab at the top
4. On the left, expand "Local Storage"
5. Click on "https://www.wingside.ng"
6. Find the row with key: **wingside-cart**
7. Copy the entire "Value" column text
8. Send it to us via email or WhatsApp

**Option 3 - Quick Call:**
Just call us and tell us the message you want on the card!

We apologize for the inconvenience and will include a special gift with your order.

Thank you!
Wingside Team

---

## 📊 Results Tracking

| Location | Checked | Found | Notes |
|----------|---------|-------|-------|
| Database (orders table) | ☐ | ☐ | |
| Database (audit logs) | ☐ | ☐ | |
| Redis cache | ☐ | ☐ | |
| Paystack metadata | ☐ | ☐ | |
| Supabase logs | ☐ | ☐ | |
| Resend emails | ☐ | ☐ | |
| Termii SMS | ☐ | ☐ | |
| Server logs (PM2/nginx) | ☐ | ☐ | |
| n8n workflows | ☐ | ☐ | |
| Vercel logs | ☐ | ☐ | |
| Google Analytics | ☐ | ☐ | |
| Sentry errors | ☐ | ☐ | |
| Zoho CRM | ☐ | ☐ | |
| Customer browser | ☐ | ☐ | |

---

## ⚠️ If Nothing Works

### Immediate Actions:
1. **Contact customer NOW:**
   - Call: +2348037238781
   - WhatsApp: Same number
   - Ask for the message directly

2. **Apologize and offer compensation:**
   - Refund ₦3,000 for handwritten card
   - OR give 500 loyalty points (₦500 value)
   - OR 20% discount on next order

3. **Fulfill rest of order:**
   - Prepare Wings/Wine Box
   - Prepare Roses
   - Hold card until message received

### Template Message:

**WhatsApp/Call:**
"Hi Princewill! This is Wingside. We're preparing your Valentine's order right now (Wings, Roses, Card). Unfortunately, due to a system issue, we don't have the message you wanted on the handwritten card. Could you please tell us what you'd like written? We sincerely apologize and will include a special gift with your delivery. Thank you!"

---

## 📝 Documentation

Once resolved, document:
1. Where/how data was recovered (if found)
2. Customer's response
3. Final outcome
4. Lessons learned
5. Update MEMORY.md with any new recovery techniques
