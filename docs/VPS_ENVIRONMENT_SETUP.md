# Setting Up Environment Variables on VPS

## Required Environment Variables for Nomba Webhook

Your webhook needs these variables in production:

```bash
# Nomba Payment Gateway
NOMBA_CLIENT_ID=your_client_id
NOMBA_CLIENT_SECRET=your_client_secret
NOMBA_ACCOUNT_ID=your_account_id
NOMBA_WEBHOOK_SECRET=your_webhook_secret_from_nomba_dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=https://www.wingside.ng
```

---

## 🚀 Quick Setup: PM2 with Ecosystem File

### Step 1: Create PM2 Ecosystem File

Create `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [{
    name: 'wingside',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/wingside',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Add all your environment variables here
      NOMBA_CLIENT_ID: '9d1a85c1-212e-4418-9217-f56b769703e8',
      NOMBA_CLIENT_SECRET: '5sZ/rzXiIzjbvvu+2PVnog76H/PKp15fud9Y8JfWdjgeFtdtQYA1zCXYECbiGj9hvaEPOlyO+3Jiqut5luaHxQ==',
      NOMBA_ACCOUNT_ID: 'dfb21b47-8348-4aa7-9ba3-7e31021c6f69',
      NOMBA_WEBHOOK_SECRET: 'your_webhook_secret_here',
      NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_supabase_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'your_service_role_key',
      NEXT_PUBLIC_APP_URL: 'https://www.wingside.ng'
    }
  }]
};
```

### Step 2: Deploy Ecosystem File

```bash
# On your VPS
cd /var/www/wingside

# Upload ecosystem.config.js (via SCP, SFTP, or copy-paste)
nano ecosystem.config.js
# Paste the content above with your actual values

# Stop current PM2 process
pm2 stop wingside
pm2 delete wingside

# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
pm2 startup
```

### Step 3: Verify Environment Variables

```bash
# Check if variables are loaded
pm2 env 0 | grep NOMBA

# Or view all environment variables
pm2 show wingside
```

---

## Alternative Method: .env File with PM2

### Step 1: Upload .env to Production

```bash
# On your VPS
cd /var/www/wingside

# Create .env file
nano .env

# Add your production variables
NOMBA_CLIENT_ID=your_value
NOMBA_CLIENT_SECRET=your_value
NOMBA_ACCOUNT_ID=your_value
NOMBA_WEBHOOK_SECRET=your_value
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
SUPABASE_SERVICE_ROLE_KEY=your_value
NEXT_PUBLIC_APP_URL=https://www.wingside.ng
```

### Step 2: Configure PM2 to Use .env

```bash
# Install pm2-dotenv module
pm2 install pm2-dotenv

# Start with .env file
pm2 start npm --name "wingside" -- start --dotenv

# Or if using ecosystem.config.js:
module.exports = {
  apps: [{
    name: 'wingside',
    script: 'npm',
    args: 'start',
    env_production: {
      NODE_ENV: 'production'
    },
    dotfile_path: '/var/www/wingside/.env'
  }]
};
```

---

## 🔍 Verify Variables Are Set

### Test 1: Check PM2 Environment

```bash
pm2 env wingside
```

Look for:
- NOMBA_CLIENT_ID
- NOMBA_CLIENT_SECRET
- NOMBA_ACCOUNT_ID
- NOMBA_WEBHOOK_SECRET

### Test 2: Add Debug Logging

Temporarily add logging to your webhook to verify:

```typescript
// In app/api/payment/nomba/webhook/route.ts
export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK DEBUG ===');
  console.log('NOMBA_CLIENT_ID:', process.env.NOMBA_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('NOMBA_CLIENT_SECRET:', process.env.NOMBA_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('NOMBA_ACCOUNT_ID:', process.env.NOMBA_ACCOUNT_ID ? 'SET' : 'MISSING');
  console.log('NOMBA_WEBHOOK_SECRET:', process.env.NOMBA_WEBHOOK_SECRET ? 'SET' : 'MISSING');
  // ... rest of code
}
```

Then check logs:
```bash
pm2 logs wingside --lines 50
```

---

## ⚠️ Critical Variables

### For Webhook to Work:

1. **NOMBA_CLIENT_ID** - Required for API calls
2. **NOMBA_CLIENT_SECRET** - Required for API calls
3. **NOMBA_ACCOUNT_ID** - Required for API calls
4. **NOMBA_WEBHOOK_SECRET** - Required for signature verification
5. **SUPABASE_SERVICE_ROLE_KEY** - Required for database operations

### Missing Any of These?

The webhook will fail! Common symptoms:
- ❌ 500 Internal Server Error
- ❌ Cannot update order status
- ❌ Cannot award points
- ❌ Cannot send emails

---

## 🎯 Quick Fix Steps

### Option 1: Use Ecosystem File (RECOMMENDED)

```bash
# 1. Copy your local .env.local values
cat .env.local

# 2. On VPS, create ecosystem.config.js
cd /var/www/wingside
nano ecosystem.config.js

# 3. Paste ecosystem config with your values

# 4. Restart PM2
pm2 restart ecosystem.config.js --env production
pm2 save
```

### Option 2: Direct .env File

```bash
# 1. Copy .env.local to production
scp .env.local user@your-vps:/var/www/wingside/.env

# 2. On VPS, rename and set permissions
cd /var/www/wingside
mv .env.local .env
chmod 600 .env

# 3. Restart PM2
pm2 restart wingside
```

---

## ✅ Verification

After setting up environment variables:

```bash
# 1. Check PM2 logs for errors
pm2 logs wingside --lines 100

# 2. Test webhook locally on VPS
curl -X POST http://localhost:3000/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"payment_success"}'

# 3. Check for environment variable errors in logs
pm2 logs wingside | grep -i "nomba\|missing\|undefined"
```

---

## 🔒 Security Best Practices

1. **Never commit .env files** to git
2. **Set proper permissions:** `chmod 600 .env`
3. **Use different values** for development and production
4. **Rotate secrets** periodically
5. **Don't share** environment variables publicly

---

## 📝 Complete Production Checklist

- [ ] `.env` file created on VPS with all variables
- [ ] `chmod 600 .env` (only owner can read)
- [ ] PM2 ecosystem configured or pm2-dotenv installed
- [ ] Application restarted: `pm2 restart wingside`
- [ ] Variables verified: `pm2 env wingside`
- [ ] Webhook tested locally: `curl localhost:3000/api/...`
- [ ] Webhook tested externally: `curl https://www.wingside.ng/api/...`
- [ ] Real payment tested end-to-end

---

## 💡 Pro Tip

**Keep your production `.env` backed up securely:**

```bash
# On your local machine
scp user@vps:/var/www/wingside/.env ./backups/.env.production.$(date +%Y%m%d)
```

But **NEVER** commit it to git!

---

## 🚀 After Setup

Once environment variables are configured:

1. **Restart your app:** `pm2 restart wingside`
2. **Test webhook:** Run the test script again
3. **Place real order:** Verify payment flow works
4. **Monitor logs:** `pm2 logs wingside`

The webhook should work once both:
- ✅ Environment variables are set correctly
- ✅ Nginx is configured to allow POST to `/api/*`
