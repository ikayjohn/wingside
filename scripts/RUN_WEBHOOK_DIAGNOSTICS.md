# How to Run Webhook Diagnostics

This guide will help you diagnose and fix why Nomba webhooks aren't reaching your server.

## What This Script Does

The `diagnose-and-fix-webhooks.sh` script will:
1. ✅ Check if DNS points to correct server IP
2. ✅ Verify Nginx is listening on public interface
3. ✅ Test webhook endpoint locally
4. ✅ Check firewall rules (UFW, iptables)
5. ✅ Verify SSL certificate
6. ✅ Search Nginx logs for webhook requests
7. ✅ Deploy latest code with verbose logging
8. ✅ Process all 4 stuck paid orders automatically
9. ✅ Provide actionable recommendations

## Quick Start (3 Steps)

### Step 1: Upload Script to Server

**Option A - Using Git (Recommended):**
```bash
# On your server via SSH:
cd /var/www/wingside
git pull origin main
```

**Option B - Using SCP from Windows:**
```powershell
# From your local Windows machine:
scp C:\Users\ikayj\Documents\wingside\scripts\diagnose-and-fix-webhooks.sh root@YOUR_SERVER_IP:/var/www/wingside/scripts/
```

**Option C - Using Hostinger File Manager:**
1. Open Hostinger control panel
2. Go to File Manager
3. Navigate to `/var/www/wingside/scripts/`
4. Upload `diagnose-and-fix-webhooks.sh`

### Step 2: Make Script Executable & Run

SSH into your server and run:

```bash
# Navigate to scripts directory
cd /var/www/wingside/scripts

# Make script executable
chmod +x diagnose-and-fix-webhooks.sh

# Run the diagnostic script
sudo ./diagnose-and-fix-webhooks.sh
```

### Step 3: Monitor Logs & Test

After the script finishes:

```bash
# Open a new terminal and watch logs in real-time
pm2 logs wingside --lines 0

# In another terminal, make a test payment (₦100)
# You should see "🚨 WEBHOOK ENDPOINT HIT!" within 5 seconds
```

## What to Look For in Output

### ✅ GOOD - DNS Match
```
Server's public IP address:
  → 123.45.67.89

DNS resolution for www.wingside.ng:
  → 123.45.67.89

✅ DNS correctly points to this server
```

### ❌ BAD - DNS Mismatch
```
❌ DNS MISMATCH! www.wingside.ng resolves to 1.2.3.4 but server IP is 5.6.7.8
   → This is likely why webhooks aren't reaching the server!
```

**Fix:** Update your DNS A record to point to the correct IP address.

### ✅ GOOD - Nginx Listening on Public Interface
```
✅ Nginx listening on public interface (port 443)
tcp  0  0.0.0.0:443  0.0.0.0:*  LISTEN  1234/nginx
```

### ❌ BAD - Nginx Only on Localhost
```
⚠️  Nginx might not be listening on public interface
tcp  0  127.0.0.1:443  0.0.0.0:*  LISTEN  1234/nginx
```

**Fix:** Check Nginx configuration at `/etc/nginx/sites-available/wingside`

### ✅ GOOD - Webhook Endpoint Working
```
✅ Webhook endpoint responding locally (HTTP 200)
   Response: {"received":true}
```

### ✅ GOOD - Orders Processed
```
Processing order: WS-WS202602040093-1770215087530
✅ Order WS202602040093 payment verified and processed successfully
```

## Interpreting Results

### Scenario 1: DNS Mismatch Found

**Problem:** www.wingside.ng points to wrong IP address

**Solution:**
1. Note the "Server's public IP" from script output (e.g., 123.45.67.89)
2. Log into your domain registrar (Namecheap, GoDaddy, etc.)
3. Update DNS A record for www.wingside.ng to the correct IP
4. Wait 5-60 minutes for DNS propagation
5. Re-run the script to verify

### Scenario 2: Nginx Not on Public Interface

**Problem:** Nginx listening on 127.0.0.1 instead of 0.0.0.0

**Solution:**
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/wingside

# Find the line that says:
listen 127.0.0.1:443 ssl;

# Change it to:
listen 443 ssl;

# Save and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Scenario 3: SSL Certificate Issues

**Problem:** SSL certificate invalid or expired

**Solution:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Or reinstall certificate
sudo certbot --nginx -d www.wingside.ng -d wingside.ng
```

### Scenario 4: No Issues Found But Webhooks Still Not Working

**Problem:** Hostinger upstream firewall or Nomba delivery issue

**Solution:**
1. Check Nomba dashboard → Developers → Webhooks → Delivery History
2. Look for failed deliveries and error messages
3. Contact Nomba support: support@nomba.com
   - Subject: "Webhook delivery failing to server"
   - Include: Your server IP, webhook URL, example transaction ID
4. Contact Hostinger support:
   - Ask if there's an upstream firewall blocking webhook traffic
   - Provide your server IP and port 443
   - Ask them to whitelist POST requests to /api/payment/nomba/webhook

## After Running the Script

### Test with Real Payment

1. **Start monitoring logs:**
   ```bash
   pm2 logs wingside --lines 0
   ```

2. **Make a small test payment** (₦100)

3. **Watch for this log within 5 seconds:**
   ```
   🚨 WEBHOOK ENDPOINT HIT!
   🚨 Time: 2026-02-05T...
   Nomba webhook event: payment_success
   Order WS202602040XXX payment confirmed via Nomba webhook
   ```

4. **If you see the 🚨 log:**
   - ✅ **SUCCESS!** Webhooks are now working!
   - Customer will see success page
   - Order will be marked as paid
   - Email will be sent

5. **If NO 🚨 log after 30 seconds:**
   - Webhook is still being blocked
   - Check the diagnostic summary at the end of the script output
   - Follow the recommended actions
   - Contact Nomba and/or Hostinger support

## Stuck Orders

The script automatically processes these stuck orders:
- WS202602050098 (1770299653484)
- WS202602040093 (1770215087530)
- WS202602040092 (1770210260057)
- WS202602040089 (1770209499833)

**Verify they were processed:**
```sql
-- Run in Supabase SQL Editor:
SELECT order_number, payment_status, status, paid_at
FROM orders
WHERE order_number IN ('WS202602050098', 'WS202602040093', 'WS202602040092', 'WS202602040089');

-- Should show: payment_status='paid', paid_at timestamp exists
```

## Troubleshooting

### Script Won't Run - Permission Denied
```bash
chmod +x diagnose-and-fix-webhooks.sh
sudo ./diagnose-and-fix-webhooks.sh
```

### Can't Find Script
```bash
cd /var/www/wingside/scripts
ls -la  # Should see diagnose-and-fix-webhooks.sh
pwd     # Should show: /var/www/wingside/scripts
```

### Git Pull Fails
```bash
# Stash local changes
git stash

# Pull again
git pull origin main

# If still fails, check git status
git status
```

### Need to Re-run Script
```bash
# You can run the script as many times as needed
cd /var/www/wingside/scripts
sudo ./diagnose-and-fix-webhooks.sh
```

## What Happens Next

After running the script:

1. **Review the summary** at the end of the output
2. **Take the recommended actions** (DNS update, Nginx config, etc.)
3. **Monitor logs** while making a test payment
4. **If still not working:** Contact support with the script output

The script output will tell you exactly what's wrong and how to fix it.

## Need Help?

If the script reveals an issue you don't understand:
1. Copy the entire script output
2. Screenshot the "DIAGNOSTIC SUMMARY" section
3. Share it and I'll help interpret the results
