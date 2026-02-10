# SSH Cron Setup for Hostinger VPS

## 🚀 Step-by-Step Guide

### Step 1: Connect to Your VPS via SSH

**Option A: Using Windows Command Prompt/PowerShell**
```bash
ssh root@your-vps-ip-address
# Or if you have a specific username:
ssh username@your-vps-ip-address
```

**Option B: Using PuTTY (Windows)**
1. Download PuTTY from https://www.putty.org/
2. Enter your VPS IP address
3. Click "Open"
4. Login with your credentials

**Option C: Using Hostinger's Web SSH**
1. Go to Hostinger hPanel
2. Click on your VPS
3. Click "SSH Access" or "Browser Terminal"
4. Click "Open Web SSH"

---

### Step 2: Set Environment Variable First

Once connected, set the CRON_SECRET:

```bash
# Navigate to your project directory
cd /path/to/your/wingside/project

# Edit .env file (or .env.production)
nano .env.production
```

**Add this line:**
```bash
CRON_SECRET=062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` (yes to save)
- Press `Enter`

**Restart your Node.js app:**
```bash
# If using PM2:
pm2 restart all --update-env

# Or restart specific app:
pm2 restart wingside --update-env

# If using systemd:
sudo systemctl restart wingside

# Or if running manually:
# Stop the current process and restart
```

---

### Step 3: Create Log Directory

```bash
# Create directory for logs
mkdir -p ~/logs

# Or if you prefer a specific location:
mkdir -p /var/log/wingside

# Set permissions
chmod 755 ~/logs
```

---

### Step 4: Test the Cron Command First

Before adding to crontab, let's test the command:

```bash
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected output:**
```json
{"success":true,"message":"Successfully deactivated 0 expired gift cards","expired_count":0,"expired_codes":[]}
HTTP Status: 200
```

If you get an error, stop here and troubleshoot before proceeding.

---

### Step 5: Open Crontab Editor

```bash
crontab -e
```

**If asked to choose an editor:**
- Type `1` for nano (easiest)
- Or `2` for vim
- Press `Enter`

---

### Step 6: Add the Cron Job

**Scroll to the bottom** of the file and add this line:

```bash
# Wingside Gift Card Expiration - Daily at midnight
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> ~/logs/gift-card-cron.log 2>&1
```

**Your crontab should look something like this:**
```bash
# Edit this file to introduce tasks to be run by cron.
#
# m h  dom mon dow   command

# Wingside Gift Card Expiration - Daily at midnight
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> ~/logs/gift-card-cron.log 2>&1
```

**Save and exit:**
- **Nano:** Press `Ctrl + X`, then `Y`, then `Enter`
- **Vim:** Press `Esc`, type `:wq`, press `Enter`

You should see: `crontab: installing new crontab`

---

### Step 7: Verify Cron Job is Added

```bash
# List all cron jobs
crontab -l
```

You should see your cron job listed.

---

### Step 8: Check Cron Service is Running

```bash
# Check if cron service is active
sudo systemctl status cron

# Or on older systems:
sudo service cron status
```

**Expected output:** `active (running)`

**If not running, start it:**
```bash
sudo systemctl start cron
# Or:
sudo service cron start
```

---

### Step 9: Test by Running Manually

Don't wait until midnight! Test it now:

```bash
# Run the exact command from crontab
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" \
  >> ~/logs/gift-card-cron.log 2>&1

# Check the log file
cat ~/logs/gift-card-cron.log
```

**You should see:**
```json
{"success":true,"message":"Successfully deactivated 0 expired gift cards","expired_count":0,"expired_codes":[]}
```

---

### Step 10: Monitor the Logs

```bash
# View log file
cat ~/logs/gift-card-cron.log

# View last 20 lines
tail -20 ~/logs/gift-card-cron.log

# Watch logs in real-time (wait for midnight or change schedule)
tail -f ~/logs/gift-card-cron.log
```

---

## 📅 Alternative Schedules

If you want to run at different times, edit the cron schedule:

```bash
# Edit crontab
crontab -e
```

**Common schedules:**
```bash
# Daily at 2 AM (recommended for off-peak)
0 2 * * * [command]

# Daily at noon
0 12 * * * [command]

# Every 6 hours
0 */6 * * * [command]

# Twice daily (midnight and noon)
0 0,12 * * * [command]

# Every Sunday at midnight
0 0 * * 0 [command]

# First day of every month
0 0 1 * * [command]
```

---

## 🐛 Troubleshooting

### Issue 1: Cron Job Not Running

**Check cron logs:**
```bash
# On Ubuntu/Debian
grep CRON /var/log/syslog | tail -20

# Or
sudo tail -f /var/log/cron

# Or check system journal
journalctl -u cron -n 50
```

### Issue 2: Permission Denied

**Fix log file permissions:**
```bash
chmod 644 ~/logs/gift-card-cron.log
chown $(whoami):$(whoami) ~/logs/gift-card-cron.log
```

### Issue 3: curl Command Not Found

**Install curl:**
```bash
sudo apt update
sudo apt install curl -y
```

### Issue 4: Wrong Time Zone

**Check server timezone:**
```bash
timedatectl
```

**Change timezone if needed:**
```bash
# List available timezones
timedatectl list-timezones | grep Africa

# Set to Lagos time (West Africa)
sudo timedatectl set-timezone Africa/Lagos
```

### Issue 5: Cron Not Executing at All

**Restart cron service:**
```bash
sudo systemctl restart cron
# Or:
sudo service cron restart

# Enable cron to start on boot
sudo systemctl enable cron
```

---

## 📊 Verify Everything is Working

### Database Check

```bash
# Connect to your database (adjust connection details)
# For PostgreSQL (Supabase):
psql "postgresql://postgres:password@host:5432/database"

# Run this query:
SELECT code, expires_at, is_active
FROM gift_cards
WHERE expires_at < NOW() AND is_active = true;
```

**Expected result:** 0 rows (all expired cards should be inactive)

### Create Test Expired Card

```sql
-- Manually create a test card that's already expired
INSERT INTO gift_cards (
  code,
  denomination,
  initial_balance,
  current_balance,
  recipient_name,
  recipient_email,
  expires_at,
  design_image,
  is_active
) VALUES (
  'TESTEXPIRED1',
  20000,
  20000,
  20000,
  'Test User',
  'test@example.com',
  NOW() - INTERVAL '1 day',  -- Expired yesterday
  'val-01.png',
  true  -- Still active (should be deactivated by cron)
);
```

**Run cron manually:**
```bash
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6"
```

**Check if it was deactivated:**
```sql
SELECT code, is_active FROM gift_cards WHERE code = 'TESTEXPIRED1';
-- Should return: is_active = false
```

---

## 🔔 Email Notifications (Optional)

To receive email when cron runs, modify the cron command:

```bash
# Edit crontab
crontab -e
```

**Change to:**
```bash
MAILTO=your-email@example.com

0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> ~/logs/gift-card-cron.log 2>&1
```

**Note:** Your server needs to have `sendmail` or `postfix` configured for this to work.

---

## 📱 Advanced: Monitoring with Healthchecks.io (Free)

Get notified if cron stops working:

1. **Sign up:** https://healthchecks.io (free)
2. **Create check:** "Wingside Gift Card Cron"
3. **Copy ping URL:** e.g., `https://hc-ping.com/your-uuid`

**Update cron command:**
```bash
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> ~/logs/gift-card-cron.log 2>&1 && curl -fsS --retry 3 https://hc-ping.com/your-uuid > /dev/null
```

Now you'll get email alerts if the cron job fails or stops running!

---

## ✅ Quick Reference

**View cron jobs:**
```bash
crontab -l
```

**Edit cron jobs:**
```bash
crontab -e
```

**Remove all cron jobs:**
```bash
crontab -r
```

**View logs:**
```bash
tail -f ~/logs/gift-card-cron.log
```

**Test endpoint:**
```bash
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6"
```

---

## 🎉 Done!

Your cron job is now set up and will run **daily at midnight** to automatically expire old gift cards! 🚀

**Next:** Wait until tomorrow morning and check the logs to confirm it ran successfully.
