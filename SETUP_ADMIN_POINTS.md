# Admin Points Management - Quick Setup Guide

## What This Enables

Admins can now manually manage user points:
- ✅ Award bonus points (compensation, contests, promotions)
- ✅ Deduct points (fraud, violations, corrections)
- ✅ View detailed points history and statistics
- ✅ Full audit trail of all actions

## VPS Deployment

### Step 1: Pull Latest Code

```bash
cd /var/www/wingside
git pull origin main
```

### Step 2: Run Database Migration

**Option A: Supabase Dashboard (Recommended)**
```bash
# Get migration SQL
cat /var/www/wingside/supabase/migrations/20250128_add_admin_points_management.sql
```

Then:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration
3. Click **Run**

**Option B: Direct psql**
```bash
psql "your-connection-string" \
  -f /var/www/wingside/supabase/migrations/20250128_add_admin_points_management.sql
```

### Step 3: Deploy Application

```bash
bash deploy-vps.sh
```

Expected output:
```
✅ Deployment successful
```

## Testing the Endpoints

### 1. Award Points

```bash
# Replace YOUR_SESSION_COOKIE with your actual admin session cookie
curl -X POST "https://www.wingside.ng/api/admin/points/award" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "userId": "user-uuid-here",
    "points": 500,
    "reason": "Test bonus award"
  }'
```

Expected response:
```json
{
  "success": true,
  "newTotalPoints": 1500,
  "transactionId": "uuid-here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "pointsAwarded": 500,
  "reason": "Test bonus award"
}
```

### 2. Deduct Points

```bash
curl -X POST "https://www.wingside.ng/api/admin/points/deduct" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "userId": "user-uuid-here",
    "points": 100,
    "reason": "Test deduction"
  }'
```

### 3. View User Points Details

```bash
curl "https://www.wingside.ng/api/admin/points/user-uuid-here" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Expected response:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "totalPoints": 1400,
  "tier": "Wing Leader",
  "summary": {
    "totalEarned": 2000,
    "totalRedeemed": 500,
    "totalExpired": 100,
    "netBalance": 1400
  },
  "recentTransactions": [...]
}
```

## Database Functions Created

1. **admin_award_points()** - Award points to user
2. **admin_deduct_points()** - Deduct points from user
3. **admin_adjust_points()** - Flexible adjustment (+ or -)
4. **get_user_points_details()** - Get comprehensive points info

## API Endpoints Created

1. `POST /api/admin/points/award` - Award points
2. `POST /api/admin/points/deduct` - Deduct points
3. `POST /api/admin/points/adjust` - Flexible adjustment
4. `GET /api/admin/points/[userId]` - Get user details

## Security

- **Admin-only access** - Requires `role = 'admin'` in profiles table
- **Full audit trail** - Every action logged with admin ID
- **Validation** - All inputs validated before processing
- **No negative balances** - System prevents going below 0 points

## Common Use Cases

### Compensation for Service Issue
```json
{
  "userId": "user-uuid",
  "points": 1000,
  "reason": "Compensation for order #12345 delayed by 3 days",
  "metadata": {
    "orderId": "12345",
    "issueType": "delivery_delay"
  }
}
```

### Contest Winner
```json
{
  "userId": "user-uuid",
  "points": 5000,
  "reason": "Winner of January 2025 social media contest",
  "metadata": {
    "contestId": "jan-2025-contest",
    "prize": "First Place"
  }
}
```

### Fraud Detection
```json
{
  "userId": "user-uuid",
  "points": 500,
  "reason": "Fraudulent activity detected - multiple accounts",
  "metadata": {
    "violationType": "multiple_accounts",
    "accountsDetected": 3
  }
}
```

## Viewing Audit Trail

### All admin actions
```sql
SELECT
  ph.created_at,
  p.email as user_email,
  ph.points,
  ph.description as reason,
  ph.metadata->>'admin_id' as admin_id
FROM points_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.source IN ('admin_award', 'admin_deduct', 'admin_adjustment')
ORDER BY ph.created_at DESC
LIMIT 100;
```

### Actions by specific admin
```sql
SELECT *
FROM points_history
WHERE metadata->>'admin_id' = 'your-admin-uuid'
ORDER BY created_at DESC;
```

## Troubleshooting

### Issue: 401 Unauthorized
**Fix:** Ensure you're logged in as admin user

### Issue: 403 Forbidden
**Fix:** Check that your user has `role = 'admin'` in profiles table
```sql
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
```

### Issue: User not found
**Fix:** Verify the userId is correct
```sql
SELECT id, email FROM profiles WHERE id = 'user-uuid';
```

### Issue: Functions not found
**Fix:** Ensure migration was run successfully
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE 'admin_%points%';
```

Expected output:
```
admin_award_points
admin_deduct_points
admin_adjust_points
get_user_points_details
```

## Documentation

Full documentation available in: `docs/ADMIN_POINTS_MANAGEMENT.md`

Includes:
- Complete API reference
- Database function details
- Security considerations
- Best practices
- Usage examples
- Error handling guide

## Status Check

After deployment, verify:
- [ ] Migration applied successfully
- [ ] API endpoints accessible
- [ ] Admin can award points
- [ ] Admin can deduct points
- [ ] Points details endpoint works
- [ ] Transactions logged in points_history
- [ ] Admin ID captured in metadata

## Next Steps

Consider:
1. Add admin UI for points management
2. Implement bulk operations
3. Add approval workflow for large adjustments
4. Create audit log export feature
