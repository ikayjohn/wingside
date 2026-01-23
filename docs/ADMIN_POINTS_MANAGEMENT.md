# Admin Points Management System

## Overview

Manual points management system for administrators to award or deduct points from users with full audit trail logging.

## Features

✅ **Manual Point Awards** - Award bonus points to users
✅ **Manual Point Deductions** - Remove points from users
✅ **Flexible Adjustments** - Single endpoint for both operations
✅ **Detailed User Points View** - Comprehensive points history and statistics
✅ **Full Audit Trail** - All actions logged with admin ID and reason
✅ **Admin-Only Access** - Protected by role-based authentication

## API Endpoints

### 1. Award Points

**Endpoint:** `POST /api/admin/points/award`

**Authentication:** Admin only

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "points": 500,
  "reason": "Compensation for delivery issue",
  "metadata": {
    "orderId": "order-123",
    "ticketId": "support-456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "newTotalPoints": 1500,
  "transactionId": "transaction-uuid",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "pointsAwarded": 500,
  "reason": "Compensation for delivery issue"
}
```

**Use Cases:**
- Compensation for service issues
- Promotional bonuses
- Contest/giveaway rewards
- Customer appreciation
- Corrections for system errors

---

### 2. Deduct Points

**Endpoint:** `POST /api/admin/points/deduct`

**Authentication:** Admin only

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "points": 200,
  "reason": "Fraudulent activity detected",
  "metadata": {
    "incidentId": "fraud-789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "newTotalPoints": 1300,
  "transactionId": "transaction-uuid",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "pointsDeducted": 200,
  "reason": "Fraudulent activity detected"
}
```

**Use Cases:**
- Fraud prevention
- Policy violations
- Corrections for duplicate awards
- Account adjustments
- Disputed transactions

**Note:** Cannot deduct below 0 points (prevents negative balance)

---

### 3. Flexible Adjust Points

**Endpoint:** `POST /api/admin/points/adjust`

**Authentication:** Admin only

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "pointsChange": -150,
  "reason": "Adjustment for system error",
  "metadata": {
    "systemErrorId": "error-321"
  }
}
```

**`pointsChange` Values:**
- **Positive number** (e.g., `+500`): Awards points
- **Negative number** (e.g., `-200`): Deducts points

**Response:**
```json
{
  "success": true,
  "newTotalPoints": 1150,
  "transactionId": "transaction-uuid",
  "actionType": "manual_deduct",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "pointsChange": -150,
  "reason": "Adjustment for system error"
}
```

---

### 4. Get User Points Details

**Endpoint:** `GET /api/admin/points/[userId]`

**Authentication:** Admin only

**Example:** `GET /api/admin/points/123e4567-e89b-12d3-a456-426614174000`

**Response:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "fullName": "John Doe",
  "totalPoints": 1500,
  "tier": "Wing Leader",
  "summary": {
    "totalEarned": 2500,
    "totalRedeemed": 800,
    "totalExpired": 200,
    "netBalance": 1500
  },
  "recentTransactions": [
    {
      "id": "transaction-uuid",
      "points": 500,
      "type": "earned",
      "source": "admin_award",
      "description": "Compensation for delivery issue",
      "created_at": "2025-01-23T10:30:00Z"
    },
    {
      "id": "transaction-uuid-2",
      "points": -200,
      "type": "redeemed",
      "source": "admin_deduct",
      "description": "Fraudulent activity detected",
      "created_at": "2025-01-22T15:20:00Z"
    }
  ]
}
```

**Use Cases:**
- View comprehensive points history before adjustment
- Audit user account
- Customer support inquiries
- Investigation of discrepancies

---

## Database Functions

### 1. `admin_award_points()`

**Purpose:** Manually award points to a user

**Parameters:**
- `p_user_id` (UUID) - Target user ID
- `p_points` (INTEGER) - Points to award (must be positive)
- `p_reason` (TEXT) - Reason for awarding
- `p_admin_id` (UUID) - Admin performing the action
- `p_metadata` (JSONB) - Additional context data

**Returns:**
```
success: BOOLEAN
new_total_points: INTEGER
transaction_id: UUID
```

**Behavior:**
- Adds points to user's `total_points`
- Logs transaction in `points_history` with type `'earned'` and source `'admin_award'`
- Stores admin ID in metadata for audit trail

---

### 2. `admin_deduct_points()`

**Purpose:** Manually deduct points from a user

**Parameters:**
- `p_user_id` (UUID) - Target user ID
- `p_points` (INTEGER) - Points to deduct (must be positive)
- `p_reason` (TEXT) - Reason for deduction
- `p_admin_id` (UUID) - Admin performing the action
- `p_metadata` (JSONB) - Additional context data

**Returns:**
```
success: BOOLEAN
new_total_points: INTEGER
transaction_id: UUID
```

**Behavior:**
- Subtracts points from user's `total_points`
- Uses `GREATEST(0, ...)` to prevent negative balance
- Logs transaction in `points_history` with type `'redeemed'` and source `'admin_deduct'`
- Stores previous balance and admin ID in metadata

---

### 3. `admin_adjust_points()`

**Purpose:** Flexible function to award or deduct based on signed integer

**Parameters:**
- `p_user_id` (UUID) - Target user ID
- `p_points_change` (INTEGER) - Points change (positive = award, negative = deduct)
- `p_reason` (TEXT) - Reason for adjustment
- `p_admin_id` (UUID) - Admin performing the action
- `p_metadata` (JSONB) - Additional context data

**Returns:**
```
success: BOOLEAN
new_total_points: INTEGER
transaction_id: UUID
action_type: TEXT ('manual_award' or 'manual_deduct')
```

**Behavior:**
- Automatically determines if awarding or deducting based on sign
- Prevents negative balance
- Logs appropriate transaction type

---

### 4. `get_user_points_details()`

**Purpose:** Get comprehensive points information for a user

**Parameters:**
- `p_user_id` (UUID) - Target user ID

**Returns:**
```
user_id: UUID
email: TEXT
full_name: TEXT
total_points: INTEGER
tier: TEXT
points_earned_total: BIGINT
points_redeemed_total: BIGINT
points_expired_total: BIGINT
recent_transactions: JSONB (last 10 transactions)
```

---

## Audit Trail

All admin point adjustments are logged in the `points_history` table with:

```sql
{
  "admin_id": "admin-uuid",
  "action_type": "manual_award" | "manual_deduct",
  "previous_balance": 1000,
  "points_change": 500,
  "original_metadata": { /* custom data */ }
}
```

### Viewing Audit Trail

**Query admin actions:**
```sql
SELECT
  ph.created_at,
  p.email as user_email,
  ph.points,
  ph.type,
  ph.source,
  ph.description,
  ph.metadata->>'admin_id' as admin_id,
  ph.metadata->>'action_type' as action_type
FROM points_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.source IN ('admin_award', 'admin_deduct', 'admin_adjustment')
ORDER BY ph.created_at DESC;
```

**Find all actions by specific admin:**
```sql
SELECT *
FROM points_history
WHERE metadata->>'admin_id' = 'specific-admin-uuid'
ORDER BY created_at DESC;
```

---

## Security

### Authentication
- All endpoints require valid user session
- User role must be `'admin'`
- Returns `401 Unauthorized` if not logged in
- Returns `403 Forbidden` if not admin

### Authorization
- Only users with `role = 'admin'` in profiles table can access
- Admin ID is logged for every action
- Cannot be bypassed or spoofed

### Validation
- `userId` must be valid UUID
- `points` must be positive integer
- `reason` must be non-empty string
- User must exist in database

---

## Usage Examples

### Example 1: Award Bonus Points

```typescript
// Award 1000 points for winning a contest
const response = await fetch('/api/admin/points/award', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    points: 1000,
    reason: 'Winner of January 2025 contest',
    metadata: {
      contestId: 'jan-2025-contest',
      prize: 'First Place'
    }
  })
})

const result = await response.json()
console.log(`New balance: ${result.newTotalPoints}`)
```

### Example 2: Deduct Points for Violation

```typescript
// Deduct 500 points for policy violation
const response = await fetch('/api/admin/points/deduct', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    points: 500,
    reason: 'Violation of terms: multiple accounts',
    metadata: {
      violationType: 'multiple_accounts',
      accountsDetected: 3
    }
  })
})
```

### Example 3: View User Points Before Adjustment

```typescript
// Check user's points before making adjustment
const userDetails = await fetch('/api/admin/points/user-uuid')
const data = await userDetails.json()

console.log(`Current balance: ${data.totalPoints}`)
console.log(`Total earned: ${data.summary.totalEarned}`)
console.log(`Total redeemed: ${data.summary.totalRedeemed}`)

// Then make adjustment if needed
```

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "error": "userId is required"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden - Admin access required"
}
```

**404 Not Found**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to award points",
  "details": "User not found: uuid-here"
}
```

---

## Best Practices

### 1. Always Provide Clear Reasons
```typescript
// Good
reason: "Compensation for order #12345 delayed by 3 days"

// Bad
reason: "adjustment"
```

### 2. Use Metadata for Context
```typescript
metadata: {
  orderId: "12345",
  ticketId: "support-789",
  approvedBy: "manager@wingside.ng"
}
```

### 3. Check User Details First
```typescript
// Get details before adjustment
const userInfo = await fetch(`/api/admin/points/${userId}`)
// Review current balance and history
// Then make informed adjustment
```

### 4. Log Actions
```typescript
console.log(
  `Admin ${adminEmail} awarded ${points} points to ${userEmail}. Reason: ${reason}`
)
```

---

## Future Enhancements

### Possible Additions:
1. **Bulk Operations** - Award/deduct points for multiple users
2. **Scheduled Adjustments** - Schedule points to be awarded/deducted at future date
3. **Approval Workflow** - Require manager approval for large adjustments
4. **Export Audit Log** - Download CSV of all admin actions
5. **Undo Action** - Reverse recent point adjustment
6. **Templates** - Save common reason templates

---

## Deployment

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor
cat supabase/migrations/20250128_add_admin_points_management.sql
# Copy and paste into SQL Editor, then Run
```

### Step 2: Deploy Code

```bash
cd /var/www/wingside
git pull origin main
bash deploy-vps.sh
```

### Step 3: Test Endpoints

```bash
# Test award endpoint
curl -X POST "https://www.wingside.ng/api/admin/points/award" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"userId":"user-uuid","points":100,"reason":"Test award"}'

# Test get details endpoint
curl "https://www.wingside.ng/api/admin/points/user-uuid" \
  -H "Cookie: your-session-cookie"
```

---

## Support

For issues or questions:
- Check error logs in browser console
- Review Supabase function logs
- Verify admin role in profiles table
- Contact technical support

---

## Related Documentation

- [Points System Overview](./POINTS_SYSTEM.md)
- [Tier System](./TIER_SYSTEM.md)
- [Admin Dashboard](./ADMIN_DASHBOARD.md)
