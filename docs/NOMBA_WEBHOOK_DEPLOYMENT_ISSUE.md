# Webhook & API Routes Deployment Issue

## 🚨 Problem Identified

Your webhook is returning **405 Method Not Allowed** because **API routes don't work with static hosting**.

### What's Happening

Your Next.js application has:
- ✅ Frontend pages (working) - Deployed as static files
- ❌ API routes (broken) - **Not accessible on static hosting**

### Why This Matters

**Static Hosting** (what you have now):
- Serves pre-built HTML/CSS/JS files
- **Cannot** run API routes, webhooks, or server-side code
- Examples: GitHub Pages, basic Hostinger shared hosting, Netlify static

**Server Hosting** (what you need):
- Runs a Node.js server
- **Can** handle API routes, webhooks, server-side logic
- Examples: Vercel, Railway, Render, DigitalOcean, Hostinger VPS

---

## 🔧 Solutions

### Solution 1: Deploy to Vercel (RECOMMENDED - Easiest)

Vercel is the creators of Next.js and provides free hosting with built-in API support.

**Steps:**
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set up custom domain in Vercel dashboard
5. Update webhook URL in Nomba dashboard to new Vercel URL

**Pros:**
- ✅ Free hosting
- ✅ Automatic deployments
- ✅ API routes work out of the box
- ✅ Built for Next.js
- ✅ Easy to use

**Cons:**
- ⚠️ Need to migrate from Hostinger (can still keep domain)

---

### Solution 2: Hostinger VPS (Current Host - Upgrade Plan)

If you want to stay with Hostinger, you need to upgrade to **VPS hosting**, not shared/static hosting.

**Steps:**
1. Log in to Hostinger
2. Upgrade to VPS plan (Cloud or KVM hosting)
3. SSH into your VPS
4. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

5. Deploy your app:
   ```bash
   cd /var/www/wingside
   npm install
   npm run build
   pm2 start npm --name "wingside" -- start
   pm2 save
   pm2 startup
   ```

6. Configure Nginx reverse proxy (optional but recommended)

**Pros:**
- ✅ Stay with current host
- ✅ Full control over server
- ✅ API routes work

**Cons:**
- ⚠️ More expensive than shared hosting
- ⚠️ Requires server management knowledge
- ⚠️ Manual setup and deployment

---

### Solution 3: Use Serverless Functions (Alternative)

Move API routes to a serverless platform while keeping frontend on Hostinger.

**Options:**
- **Vercel Functions** (free tier available)
- **AWS Lambda** (free tier available)
- **Cloudflare Workers** (free tier available)
- **Supabase Edge Functions** (free tier available)

**Example with Supabase Edge Functions:**

1. Create Supabase Edge Function for webhook:
   ```bash
   supabase functions new nomba-webhook
   ```

2. Move webhook logic to `supabase/functions/nomba-webhook/index.ts`

3. Deploy:
   ```bash
   supabase functions deploy nomba-webhook
   ```

4. Update webhook URL in Nomba:
   ```
   https://your-project.supabase.co/functions/v1/nomba-webhook
   ```

**Pros:**
- ✅ Can keep frontend on Hostinger
- ✅ Serverless = auto-scaling
- ✅ Pay only for usage (often free tier)

**Cons:**
- ⚠️ Need to split frontend/backend
- ⚠️ More complex deployment

---

### Solution 4: Use a Webhook Proxy Service (Quick Fix)

Use a service like **Hookdeck**, **Svix**, or **RequestBin** to receive webhooks and forward them.

**Steps:**
1. Sign up for Hookdeck (free tier available)
2. Set up webhook forwarding:
   - Receive: `https://your-hookdeck-url.hookdeck.com`
   - Forward to: `http://your-vps-ip:3000/api/payment/nomba/webhook`
3. Update Nomba webhook URL to Hookdeck URL

**Pros:**
- ✅ Fast setup
- ✅ Webhook retry logic included
- ✅ Monitoring and debugging tools

**Cons:**
- ⚠️ Still need somewhere to forward the webhook
- ⚠️ Adds latency
- ⚠️ May cost money at scale

---

## 🎯 Recommended Approach

### For Quick Test (Current Development):
```bash
# Test webhook locally using ngrok
npm run dev
npx ngrok http 3000
```

Then update Nomba webhook to use ngrok URL temporarily:
```
https://your-ngrok-url.ngrok-free.app/api/payment/nomba/webhook
```

### For Production:
**Deploy to Vercel** - it's the easiest and built for Next.js.

---

## ⚡ Immediate Action Required

Your **payment webhooks are not working** in production, which means:

❌ Orders won't be automatically confirmed after payment
❌ Customers won't get confirmation emails
❌ Loyalty points won't be awarded
❌ Admin won't receive notifications

### Temporary Workaround:
Until you fix the deployment, you'll need to:
1. Manually check Nomba dashboard for successful payments
2. Manually update order status in your database
3. Manually send confirmation emails
4. Manually award points

### Fix It Now:
Choose one of the solutions above and deploy properly!

---

## 📊 Comparison Table

| Solution | Difficulty | Cost | Speed | Reliability |
|----------|-----------|------|-------|-------------|
| **Vercel** | ⭐ Easy | Free tier | Fast | ⭐⭐⭐⭐⭐ |
| **Hostinger VPS** | ⭐⭐⭐ Medium | $5-15/mo | Fast | ⭐⭐⭐⭐ |
| **Serverless** | ⭐⭐ Medium | Free tier | Medium | ⭐⭐⭐⭐ |
| **Webhook Proxy** | ⭐ Easy | Free tier | Medium | ⭐⭐⭐ |

---

## 🚀 Next Steps

1. **Choose a solution** (I recommend Vercel)
2. **Deploy your application** with server-side support
3. **Test the webhook** using the test script
4. **Update webhook URL** in Nomba dashboard
5. **Place a test order** to verify everything works

Would you like help with any of these solutions?
