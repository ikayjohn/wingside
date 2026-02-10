# Gift Card Expiration Cron Job Setup Guide

## 🎯 Purpose
Automatically deactivate expired gift cards every day at midnight.

---

## 🚀 Option 1: Vercel Cron (Recommended)

### Prerequisites
- Vercel account with your project deployed
- Vercel Pro plan (Hobby plan has limited cron)

### Step 1: Configure `vercel.json`

The `vercel.json` file has been created in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-gift-cards",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 0 * * *` = Every day at midnight (00:00) UTC
- Format: `minute hour day month day-of-week`

**Other Schedule Examples:**
```
0 */6 * * *   = Every 6 hours
0 2 * * *     = Every day at 2 AM
0 0 * * 0     = Every Sunday at midnight
0 */12 * * *  = Twice daily (every 12 hours)
```

### Step 2: Set Environment Variable in Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Select** your project
3. **Click** "Settings" tab
4. **Click** "Environment Variables" in sidebar
5. **Add new variable:**
   - **Key:** `CRON_SECRET`
   - **Value:** `062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6`
   - **Environment:** Production (and Preview if needed)
6. **Click** "Save"

### Step 3: Deploy

```bash
# Commit the vercel.json file
git add vercel.json
git commit -m "Add Vercel cron job for gift card expiration"
git push origin main
```

Vercel will auto-deploy and activate the cron job.

### Step 4: Verify Cron is Active

1. **Go to:** Vercel Dashboard → Your Project
2. **Click** "Cron Jobs" tab (should appear after deployment)
3. **Verify** you see: `/api/cron/expire-gift-cards` scheduled for `0 0 * * *`

### Step 5: Test Manually (Before Waiting for Midnight)

```bash
# Test the cron endpoint manually
curl -X GET https://your-domain.vercel.app/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully deactivated X expired gift cards",
  "expired_count": 0,
  "expired_codes": []
}
```

### Step 6: Monitor Cron Executions

**Via Vercel Dashboard:**
- Go to "Cron Jobs" tab
- View execution history, success/failure status, and logs

**Via Database:**
```sql
-- Check recently expired cards
SELECT code, expires_at, is_active
FROM gift_cards
WHERE expires_at < NOW() AND is_active = false
ORDER BY expires_at DESC
LIMIT 10;
```

---

## 🔧 Option 2: External Cron Service (For Non-Vercel Hosting)

If you're hosting on VPS, Hostinger, or other platforms, use an external cron service.

### Recommended Services:
1. **cron-job.org** (Free, reliable) - https://cron-job.org
2. **EasyCron** (Free tier available) - https://www.easycron.com
3. **Your server's crontab** (VPS/Dedicated server)

### Setup with cron-job.org:

#### Step 1: Create Account
1. Go to https://cron-job.org
2. Sign up for free account
3. Verify email

#### Step 2: Create Cron Job
1. Click "Create cronjob"
2. **Title:** "Wingside Gift Card Expiration"
3. **URL:** `https://www.wingside.ng/api/cron/expire-gift-cards`
4. **Schedule:** Daily at 00:00 (midnight)
5. **Advanced Settings:**
   - **HTTP Method:** GET
   - **Request Headers:** Add header
     - **Name:** `Authorization`
     - **Value:** `Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6`
6. **Save**

#### Step 3: Test Execution
- Click "Execute now" to test immediately
- Check execution log for success

#### Step 4: Enable Notifications
1. **Email notifications:** Enable for failures only
2. **Webhook notifications:** Optional - set up webhook endpoint

---

## 🖥️ Option 3: Server Crontab (VPS/Dedicated Server)

If you have SSH access to your server:

### Step 1: Edit Crontab

```bash
# SSH into your server
ssh user@your-server.com

# Edit crontab
crontab -e
```

### Step 2: Add Cron Job

```bash
# Add this line (daily at midnight)
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" >> /var/log/wingside-cron.log 2>&1
```

**With logging:**
```bash
# Daily at midnight with detailed logging
0 0 * * * curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6" -w "\nHTTP Status: %{http_code}\n" >> /var/log/wingside-cron.log 2>&1
```

### Step 3: Verify Crontab

```bash
# List all cron jobs
crontab -l

# Check log file
tail -f /var/log/wingside-cron.log
```

### Step 4: Test Manually

```bash
# Run the curl command directly to test
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6"
```

---

## 🔒 Security Best Practices

### 1. Keep CRON_SECRET Secure
- ✅ Store in environment variables only
- ✅ Never commit to Git
- ✅ Use different secrets for dev/staging/production
- ❌ Never hardcode in source code

### 2. Rotate Secret Periodically

Generate new secret every 6-12 months:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update in:
- Environment variables (Vercel/Hosting)
- External cron service headers
- Server crontab

### 3. Monitor Failed Executions

Set up alerts for:
- Cron job failures
- Unusual number of expired cards
- API endpoint errors

---

## 📊 Monitoring & Troubleshooting

### Check if Cron is Running

**Database Query:**
```sql
-- Cards that should be expired but are still active
SELECT code, recipient_email, expires_at, is_active
FROM gift_cards
WHERE expires_at < NOW()
  AND is_active = true
ORDER BY expires_at ASC;
```

If you see results, the cron might not be running.

### Check Last Execution

**Create a tracking table** (optional):
```sql
CREATE TABLE IF NOT EXISTS cron_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name VARCHAR(100) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_count INTEGER,
  success BOOLEAN,
  error_message TEXT
);
```

**Update cron endpoint** to log executions:
```typescript
// In app/api/cron/expire-gift-cards/route.ts
// After expiring cards, add:
await admin.from('cron_executions').insert({
  cron_name: 'expire-gift-cards',
  expired_count: expiredCards.length,
  success: true
});
```

**Check execution history:**
```sql
SELECT * FROM cron_executions
WHERE cron_name = 'expire-gift-cards'
ORDER BY executed_at DESC
LIMIT 10;
```

### Common Issues & Solutions

#### Issue 1: "401 Unauthorized" Error
**Cause:** CRON_SECRET mismatch
**Solution:**
- Verify environment variable is set correctly
- Check Authorization header format: `Bearer YOUR_SECRET`
- Regenerate and update secret if needed

#### Issue 2: Cron Not Executing
**Cause:** Vercel cron not enabled or wrong schedule
**Solution:**
- Check Vercel plan supports cron (Pro plan required)
- Verify `vercel.json` is in project root
- Redeploy after adding `vercel.json`
- Check "Cron Jobs" tab in Vercel dashboard

#### Issue 3: Cards Not Expiring
**Cause:** Logic error in cron endpoint
**Solution:**
```bash
# Test endpoint manually and check response
curl -X GET https://www.wingside.ng/api/cron/expire-gift-cards \
  -H "Authorization: Bearer YOUR_SECRET" \
  -v  # Verbose mode to see full response
```

#### Issue 4: "CRON_SECRET not configured" Error
**Cause:** Environment variable not set
**Solution:**
- Add `CRON_SECRET` to environment variables in Vercel/hosting
- Redeploy application
- In development: Add to `.env.local`

---

## 🧪 Testing Checklist

Before relying on the cron job:

- [ ] **Manual Test:** Run curl command successfully
- [ ] **Verify Secret:** Environment variable is set
- [ ] **Check Schedule:** Cron schedule is correct
- [ ] **Test Expiration:** Manually expire a test gift card
  ```sql
  UPDATE gift_cards
  SET expires_at = NOW() - INTERVAL '1 day'
  WHERE id = 'test-card-id';
  ```
- [ ] **Run Cron:** Execute cron manually or wait for schedule
- [ ] **Verify Result:** Check card is deactivated
  ```sql
  SELECT is_active FROM gift_cards WHERE id = 'test-card-id';
  -- Should return: false
  ```
- [ ] **Check Logs:** Review execution logs for errors
- [ ] **Monitor:** Set up monitoring/alerts

---

## 📅 Cron Schedule Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Useful Schedules:**
```
0 0 * * *       = Daily at midnight
0 */6 * * *     = Every 6 hours
0 2 * * *       = Daily at 2 AM
0 0 * * 0       = Every Sunday at midnight
0 0 1 * *       = First day of every month at midnight
*/30 * * * *    = Every 30 minutes
0 9-17 * * 1-5  = Every hour from 9 AM to 5 PM, Monday to Friday
```

**For Wingside Gift Cards:**
- **Recommended:** `0 0 * * *` (Daily at midnight) - Default
- **Conservative:** `0 2 * * *` (Daily at 2 AM) - Off-peak hours
- **Aggressive:** `0 */12 * * *` (Twice daily) - Extra safety

---

## 🎉 Quick Start (TL;DR)

### For Vercel:

1. **Add `vercel.json`** (already created)
2. **Set env var:** `CRON_SECRET=062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6`
3. **Deploy:** `git push origin main`
4. **Verify:** Check "Cron Jobs" tab in Vercel dashboard

### For Other Hosting:

1. **Go to:** https://cron-job.org
2. **Create job:** URL = `https://www.wingside.ng/api/cron/expire-gift-cards`
3. **Add header:** `Authorization: Bearer 062e0d0dd47a4f7b8afce60fbfd7a6a954b6184118366936156e8ccc3426a9a6`
4. **Schedule:** `0 0 * * *` (daily at midnight)
5. **Test:** Execute now

---

## 📞 Support

If cron job isn't working:
1. Check this guide's troubleshooting section
2. Verify environment variables are set
3. Test endpoint manually with curl
4. Check hosting platform's cron documentation
5. Review application logs for errors

Your gift card expiration cron job is now ready! 🚀
