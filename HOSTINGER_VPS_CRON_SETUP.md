# Hostinger VPS Cron Setup Guide

## 🎯 Setup Gift Card Expiration Cron on Hostinger VPS

### Method 1: Using Hostinger Control Panel (Easiest)

#### Step 1: Access Cron Jobs
1. **Login to** Hostinger hPanel (https://hpanel.hostinger.com)
2. **Navigate to** "Advanced" section
3. **Click** "Cron Jobs"

#### Step 2: Create New Cron Job
1. **Click** "Create Cron Job"
2. **Fill in details:**

**Common Settings:**
- **Minute:** `0`
- **Hour:** `0` (midnight)
- **Day:** `*` (every day)
- **Month:** `*` (every month)
- **Weekday:** `*` (every day of week)

**Or use preset:** Select "Once a day (at midnight)"

**Command to Execute:**
```bash
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6"
```

**With Logging (Recommended):**
```bash
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> /home/your-username/logs/gift-card-cron.log 2>&1
```

3. **Email notifications:**
   - ✅ Enable "Email me when this cron job is executed"
   - Enter your email address

4. **Click** "Create"

#### Step 3: Test the Cron Job
1. **Find your cron job** in the list
2. **Click** "Run Now" to test immediately
3. **Check email** for execution notification
4. **Verify in database:**
```sql
SELECT code, is_active, expires_at
FROM gift_cards
WHERE expires_at < NOW()
ORDER BY expires_at DESC;
```

---

### Method 2: SSH Access (Advanced)

If you have SSH access to your Hostinger VPS:

#### Step 1: Connect via SSH

**Using Hostinger hPanel:**
1. Go to **VPS** section
2. Click **SSH Access**
3. Use the provided credentials
4. Click **Web SSH** or use terminal:

```bash
ssh username@your-vps-ip
# Enter password when prompted
```

#### Step 2: Create Cron Job

```bash
# Open crontab editor
crontab -e
```

If asked to choose editor, select `nano` (easiest) or `vim`.

#### Step 3: Add Cron Job

Add this line at the bottom:

```bash
# Gift Card Expiration - Daily at midnight
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> /home/your-username/logs/gift-card-cron.log 2>&1
```

**Save and exit:**
- **Nano:** Press `Ctrl + X`, then `Y`, then `Enter`
- **Vim:** Press `Esc`, type `:wq`, press `Enter`

#### Step 4: Verify Cron is Added

```bash
# List all cron jobs
crontab -l
```

You should see your cron job listed.

#### Step 5: Create Log Directory

```bash
# Create logs directory if it doesn't exist
mkdir -p /home/your-username/logs

# Give proper permissions
chmod 755 /home/your-username/logs
```

#### Step 6: Test Manually

```bash
# Run the command manually to test
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected output:**
```json
{"success":true,"message":"Successfully deactivated 0 expired gift cards","expired_count":0,"expired_codes":[]}
HTTP Status: 200
```

#### Step 7: Check Logs

```bash
# View log file
cat /home/your-username/logs/gift-card-cron.log

# Watch logs in real-time (after cron runs)
tail -f /home/your-username/logs/gift-card-cron.log
```

---

### Method 3: Using PM2 (If Running Node.js Apps)

If you're using PM2 to manage your Node.js application:

#### Option A: PM2 Cron Module

```bash
# Install PM2 cron module
pm2 install pm2-cron

# Create cron job
pm2 cron create "gift-card-expiration" "0 0 * * *" "curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H 'Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6'"

# List cron jobs
pm2 cron list

# Save PM2 configuration
pm2 save
```

#### Option B: Node.js Cron Job (Inside Your App)

Create `scripts/gift-card-cron.js`:

```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running gift card expiration cron...');

  try {
    const response = await fetch('https://www.wingside.ng/api/cron/expire-gift-cards', {
      headers: {
        'Authorization': 'Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6'
      }
    });

    const result = await response.json();
    console.log('Cron result:', result);
  } catch (error) {
    console.error('Cron error:', error);
  }
});

console.log('Gift card expiration cron job initialized');
```

**Install dependencies:**
```bash
npm install node-cron node-fetch
```

**Add to PM2:**
```bash
pm2 start scripts/gift-card-cron.js --name "gift-card-cron"
pm2 save
pm2 startup
```

---

## 🔐 Environment Variables Setup

### Set CRON_SECRET on Hostinger VPS

#### Option 1: Via .env File (Recommended)

```bash
# SSH into your server
ssh username@your-vps-ip

# Navigate to your project directory
cd /path/to/wingside

# Edit .env.production file
nano .env.production
```

**Add this line:**
```bash
CRON_SECRET=062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

#### Option 2: Via PM2 Ecosystem File

If using PM2, edit `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'wingside',
    script: './server.js',
    env_production: {
      NODE_ENV: 'production',
      CRON_SECRET: '062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6',
      // ... other env vars
    }
  }]
};
```

**Restart app:**
```bash
pm2 restart wingside --update-env
```

---

## 📊 Monitoring on Hostinger

### Check Cron Execution

#### Via Hostinger hPanel:
1. Go to **Cron Jobs** section
2. View **Execution History**
3. Check last execution time and status

#### Via SSH:

```bash
# Check cron logs
grep CRON /var/log/syslog | tail -20

# Or if syslog not available
journalctl -u cron | tail -20

# Check your custom log
tail -50 /home/your-username/logs/gift-card-cron.log
```

### Database Verification

```bash
# SSH into server and connect to database
# Or use Hostinger's phpMyAdmin / Adminer

# Run this SQL query
SELECT COUNT(*) as expired_but_active
FROM gift_cards
WHERE expires_at < NOW() AND is_active = true;
```

**Expected result:** `0` (if cron is working properly)

---

## 🐛 Troubleshooting

### Issue 1: Cron Not Running

**Check cron service status:**
```bash
sudo systemctl status cron
# or
sudo service cron status
```

**Restart cron service:**
```bash
sudo systemctl restart cron
# or
sudo service cron restart
```

### Issue 2: Permission Denied

**Fix log file permissions:**
```bash
chmod 644 /home/your-username/logs/gift-card-cron.log
chown your-username:your-username /home/your-username/logs/gift-card-cron.log
```

### Issue 3: Curl Not Found

**Install curl:**
```bash
sudo apt update
sudo apt install curl -y
```

### Issue 4: Wrong Path/URL

**Verify your domain:**
```bash
# Test the endpoint
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" \
  -v
```

---

## ✅ Quick Setup Checklist

For Hostinger VPS:

- [ ] **Access hPanel** → Cron Jobs section
- [ ] **Create cron job** with curl command
- [ ] **Set schedule** to `0 0 * * *` (midnight daily)
- [ ] **Enable email** notifications
- [ ] **Test execution** using "Run Now"
- [ ] **Set CRON_SECRET** in `.env.production`
- [ ] **Verify in database** that cards are expiring
- [ ] **Check logs** regularly for the first week
- [ ] **Set up monitoring** alerts

---

## 📧 Email Notifications

Hostinger will email you when the cron runs. Configure in hPanel:

1. **Go to** Cron Jobs
2. **Edit** your cron job
3. **Enable** "Email me when executed"
4. **Enter email** address
5. **Save**

You'll receive:
- Execution confirmation
- Any output from the curl command
- Error messages if it fails

---

## 🎯 Recommended Schedule for Production

```bash
# Option 1: Daily at 2 AM (Recommended - Off-peak hours)
0 2 * * *

# Option 2: Daily at midnight (Default)
0 0 * * *

# Option 3: Twice daily (Extra safety)
0 0,12 * * *
```

---

## 📱 Advanced: Monitoring Alerts

### Setup Webhook Notifications (Optional)

Create a monitoring endpoint to get notified:

**1. Add to cron command:**
```bash
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" && curl -X POST https://hooks.slack.com/your-webhook -d '{"text":"Gift card cron completed"}' || curl -X POST https://hooks.slack.com/your-webhook -d '{"text":"Gift card cron FAILED"}'
```

**2. Use a monitoring service:**
- **UptimeRobot** - Monitor the endpoint
- **Cronitor** - Dedicated cron monitoring
- **Dead Man's Snitch** - Alert if cron doesn't run

---

## 🎉 You're All Set!

Your gift card expiration cron job is now configured on Hostinger VPS. It will:

✅ Run daily at midnight (or your chosen time)
✅ Automatically deactivate expired gift cards
✅ Email you after each execution
✅ Log results for troubleshooting

**Test it today** using "Run Now" in hPanel to make sure everything works! 🚀
