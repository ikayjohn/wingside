# Fixing VPS Configuration for API Routes

## Problem
Your webhook returns **405 Method Not Allowed** because Nginx (or Apache) reverse proxy is not configured to allow POST requests to API routes.

---

## 🔍 Quick Diagnosis

### SSH into your VPS and run:

```bash
# Option 1: Run the diagnostic script
cd /var/www/wingside
bash scripts/check-vps-setup.sh

# Option 2: Check manually
pm2 list
nginx -t
curl -X POST http://localhost:3000/api/payment/nomba/webhook -H "Content-Type: application/json" -d '{"test":"data"}'
```

---

## 🔧 Solution: Configure Nginx Reverse Proxy

### Step 1: Check Current Nginx Configuration

```bash
# See current configuration
cat /etc/nginx/sites-available/wingside

# Or check default config
cat /etc/nginx/sites-enabled/default
```

### Step 2: Update Nginx Configuration

1. **Create new config file:**
```bash
sudo nano /etc/nginx/sites-available/wingside
```

2. **Copy the config from:**
   ```
   docs/nginx-wingside.conf
   ```

3. **Test configuration:**
```bash
sudo nginx -t
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/wingside
sudo nginx -s reload
```

### Step 3: Remove Apache (if both are running)

Apache and Nginx **cannot both** use port 80/443:

```bash
# Check if Apache is running
sudo systemctl status apache2

# Stop Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Remove Apache (optional - only if you don't need it)
sudo apt remove apache2
```

### Step 4: Ensure Next.js App is Running

```bash
cd /var/www/wingside

# Install dependencies if needed
npm install

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "wingside" -- start
pm2 save
pm2 startup
```

### Step 5: Test API Route

```bash
# Test locally
curl -X POST http://localhost:3000/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"payment_success"}'

# Should return: {"received":true}
```

### Step 6: Test from External

```bash
# Test from your machine
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"payment_success"}'
```

---

## 🎯 Key Changes Needed

The **critical part** is this block in your Nginx config:

```nginx
# API Routes - CRITICAL: Allow all HTTP methods
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;

    # Essential headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Allow all methods
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

    # Handle OPTIONS requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: 405 Method Not Allowed
**Cause:** Nginx blocking POST requests
**Fix:** Add proper `location /api/` block (see above)

### Issue 2: 502 Bad Gateway
**Cause:** Next.js server not running
**Fix:**
```bash
pm2 restart wingside
pm2 logs wingside
```

### Issue 3: Apache and Nginx Conflict
**Cause:** Both running on port 80
**Fix:** Stop Apache (see Step 3 above)

### Issue 4: Webhook Not Reaching Server
**Cause:** Firewall blocking requests
**Fix:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Only if needed
```

---

## 📊 Verify Everything Works

### 1. Check Server Status
```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Ports listening
sudo netstat -tlnp | grep -E '80|443|3000'
```

### 2. Test API Routes
```bash
# Test webhook
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"payment_success","requestId":"test"}'

# Should return: {"received":true}
```

### 3. Check Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/wingside-error.log

# PM2 logs
pm2 logs wingside

# Application logs
pm2 logs --lines 100
```

---

## ✅ Success Checklist

- [ ] Apache stopped (if running)
- [ ] Nginx configured with correct `/api/` location block
- [ ] Next.js app running on port 3000
- [ ] Nginx proxying to localhost:3000
- [ ] Local API test works (`curl localhost:3000/api/...`)
- [ ] External API test works (`curl https://www.wingside.ng/api/...`)
- [ ] Webhook test returns `{"received":true}`
- [ ] Real payment test completes successfully

---

## 🚀 After Configuration

1. **Update Nomba webhook URL** (if changed):
   ```
   https://www.wingside.ng/api/payment/nomba/webhook
   ```

2. **Test with a real payment**:
   - Place a small test order
   - Pay with Nomba
   - Verify order status changes to "paid"
   - Check confirmation email sent
   - Confirm points awarded

3. **Monitor logs**:
   ```bash
   pm2 logs wingside
   sudo tail -f /var/log/nginx/wingside-access.log
   ```

---

## 💡 Optional: Use SSL Certificate

For HTTPS, use Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d www.wingside.ng -d wingside.ng

# Auto-renewal is configured automatically
```

---

## 📞 Still Having Issues?

1. Run the diagnostic script and share the output
2. Check Nginx error logs: `sudo tail -100 /var/log/nginx/error.log`
3. Check PM2 logs: `pm2 logs --lines 100`
4. Verify Next.js is running: `curl http://localhost:3000`

The most common issue is **Apache and Nginx both running**. Stop Apache if needed!
