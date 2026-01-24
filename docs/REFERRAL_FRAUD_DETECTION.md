

# Referral Fraud Detection System

## Overview

Comprehensive fraud detection system that automatically identifies suspicious referral patterns to prevent abuse of the referral rewards program.

## Fraud Detection Types

### 1. Email Pattern Fraud
**What it detects:** Sequential email addresses suggesting fake accounts
- Examples: `john1@email.com`, `john2@email.com`, `john3@email.com`
- Threshold: 3+ similar emails from same referrer
- Severity:
  - **Critical:** 5+ similar emails
  - **High:** 4 similar emails
  - **Medium:** 3 similar emails

### 2. Rapid Referral Velocity
**What it detects:** Unusually fast referral creation
- Triggers:
  - 10+ referrals in 24 hours
  - 5+ referrals in 1 hour
- Severity:
  - **Critical:** 10+ in 1 hour OR 20+ in 24 hours
  - **High:** 7+ in 1 hour OR 15+ in 24 hours
  - **Medium:** 5+ in 1 hour OR 10+ in 24 hours

### 3. No Purchase Activity
**What it detects:** Referred users who never make purchases (fake accounts)
- Checks: Users referred 30+ days ago with zero orders
- Severity:
  - **High:** 90+ days with no orders
  - **Medium:** 60+ days with no orders
  - **Low:** 30+ days with no orders

### 4. Self-Referral Detection
**What it detects:** Users referring themselves with alternate accounts
- Checks:
  - Same email domain between referrer and referred
  - Similar names (uses fuzzy string matching)
  - Email pattern similarity
- Severity:
  - **Critical:** Name similarity > 80%
  - **High:** Name similarity > 60%
  - **Medium:** Name similarity > 50%

## Database Schema

### `referral_fraud_flags` Table

```sql
id                UUID PRIMARY KEY
referral_id       UUID NOT NULL (references referrals)
fraud_type        TEXT NOT NULL (see types above)
severity          TEXT NOT NULL (low, medium, high, critical)
fraud_score       INTEGER (0-100)
description       TEXT
evidence          JSONB (detailed evidence data)
status            TEXT (flagged, investigating, confirmed_fraud, false_positive, resolved)
reviewed_by       UUID (admin who reviewed)
reviewed_at       TIMESTAMPTZ
admin_notes       TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### Fraud Status Values

- **flagged**: Newly detected, needs review
- **investigating**: Admin is reviewing the case
- **confirmed_fraud**: Confirmed as fraudulent
- **false_positive**: Not actually fraud
- **resolved**: Issue addressed and closed

## API Endpoints

### 1. Run Fraud Detection Scan

**Endpoint:** `POST /api/admin/referral-fraud/scan`

**Description:** Runs all fraud detection checks and creates flags

**Authentication:** Admin only

**Request:**
```bash
curl -X POST "https://www.wingside.ng/api/admin/referral-fraud/scan" \
  -H "Cookie: your-session-cookie"
```

**Response:**
```json
{
  "success": true,
  "flagsCreated": 12,
  "summary": {
    "total_flags": 12,
    "email_pattern_flags": 5,
    "rapid_referral_flags": 2,
    "no_purchase_flags": 3,
    "self_referral_flags": 2,
    "run_at": "2025-01-24T10:30:00Z"
  }
}
```

---

### 2. Get Fraud Flags

**Endpoint:** `GET /api/admin/referral-fraud/flags`

**Description:** Retrieve fraud flags with filtering and pagination

**Query Parameters:**
- `status` - Filter by status (flagged, investigating, etc.)
- `severity` - Filter by severity (low, medium, high, critical)
- `fraudType` - Filter by fraud type
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Request:**
```bash
curl "https://www.wingside.ng/api/admin/referral-fraud/flags?status=flagged&severity=high" \
  -H "Cookie: your-session-cookie"
```

**Response:**
```json
{
  "flags": [
    {
      "id": "uuid",
      "referral_id": "uuid",
      "fraud_type": "email_pattern_fraud",
      "severity": "high",
      "fraud_score": 75,
      "description": "Suspicious email pattern detected: 4 similar emails found",
      "evidence": {
        "similar_emails_count": 4,
        "base_pattern": "john@email.com",
        "referred_email": "john4@email.com"
      },
      "status": "flagged",
      "created_at": "2025-01-24T10:00:00Z",
      "referral": {
        "referrer_id": "uuid",
        "referred_email": "john4@email.com",
        "referral_code_used": "JOHN123"
      },
      "referrer": {
        "referrer": {
          "email": "john@email.com",
          "full_name": "John Doe"
        }
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 3. Review Fraud Flag

**Endpoint:** `POST /api/admin/referral-fraud/review`

**Description:** Update status of a fraud flag (mark as fraud, false positive, etc.)

**Request Body:**
```json
{
  "flagId": "uuid-of-flag",
  "status": "confirmed_fraud",
  "adminNotes": "Verified as fraudulent - revoking rewards"
}
```

**Valid Status Values:**
- `flagged`
- `investigating`
- `confirmed_fraud`
- `false_positive`
- `resolved`

**Response:**
```json
{
  "success": true,
  "flag": {
    "id": "uuid",
    "status": "confirmed_fraud",
    "reviewed_by": "admin-uuid",
    "reviewed_at": "2025-01-24T11:00:00Z",
    "admin_notes": "Verified as fraudulent - revoking rewards"
  }
}
```

**Actions on Confirmed Fraud:**
- Referral status updated to `'fraud_detected'`
- Rewards can be revoked (depending on implementation)
- User can be flagged for further investigation

---

### 4. Get Fraud Statistics

**Endpoint:** `GET /api/admin/referral-fraud/stats`

**Description:** Get aggregated fraud detection statistics for dashboard

**Request:**
```bash
curl "https://www.wingside.ng/api/admin/referral-fraud/stats" \
  -H "Cookie: your-session-cookie"
```

**Response:**
```json
{
  "totalFlags": 45,
  "pendingReview": 12,
  "confirmedFraud": 20,
  "falsePositives": 13,
  "bySeverity": {
    "low": 10,
    "medium": 15,
    "high": 15,
    "critical": 5
  },
  "byType": {
    "email_pattern_fraud": 18,
    "rapid_referral_velocity": 8,
    "no_purchase_activity": 12,
    "self_referral_suspected": 7
  },
  "recentFlags": [
    {
      "id": "uuid",
      "fraud_type": "email_pattern_fraud",
      "severity": "high",
      "fraud_score": 75,
      "created_at": "2025-01-24T10:00:00Z"
    }
  ]
}
```

## Usage Workflow

### 1. Automated Daily Scan

Set up a daily cron job to run fraud detection:

```bash
# Create: /var/www/wingside/run-fraud-detection-cron.sh
#!/bin/bash
cd /var/www/wingside
CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

curl -L -X POST "https://www.wingside.ng/api/admin/referral-fraud/scan" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  >> /var/www/wingside/logs/fraud-detection.log 2>&1
```

```cron
# Run daily at 2:00 AM
0 2 * * * /var/www/wingside/run-fraud-detection-cron.sh
```

### 2. Admin Review Process

1. **View Dashboard:**
   - Check fraud statistics
   - See pending flags by severity

2. **Review Flags:**
   - Click on high-severity flags first
   - Examine evidence data
   - Check referrer's history

3. **Take Action:**
   - **Confirmed Fraud:** Mark as confirmed, revoke rewards
   - **False Positive:** Mark as false positive
   - **Need More Info:** Mark as investigating

4. **Follow Up:**
   - Add admin notes for team context
   - Monitor user for additional suspicious activity

### 3. Manual Investigation

For confirmed fraud cases:

```sql
-- Get all referrals by suspicious user
SELECT * FROM referrals WHERE referrer_id = 'user-uuid';

-- Check their rewards
SELECT * FROM referral_rewards WHERE user_id = 'user-uuid';

-- View their order history
SELECT * FROM orders WHERE user_id = 'user-uuid';

-- See all fraud flags for this user
SELECT * FROM referral_fraud_flags
WHERE referral_id IN (
  SELECT id FROM referrals WHERE referrer_id = 'user-uuid'
);
```

## Fraud Score Calculation

Each fraud type has a scoring algorithm:

### Email Pattern Fraud
```
Score = min(similar_emails_count * 15, 100)
Example: 4 similar emails = 60 points
```

### Rapid Referral Velocity
```
Score = min((referrals_24h * 5) + (referrals_1h * 10), 100)
Example: 10 in 24h + 5 in 1h = 100 points
```

### No Purchase Activity
```
Score = min(days_since_signup, 100)
Example: 90 days = 90 points
```

### Self-Referral
```
Score = min(name_similarity * 100, 100)
Example: 80% similarity = 80 points
```

## Evidence Data Structure

### Email Pattern Fraud
```json
{
  "similar_emails_count": 4,
  "base_pattern": "john@email.com",
  "referred_email": "john4@email.com"
}
```

### Rapid Referral Velocity
```json
{
  "referrals_last_24h": 15,
  "referrals_last_1h": 6,
  "threshold_exceeded": true
}
```

### No Purchase Activity
```json
{
  "days_since_signup": 90,
  "order_count": 0,
  "referred_email": "inactive@email.com"
}
```

### Self-Referral
```json
{
  "referrer_email": "john.doe@email.com",
  "referred_email": "john.smith@email.com",
  "referrer_name": "John Doe",
  "referred_name": "John Smith",
  "similarity_score": 0.75
}
```

## Best Practices

### For Admins

1. **Regular Monitoring:**
   - Review dashboard daily
   - Prioritize critical/high severity flags
   - Look for patterns across multiple users

2. **Quick Response:**
   - Review new flags within 24 hours
   - Mark false positives promptly to avoid alert fatigue
   - Document decisions in admin notes

3. **Fair Investigation:**
   - Don't assume guilt from one flag
   - Check multiple data points
   - Give benefit of doubt for marginal cases

4. **Pattern Recognition:**
   - Watch for repeat offenders
   - Identify coordinated fraud rings
   - Update detection rules as needed

### For Developers

1. **Tune Thresholds:**
   - Adjust severity thresholds based on false positive rate
   - Modify fraud score algorithms as patterns emerge

2. **Add New Checks:**
   - Phone number similarity
   - IP address tracking
   - Device fingerprinting
   - Payment method analysis

3. **Performance:**
   - Run scans during off-peak hours
   - Index fraud_flags table properly
   - Monitor query performance

## Future Enhancements

### Planned Features

1. **Machine Learning:**
   - Train model on confirmed fraud cases
   - Predict fraud probability
   - Adaptive threshold adjustment

2. **Real-Time Detection:**
   - Flag suspicious referrals instantly
   - Block fraud before rewards are paid
   - Email alerts for critical severity

3. **IP/Device Tracking:**
   - Track signup IPs
   - Detect multiple accounts from same device
   - Geolocation analysis

4. **Network Analysis:**
   - Detect circular referral rings
   - Identify coordinated fraud groups
   - Graph-based fraud detection

5. **Integration with Rewards:**
   - Auto-hold suspicious rewards
   - Automatic reward revocation
   - Blacklist repeat offenders

## Deployment

### Step 1: Run Migration

```bash
# In Supabase SQL Editor
cat /var/www/wingside/supabase/migrations/20250128_add_referral_fraud_detection.sql
# Copy and paste, then Run
```

### Step 2: Test Detection

```bash
# Run manual scan
curl -X POST "https://www.wingside.ng/api/admin/referral-fraud/scan" \
  -H "Cookie: your-session-cookie"

# Check results
curl "https://www.wingside.ng/api/admin/referral-fraud/stats" \
  -H "Cookie: your-session-cookie"
```

### Step 3: Setup Cron Job

```bash
chmod +x /var/www/wingside/run-fraud-detection-cron.sh
crontab -e
# Add: 0 2 * * * /var/www/wingside/run-fraud-detection-cron.sh
```

## Support

### Troubleshooting

**Issue: pg_trgm extension not found**
```sql
-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Issue: No flags created on scan**
- Check if referrals table has data
- Verify fraud detection thresholds
- Check function permissions

**Issue: Permission denied errors**
- Ensure service_role has execute permissions
- Check RLS policies on related tables

## Related Documentation

- [Referral System](./REFERRAL_SYSTEM.md)
- [Points Management](./ADMIN_POINTS_MANAGEMENT.md)
- [Admin Dashboard](./ADMIN_DASHBOARD.md)
