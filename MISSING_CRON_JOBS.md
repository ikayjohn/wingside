# Missing Cron Jobs - Features That Need Automation

## ✅ Currently Implemented

1. **Tier Downgrades** ✅
   - **Schedule:** Every Sunday 2:00 AM
   - **Endpoint:** `/api/cron/tier-downgrades`
   - **Status:** Fully configured and running

2. **Points Expiration** ✅
   - **Schedule:** Daily 3:00 AM
   - **Endpoint:** `/api/cron/expire-points`
   - **Status:** Code ready, pending VPS deployment

## ⚠️ Features That Need Cron Jobs

### 1. **Birthday Bonus** ⚠️ HIGH PRIORITY
**Current State:**
- Database has `birthday_day` and `birthday_month` fields in profiles
- UI shows "+100 pts" button in earn-rewards page
- **Missing:** Automatic daily check and bonus award

**What's Needed:**
- Daily cron job (runs at midnight)
- Checks users whose birthday is today
- Awards 100 points automatically
- Sends birthday email notification
- Ensures one-time award per year

**Implementation:**
```bash
# Create: app/api/cron/birthday-bonuses/route.ts
# Schedule: 0 0 * * * (daily at midnight)
```

**Database Query Needed:**
```sql
SELECT id, email, full_name
FROM profiles
WHERE birthday_day = EXTRACT(DAY FROM CURRENT_DATE)
  AND birthday_month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND NOT EXISTS (
    SELECT 1 FROM reward_claims
    WHERE user_id = profiles.id
      AND reward_type = 'birthday'
      AND EXTRACT(YEAR FROM claimed_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  );
```

---

### 2. **Points Expiration** ✅ IMPLEMENTED
**Status:** Code complete, ready for VPS deployment

**What Was Implemented:**
- ✅ Database migration: `20250128_add_points_expiration.sql`
- ✅ API endpoint: `/api/cron/expire-points` (POST and GET)
- ✅ Cron script: `run-expire-points-cron.sh`
- ✅ Database functions:
  - `process_points_expiration()` - Expires rewards and deducts points
  - `get_users_with_expiring_points()` - For warning notifications
  - `mark_expiration_warning_sent()` - Tracks warning emails
- ✅ Setup guide: `SETUP_POINTS_EXPIRATION_CRON.md`

**Schedule:** Daily at 3:00 AM (`0 3 * * *`)

**Next Step:** Follow `SETUP_POINTS_EXPIRATION_CRON.md` to deploy on VPS

---

### 3. **Promo Code Auto-Deactivation** ⚠️ LOW PRIORITY
**Current State:**
- Promo codes have `valid_until` field
- **Missing:** Automatic deactivation when expired

**What's Needed:**
- Daily cron job
- Find promo codes where `valid_until < NOW()` AND `is_active = true`
- Set `is_active = false`

**Implementation:**
```bash
# Create: app/api/cron/expire-promo-codes/route.ts
# Schedule: 0 4 * * * (daily at 4:00 AM)
```

**Query:**
```sql
UPDATE promo_codes
SET is_active = false
WHERE valid_until < NOW()
  AND is_active = true
RETURNING code, valid_until;
```

---

### 4. **Social Verification Cleanup** ⚠️ LOW PRIORITY
**Current State:**
- `social_verifications` table has pending verifications
- Admin manually approves
- **Missing:** Auto-reject old pending verifications

**What's Needed:**
- Weekly cron job
- Find verifications pending >30 days
- Update status to 'rejected' or 'expired'
- Send notification to user

**Implementation:**
```bash
# Create: app/api/cron/cleanup-social-verifications/route.ts
# Schedule: 0 5 * * 0 (weekly Sunday 5:00 AM)
```

---

### 5. **Referral Expiration** ⚠️ LOW PRIORITY
**Current State:**
- Referrals table tracks status
- **Missing:** Expire referrals that never completed first order

**What's Needed:**
- Weekly cron job
- Find referrals in 'signed_up' status >90 days
- Update to 'expired' status

**Implementation:**
```bash
# Create: app/api/cron/expire-referrals/route.ts
# Schedule: 0 6 * * 0 (weekly Sunday 6:00 AM)
```

---

### 6. **Notification Cleanup** ⚠️ LOW PRIORITY
**Current State:**
- Notifications table exists
- **Missing:** Delete old read notifications

**What's Needed:**
- Monthly cron job
- Delete notifications older than 90 days and read
- Keep important notifications (transactions, rewards)

**Implementation:**
```bash
# Create: app/api/cron/cleanup-notifications/route.ts
# Schedule: 0 7 1 * * (monthly on 1st at 7:00 AM)
```

---

### 7. **Database Cleanup** ⚠️ OPTIONAL
**What's Needed:**
- Monthly cron job
- VACUUM and ANALYZE tables
- Clean up old sessions
- Archive old orders (>1 year)

**Implementation:**
```bash
# Create: app/api/cron/database-maintenance/route.ts
# Schedule: 0 2 1 * * (monthly on 1st at 2:00 AM)
```

---

## Priority Recommendation

### Implement Now:
1. **Birthday Bonuses** - User-facing feature that's advertised but not working
2. **Points Expiration** - Important for loyalty program integrity

### Implement Soon:
3. **Promo Code Auto-Deactivation** - Prevents using expired codes

### Implement Later:
4. **Social Verification Cleanup** - Nice to have
5. **Referral Expiration** - Low impact
6. **Notification Cleanup** - Performance optimization
7. **Database Cleanup** - Maintenance task

---

## Implementation Plan

### Phase 1: Critical (Week 1)
- [ ] Birthday Bonuses cron job
- [ ] Points Expiration cron job
- [ ] Update CRON_SECRET to include these endpoints

### Phase 2: Important (Week 2)
- [ ] Promo Code Auto-Deactivation
- [ ] Social Verification Cleanup

### Phase 3: Optional (Month 1)
- [ ] Referral Expiration
- [ ] Notification Cleanup
- [ ] Database Maintenance

---

## Cron Schedule Summary

Once all implemented, your crontab would look like:

```cron
# Tier Downgrades (Sundays 2:00 AM)
0 2 * * 0 /var/www/wingside/run-tier-downgrade-cron.sh

# Birthday Bonuses (Daily midnight)
0 0 * * * /var/www/wingside/run-birthday-bonus-cron.sh

# Points Expiration (Daily 3:00 AM)
0 3 * * * /var/www/wingside/run-expire-points-cron.sh

# Promo Code Expiration (Daily 4:00 AM)
0 4 * * * /var/www/wingside/run-expire-promos-cron.sh

# Social Verification Cleanup (Sundays 5:00 AM)
0 5 * * 0 /var/www/wingside/run-cleanup-social-verifications-cron.sh

# Referral Expiration (Sundays 6:00 AM)
0 6 * * 0 /var/www/wingside/run-expire-referrals-cron.sh

# Notification Cleanup (Monthly 1st at 7:00 AM)
0 7 1 * * /var/www/wingside/run-cleanup-notifications-cron.sh

# Database Maintenance (Monthly 1st at 2:00 AM)
0 2 1 * * /var/www/wingside/run-database-maintenance-cron.sh
```

---

## Quick Implementation Template

For each cron job:

1. **Create API endpoint:** `app/api/cron/[feature]/route.ts`
2. **Add authentication:** Check CRON_SECRET header
3. **Create cron script:** `/var/www/wingside/run-[feature]-cron.sh`
4. **Add to crontab:** `crontab -e`
5. **Test manually:** `bash run-[feature]-cron.sh`
6. **Monitor logs:** `tail -f logs/[feature].log`

---

## Current Status

- ✅ 2/8 cron jobs implemented (25%)
- ⚠️ 1/8 high priority missing (Birthday Bonuses)
- 📊 5/8 optional but recommended

**Next Action:** Deploy Points Expiration to VPS, then implement Birthday Bonuses cron job.
