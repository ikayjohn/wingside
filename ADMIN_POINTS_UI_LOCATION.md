# Admin Points Management - UI Location & Usage

## Where to Find It

**Location:** `/admin/customers/[id]`

**Path:** Admin Dashboard → Customers → Click any customer → "Manage Points" button

## How to Access

1. Go to **Admin Dashboard**
2. Click **"Customers"** in the sidebar
3. Click on any customer to view their details
4. Scroll to the **"Points Management"** section (purple box)
5. Click **"Manage Points"** button

## UI Features

### Quick View (Collapsed)
When the section is collapsed, you see:
- Current points balance
- Current tier status
- "Manage Points" button

### Full Interface (Expanded)
When you click "Manage Points", you see:

#### 1. Current Balance Card
- Total points
- Tier status
- Close button (×)

#### 2. Points Summary
- **Total Earned:** All points awarded (green)
- **Total Redeemed:** All points used/deducted (red)
- **Expired:** Points that expired (gray)

#### 3. Award/Deduct Form
- **Action Toggle:**
  - Green "Award Points" button
  - Red "Deduct Points" button
- **Points Amount:** Number input field
- **Reason:** Text area for explanation (required for audit trail)
- **Submit Button:** Changes color based on action (green/red)

#### 4. Recent Transactions
- Last 10 point transactions
- Shows:
  - Points amount (+/-)
  - Transaction source (badge)
  - Description/reason
  - Date and time
- Scrollable list

## How to Use

### Award Points

1. Click **"Manage Points"**
2. Select **"Award Points"** (green button)
3. Enter points amount (e.g., `500`)
4. Enter reason (e.g., `"Compensation for delivery delay on order #12345"`)
5. Click **"Award 500 Points"**
6. See success message
7. Balance updates automatically

### Deduct Points

1. Click **"Manage Points"**
2. Select **"Deduct Points"** (red button)
3. Enter points amount (e.g., `200`)
4. Enter reason (e.g., `"Fraudulent activity detected"`)
5. Click **"Deduct 200 Points"**
6. See success message
7. Balance updates automatically

## Common Use Cases

### Compensation for Issues
```
Action: Award Points
Amount: 1000
Reason: Compensation for order #12345 - delivered 3 days late
```

### Contest Winner
```
Action: Award Points
Amount: 5000
Reason: Winner of January 2025 social media contest
```

### Promotional Bonus
```
Action: Award Points
Amount: 500
Reason: Birthday bonus - celebrating customer loyalty
```

### Fraud Prevention
```
Action: Deduct Points
Amount: 500
Reason: Fraudulent activity detected - multiple accounts
```

### System Error Correction
```
Action: Deduct Points
Amount: 200
Reason: Duplicate points awarded due to system error on 2025-01-20
```

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│ Points Management                    [Manage Points]    │
├─────────────────────────────────────────────────────────┤
│  Current Balance: 1,500 pts                             │
│  Tier: Wing Leader                                      │
└─────────────────────────────────────────────────────────┘

After clicking "Manage Points":

┌─────────────────────────────────────────────────────────┐
│ Points Management                                    [×]│
├─────────────────────────────────────────────────────────┤
│ Current Balance: 1,500 pts                              │
│ Tier: Wing Leader                                       │
├─────────────────────────────────────────────────────────┤
│ Total Earned    Total Redeemed    Expired               │
│   +2,500           -800             -200                │
├─────────────────────────────────────────────────────────┤
│ Action:                                                 │
│ [Award Points] [Deduct Points]                          │
│                                                         │
│ Points Amount:                                          │
│ [___500___]                                             │
│                                                         │
│ Reason:                                                 │
│ [Compensation for delivery delay]                       │
│                                                         │
│ [Award 500 Points]                                      │
├─────────────────────────────────────────────────────────┤
│ Recent Transactions                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ +500  [admin_award]                                 │ │
│ │ Compensation for delivery delay                     │ │
│ │ Jan 23, 2025 10:30 AM                               │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ -200  [admin_deduct]                                │ │
│ │ System error correction                             │ │
│ │ Jan 22, 2025 3:15 PM                                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Success/Error Messages

### Success Messages
- ✅ "Successfully awarded 500 points!"
- ✅ "Successfully deducted 200 points!"

### Error Messages
- ❌ "Please enter a valid points amount"
- ❌ "Please provide a reason"
- ❌ "Failed to award points" (with details)
- ❌ "Unauthorized" (if not admin)

## Important Notes

### Required Fields
- **Points Amount:** Must be a positive number
- **Reason:** Required for audit trail (cannot be empty)

### Automatic Updates
After submitting:
- Balance refreshes immediately
- Transaction history updates
- Customer details reload
- Success message shows for 3 seconds

### Audit Trail
All actions are logged with:
- Admin ID (who performed the action)
- Points amount
- Reason provided
- Timestamp
- Previous balance (stored in metadata)

### Security
- Only accessible by admin users
- All actions require authentication
- Cannot deduct below 0 points
- Full audit trail for compliance

## Backend API Calls

The UI makes these API calls:

1. **Fetch Points Details**
   - `GET /api/admin/points/[userId]`
   - Shows summary and recent transactions

2. **Award Points**
   - `POST /api/admin/points/award`
   - Body: `{ userId, points, reason }`

3. **Deduct Points**
   - `POST /api/admin/points/deduct`
   - Body: `{ userId, points, reason }`

## Testing Checklist

Before going live, test:
- [ ] Can access customer detail page
- [ ] "Manage Points" button works
- [ ] Award points form submits successfully
- [ ] Deduct points form submits successfully
- [ ] Balance updates after operation
- [ ] Transaction history displays
- [ ] Success/error messages show
- [ ] Form resets after successful submission
- [ ] Validation works (empty fields, negative numbers)
- [ ] Close button works
- [ ] Points summary displays correctly

## Troubleshooting

### Issue: "Manage Points" button doesn't appear
**Fix:** Ensure you're logged in as admin user

### Issue: "Unauthorized" error
**Fix:** Check that your user has `role = 'admin'` in profiles table

### Issue: Points not updating
**Fix:** Refresh the page and check database migration was run

### Issue: Transaction history empty
**Fix:** This is normal for new customers with no point transactions

## Next Steps

Once deployed:
1. Test with a sample customer
2. Award small test points (e.g., 10 points)
3. Verify transaction appears in history
4. Deduct the test points
5. Verify balance returns to original
6. Check audit trail in database

## Related Documentation

- **API Documentation:** `docs/ADMIN_POINTS_MANAGEMENT.md`
- **Setup Guide:** `SETUP_ADMIN_POINTS.md`
- **Database Functions:** `supabase/migrations/20250128_add_admin_points_management.sql`
