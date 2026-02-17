# Google Analytics 4 (GA4) Setup Guide - Option A

✅ **Status**: Basic tracking code installed (Option A - manual dashboard viewing)

---

## What's Already Done

- ✅ Google Analytics tracking component created
- ✅ Added to root layout (tracks all pages automatically)
- ✅ Environment variable configured
- ✅ VPS compatible (no Vercel-specific features)

---

## What You Need to Do (5 Minutes)

### Step 1: Get Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **Admin** (gear icon bottom left)
3. Under **Property** column → Click **Data Streams**
4. Click your **Web** stream (or create one if you don't have it)
5. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)

**Screenshot location:**
```
Admin → Property → Data Streams → Web → Measurement ID
```

---

### Step 2: Add to Your Environment Files

**For Local Development** (`.env.local`):
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**For Production VPS** (`.env.production`):
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

---

### Step 3: Deploy to Production

**On your Hostinger VPS:**

```bash
# 1. Pull latest code
cd /path/to/wingside
git pull origin main

# 2. Add GA Measurement ID to .env.production
nano .env.production
# Add: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# Save: Ctrl+X, Y, Enter

# 3. Rebuild and restart
npm run build
pm2 restart wingside
```

---

### Step 4: Verify It's Working

**Method 1: GA4 Realtime Report (Fastest)**
1. Visit your website: https://www.wingside.ng
2. Open GA4 dashboard: [analytics.google.com](https://analytics.google.com)
3. Click **Reports** → **Realtime**
4. You should see yourself as an active user (within 30 seconds)

**Method 2: Browser Console (Technical)**
1. Visit your website
2. Open DevTools (F12)
3. Console tab → Type: `dataLayer`
4. Should see an array with tracking events

**Method 3: GA DebugView (Most Detailed)**
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) (Chrome extension)
2. Enable the extension
3. Visit your website
4. GA4 → Admin → DebugView
5. See events in real-time

---

## What Data You'll See (in 24-48 Hours)

### Automatic Tracking (No Extra Setup):

**Traffic & Users**
- Page views
- Active users (real-time, daily, monthly)
- New vs returning visitors
- Session duration
- Bounce rate

**Geographic**
- Users by country, region, city
- Language breakdown

**Technology**
- Device category (mobile, desktop, tablet)
- Browser & OS
- Screen resolution

**Acquisition**
- Traffic sources (Google, Facebook, Instagram, Direct)
- Referral websites
- UTM campaign tracking (if you use UTM parameters)

**Behavior**
- Top pages
- Landing pages
- Exit pages
- User flow

---

## How to View Your Data

### Key Reports to Check:

1. **Home Dashboard**
   - Quick overview of users, sessions, conversions

2. **Reports → Realtime**
   - See active users right now
   - What pages they're viewing

3. **Reports → Life Cycle → Acquisition → Traffic acquisition**
   - Where users come from (Google, Instagram, etc.)

4. **Reports → Life Cycle → Engagement → Pages and screens**
   - Most visited pages
   - Time spent on each page

5. **Reports → User → Demographics**
   - Age, gender, interests (if enabled)

6. **Reports → User → Tech → Tech details**
   - Devices, browsers, OS breakdown

7. **Reports → Life Cycle → Engagement → Events**
   - All tracked events (page_view, etc.)

---

## Setting Up Conversion Goals (Optional)

To track important actions like newsletter signups or contact form submissions:

1. GA4 → **Admin** → **Events**
2. Click **Create event** or **Mark as conversion**
3. Common conversions:
   - `sign_up` (newsletter)
   - `generate_lead` (contact form)
   - `page_view` on `/order` (intent to order)

---

## Adding UTM Parameters to Marketing Links

Track which campaigns work best:

**Format:**
```
https://www.wingside.ng/?utm_source=instagram&utm_medium=social&utm_campaign=valentines2024
```

**Parameters:**
- `utm_source`: Where traffic comes from (instagram, facebook, google)
- `utm_medium`: Type of traffic (social, email, cpc)
- `utm_campaign`: Campaign name (valentines2024, summer_promo)
- `utm_content`: Variant (story, post, reel)
- `utm_term`: Keywords (for paid ads)

**Tool to Generate UTM Links:**
https://ga-dev-tools.google/campaign-url-builder/

**Example Instagram Bio Link:**
```
https://www.wingside.ng/order?utm_source=instagram&utm_medium=bio&utm_campaign=ongoing
```

---

## Common Issues & Fixes

### "No data appearing in GA4"

**Check:**
1. ✅ Measurement ID is correct (starts with `G-`)
2. ✅ Environment variable is set (no typos)
3. ✅ Website rebuilt after adding env var (`npm run build`)
4. ✅ PM2 restarted (`pm2 restart wingside`)
5. ✅ Wait 24-48 hours for full data (Realtime works immediately)

**Test:**
```bash
# Check if env var is loaded
cd /path/to/wingside
node -e "console.log(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)"
# Should print: G-XXXXXXXXXX
```

### "Tracking myself but no other users"

- Wait 24-48 hours for Google to process data
- Share website link to test with others
- Check Realtime report (instant data)

### "Want to exclude admin traffic"

1. GA4 → **Admin** → **Data Streams** → Web → **Configure tag settings**
2. **Show all** → **Define internal traffic**
3. Add your admin IP addresses
4. Create filter to exclude internal traffic

---

## Data Retention

GA4 default: **2 months** (free tier)

To increase to **14 months**:
1. Admin → **Data Settings** → **Data Retention**
2. Change to **14 months**
3. Click **Save**

---

## Next Steps (Optional - Upgrade to Option B Later)

If you want GA data inside your admin dashboard (not just analytics.google.com):

1. Set up Service Account (Google Cloud Console)
2. Enable Google Analytics Data API
3. Pull data via API into `/admin/analytics/`
4. See `memory/google-analytics-integration.md` for full guide

**For now**: Just use analytics.google.com to view reports!

---

## Support Resources

- [GA4 Help Center](https://support.google.com/analytics/answer/9304153)
- [GA4 Demo Account](https://support.google.com/analytics/answer/6367342) (see sample data)
- [YouTube: Google Analytics](https://www.youtube.com/@googleanalytics)

---

## Summary

✅ **What's working**: Automatic page tracking on all pages
📊 **Where to view**: [analytics.google.com](https://analytics.google.com) → Reports
⏱️ **Data delay**: Realtime = instant, Full reports = 24-48 hours
🔧 **Maintenance**: None needed - it just works!

**That's it! You're all set up.** 🎉
