# Hostinger VPS Deployment Checklist

## ✅ Committed & Pushed to Git

All changes have been committed and pushed to `main` branch.

---

## 🚀 Quick Deployment Steps for Hostinger VPS

### 1. SSH into your VPS
```bash
ssh user@your-vps-ip
```

### 2. Navigate to project directory
```bash
cd /var/www/wingside
```

### 3. Pull latest changes
```bash
git pull origin main
```

### 4. Install new dependencies (if any)
```bash
npm install
```

### 5. Build the application
```bash
npm run build
```

### 6. Apply database migrations
```bash
# Open Supabase SQL editor
# Or use psql if you have direct access:
# https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
```

**Run in this order:**
1. Copy `supabase/migrations/20250113_add_total_points_column.sql`
2. Run it
3. Copy `supabase/migrations/20250113_update_referral_system_to_points.sql`
4. Run it

### 7. Update environment variables
```bash
# Edit ecosystem.config.js
nano ecosystem.config.js

# Add missing values:
# - NOMBA_WEBHOOK_SECRET (get from Nomba dashboard)
# - SUPABASE credentials (get from Supabase dashboard)
```

### 8. Restart application with PM2
```bash
pm2 restart wingside
# or
pm2 restart ecosystem.config.js --env production
pm2 save
```

### 9. Fix Nginx configuration
```bash
bash scripts/fix-nginx-config.sh
```

### 10. Verify deployment
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs wingside --lines 50

# Test API locally
curl http://localhost:3000/api/payment/nomba/webhook

# Test API from external (from your local machine)
# Use PowerShell script: scripts/test-webhook.ps1
```

---

## ✅ Verification Checklist

### Frontend
- [ ] Homepage loads correctly
- [ ] Menu navigation works
- [ ] All pages accessible

### Customer Dashboard
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Points shown as numbers (not ₦)
- [ ] Tier progression displays updated thresholds
- [ ] Referral section shows 200 points

### Payment Flow
- [ ] Checkout page loads
- [ ] Nomba payment option available
- [ ] Payment initializes correctly
- [ ] Webhook endpoint accessible (test with PowerShell script)

### Backend
- [ ] PM2 process running
- [ ] Nginx serving requests
- [ ] No errors in logs
- [ ] Environment variables loaded (`pm2 env wingside | grep NOMBA`)

---

## 🔧 Troubleshooting

### Issue: 405 Method Not Allowed on webhook
**Solution:**
```bash
bash scripts/fix-nginx-config.sh
```

### Issue: Environment variables missing
**Solution:**
```bash
nano ecosystem.config.js
# Add all required NOMBA_* and SUPABASE_* variables
pm2 restart ecosystem.config.js --env production
pm2 save
```

### Issue: Database errors about total_points column
**Solution:**
- Run SQL migrations in Supabase SQL editor
- See step 6 above

### Issue: Build errors
**Solution:**
```bash
rm -rf .next node_modules
npm install
npm run build
pm2 restart wingside
```

---

## 📊 Post-Deployment Testing

### 1. Test Referral System
1. Create a test user with a referral code
2. Sign up a new user using that code
3. Place a qualifying order (₦1,000+)
4. Verify:
   - Referrer gets 200 points
   - Referred user gets 200 points
   - Points display correctly

### 2. Test Payment Flow
1. Place a test order
2. Pay with Nomba
3. Verify:
   - Order status changes to "paid"
   - Confirmation email sent
   - Loyalty points awarded
   - Admin notification sent

### 3. Test Webhook
From your local machine (PowerShell):
```powershell
cd C:\Users\ikayj\Documents\wingside
.\scripts\test-webhook.ps1
```

**Expected:** `✅ Webhook Success!`

---

## 🎯 Key Changes in This Deployment

### Referral System
- ✅ ₦500 → 200 points per referral
- ✅ Both parties get points
- ✅ Tier thresholds: 0-5K, 5K-20K, 20K+
- ✅ Birthday reward: 100 points

### New Files
- ✅ Custom tier icons (wingmember.svg, etc.)
- ✅ Action icons (convert.svg, earnrewards.svg, etc.)
- ✅ PM2 ecosystem.config.js
- ✅ Nginx configuration
- ✅ VPS management scripts
- ✅ Database migrations

### Documentation
- ✅ VPS setup guides
- ✅ Referral migration guide
- ✅ Webhook troubleshooting

---

## 📞 Need Help?

Check these guides:
- `docs/VPS_SETUP_GUIDE.md` - Full VPS configuration
- `docs/VPS_ENVIRONMENT_SETUP.md` - Environment variables
- `docs/REFERRAL_POINTS_MIGRATION_GUIDE.md` - Database migration

---

## 🚀 After Deployment

1. **Monitor logs for 24 hours**
   ```bash
   pm2 logs wingside
   ```

2. **Test all payment methods**

3. **Verify referral system works end-to-end**

4. **Check email notifications are sent**

5. **Monitor Supabase for referral tracking**

---

**Deployment complete!** 🎉

Your referral system is now points-based and Nomba payment gateway is integrated.
