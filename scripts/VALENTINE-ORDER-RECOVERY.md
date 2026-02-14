# Valentine's Order Notes Recovery Guide

## Problem
Valentine's Day orders placed yesterday (Feb 13) may have notes that weren't saved to the database due to a bug (now fixed).

## Quick Commands (Linux/Mac)

### 1. Search PM2 Logs (Most Likely)
```bash
# Search for Valentine orders in PM2 logs
pm2 logs --lines 2000 --nostream | grep -i "valentine\|handwritten\|notes" | less

# Search for specific order number
pm2 logs --lines 2000 --nostream | grep -i "WS123456789"
```

### 2. Search Nginx Logs
```bash
# Search access logs
sudo grep -i "POST /api/orders" /var/log/nginx/access.log | grep "2026-02-13"

# Search for specific order
sudo grep -i "WS123456789" /var/log/nginx/*.log
```

### 3. Use the Automated Scripts

**Node.js Script (Works on Windows/Linux/Mac):**
```bash
cd /var/www/wingside/scripts
node parse-valentine-orders.js WS123456789
```

**Bash Script (Linux/Mac only):**
```bash
cd /var/www/wingside/scripts
chmod +x parse-valentine-orders.sh
./parse-valentine-orders.sh auto WS123456789
```

## Quick Grep Commands

### Search all logs for Valentine orders
```bash
# Search for notes field in logs
grep -r "notes.*handwritten\|notes.*valentine" /var/log/ 2>/dev/null

# Search PM2 logs specifically
grep -i "order_items\|orderItems" ~/.pm2/logs/*.log | grep -i "notes"

# Search for orders on Feb 13-14
grep -r "2026-02-1[34]" /var/log/ | grep -i "order\|valentine"
```

### Extract JSON from logs (if found)
```bash
# If you find a log line with JSON, extract it:
grep "WS123456789" /var/log/nginx/access.log | \
  grep -o '{.*}' | \
  python3 -m json.tool

# Or with jq (if installed):
grep "WS123456789" /var/log/nginx/access.log | \
  grep -o '{.*}' | \
  jq '.'
```

## What to Look For

When searching logs, look for these patterns:

```json
{
  "items": [
    {
      "product_name": "Valentine Package",
      "notes": "Happy Valentine's Day! Love you!",  // ← This is what we need
      "delivery_date": "2026-02-14",
      "delivery_time": "2PM - 4PM"
    }
  ]
}
```

## If Logs Don't Have the Data

### Ask Customer for Browser Data

Send this to the customer:

---

**Subject: Request: Order Details Recovery**

Hi [Customer Name],

We need to retrieve the special note you entered for your Valentine's Day order (Order #WS123456789).

Could you please help us by checking your browser's saved data?

**Steps:**
1. Open the **same browser** you used to place the order
2. Go to: https://www.wingside.ng
3. Press **F12** on your keyboard (or right-click → Inspect)
4. Click on the **Application** tab at the top
5. On the left side, expand **Local Storage**
6. Click on **https://www.wingside.ng**
7. Find the row with key: **wingside-cart**
8. Copy the **entire value** (the long text)
9. Reply to this email with that text

This will help us recover your special message!

Thank you,
Wingside Team

---

## Parse Customer's Browser Data

If customer sends their localStorage data:

```javascript
// Save their data to a file: customer-cart.json
// Then parse it:

const cartData = require('./customer-cart.json');
console.log('Cart Items with Notes:');
cartData.forEach((item, index) => {
  if (item.notes) {
    console.log(`\nItem ${index + 1}: ${item.name}`);
    console.log(`Note: ${item.notes}`);
    console.log(`Delivery Date: ${item.deliveryDate}`);
    console.log(`Delivery Time: ${item.deliveryTime}`);
  }
});
```

## Check Database (After Migration)

If you've already run the migration but want to check:

```sql
SELECT
  o.order_number,
  o.customer_name,
  o.customer_email,
  oi.product_name,
  oi.notes,
  oi.delivery_date,
  oi.delivery_time,
  o.created_at
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= '2026-02-13'
  AND (
    oi.notes IS NOT NULL
    OR oi.delivery_date = '2026-02-14'
  )
ORDER BY o.created_at DESC;
```

**Note:** Orders placed BEFORE today won't have notes in the database (they were never saved due to the bug).

## Prevention

The bug is now fixed. All future orders will save:
- ✅ Item-level notes
- ✅ Delivery dates
- ✅ Delivery time slots

These are now visible in `/admin/orders` page.
