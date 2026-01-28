# 🎉 7-Day Streak System Complete

## Summary

The streak system has been updated to award **500 points** for each completed 7-day streak and reset the streak to 0.

## 📋 Streak System Rules

### Qualification Criteria
- **Minimum Order Amount:** ₦15,000
- **Maximum Streak:** 7 days
- **Reward:** 500 points per completed 7-day streak

### How Streaks Work
1. **Day 1** (first qualifying order) → Streak = 1
2. **Consecutive days** (orders every day) → Streak increments: 1, 2, 3, 4, 5, 6
3. **Same day repeat** → Streak doesn't change (prevents double counting)
4. **Gap in ordering** (skip 1+ days) → Streak resets to 1
5. **Maximum reached** (7 days) → Reset to 1, award 500 points

### Example Timeline

| Day | Action | Streak | Points Awarded |
|------|---------|---------|----------------|
| 1 | Order ₦15,000+ | 1 | 0 |
| 2 | Order ₦15,000+ | 2 | 0 |
| 3 | Order ₦15,000+ | 3 | 0 |
| 4 | Order ₦15,000+ | 4 | 0 |
| 5 | Order ₦15,000+ | 5 | 0 |
| 6 | Order ₦15,000+ | 6 | 0 |
| 7 | Order ₦15,000+ | **Reset to 1** | **+500** ✨ |
| 8 | Order ₦15,000+ | 2 | 0 |
| 9 | Order ₦15,000+ | 3 | 0 |

---

## 🔄 What Changed

### API Updates (`app/api/user/update-streak/route.ts`)

#### 1. Added Constants
```typescript
const MIN_ORDER_AMOUNT_FOR_STREAK = 15000 // ₦15,000
const MAX_STREAK_DAYS = 7 // Maximum 7-day streak
const STREAK_REWARD_POINTS = 500 // Points awarded for 7-day streak
```

#### 2. Track 7-Day Streak Completion
- Detects when user's streak was at 6 and just reached 7
- Awards 500 points to `total_points`
- Resets streak to 0
- Sets `streak_start_date` to `null`

#### 3. Update Profile Fields
- Now selects `total_points` from profiles
- Adds awarded points to `total_points`
- Returns `streakCompleted` flag in response

#### 4. Improved Logging
```
[Streak Update] User: <id>, Order total: <amount>
[Streak Update] Days diff: <diff>, Qualifies: <bool>, Current streak: <number>
[Streak Update] About to complete 7-day streak: 6
[Streak Update] 🎉 7-DAY STREAK COMPLETED! Awarding 500 points
[Streak Update] Total points before: <old>, Adding: 500, New total: <new>
```

#### 5. Enhanced Messages
- **Active streak (1-6 days):** "🔥 X day streak!"
- **7-day streak completion:** "🎉 Amazing! You completed a 7-day streak! +500 points awarded!"
- **Streak started:** "Streak started! Keep ordering!"
- **Order doesn't qualify:** "Order must be ₦15,000+ to count for streak"

---

## 💰 Points System Integration

### total_points Column
The `profiles` table has a `total_points` column that tracks:
- All referral earnings (₦1,000 per referral)
- All streak rewards (₦500 per 7-day streak)
- Manual adjustments from admin
- Points spent on orders/earnings (10 points = ₦1)

### Points Calculation
```typescript
const newTotalPoints = currentTotalPoints + STREAK_REWARD_POINTS;
updateData.total_points = newTotalPoints;
```

### When Points Are Awarded
- ✅ User completes 7-day consecutive streak
- ✅ All orders in streak were ≥ ₦15,000
- ✅ Streak was at 6 days before final order
- ✅ 500 points added to `total_points`

---

## 🧪 How to Test the 7-Day Streak System

### Manual Testing Checklist

#### Test 1: First Order
- [ ] Clear localStorage
- [ ] Log in to account
- [ ] Place order ≥ ₦15,000
- [ ] Check dashboard
  - Expected: Streak = 1, "Streak started! Keep ordering!"

#### Test 2: Build to 7 Days
- [ ] Order daily for 7 days (each ≥ ₦15,000)
- [ ] Check dashboard after each order
  - Expected: Streak increments: 1 → 2 → 3 → 4 → 5 → 6 → 7
  - Expected: Dashboard shows "🔥 X day streak!"

#### Test 3: 7-Day Streak Completion
- [ ] After 7th day, check browser console
  - Expected: "🎉 7-DAY STREAK COMPLETED! Awarding 500 points"
- [ ] Check wallet/dashboard points
  - Expected: +500 points added to total

#### Test 4: Streak Reset After Award
- [ ] Place another order the next day
- [ ] Check dashboard
  - Expected: Streak = 1 (reset), "Streak started! Keep ordering!"

#### Test 5: Order Below Minimum
- [ ] Place order < ₦15,000
- [ ] Check dashboard
  - Expected: Streak doesn't change, "Order must be ₦15,000+ to count for streak"

#### Test 6: Skip Day Then Order
- [ ] Order Day 1
- [ ] Skip Day 2
- [ ] Order Day 3 (gap of 1 day)
- [ ] Check dashboard
  - Expected: Streak = 1 (reset), message about gap

---

## 📊 Expected Dashboard Behavior

### When User Has Active Streak (1-6 days)
- Shows: "X Day(s) in a Row!"
- Displays fire emoji
- Shows current streak counter
- Shows streak started date

### When 7-Day Streak Completed
- Shows: "🎉 Amazing! You completed a 7-day streak!"
- Awarded: 500 points
- Streak resets to 0
- Can start new streak immediately

### When No Streak
- Shows: "Start Your Streak Today!"
- Shows encouragement message
- Shows best streak achieved

### When Order Doesn't Qualify
- Streak doesn't update
- Shows: "Order must be ₦15,000+ to count for streak"

---

## 🔍 Debugging Guide

### Check Browser Console
Look for these logs when placing orders:
```
[Streak Update] User: <user-id>, Order total: <amount>
[Streak Update] Days diff: <diff>, Qualifies: <bool>
[Streak Update] About to complete 7-day streak: 6
[Streak Update] 🎉 7-DAY STREAK COMPLETED! Awarding 500 points
[Streak Update] Total points before: <old>, Adding: 500, New total: <new>
```

### Check Server Console (API logs)
```
✅ Streak update triggered for user: <id>
✅ 7-Day streak completed - awarding 500 points
✅ Updated total_points from <old> to <new>
```

### Check Database
```sql
-- Check streak and points
SELECT
  current_streak,
  longest_streak,
  last_order_date,
  streak_start_date,
  total_points
FROM profiles
WHERE id = '<your-user-id>';

-- Expected after completing 7-day streak:
-- - current_streak = 0 (reset)
-- - streak_start_date = NULL (reset)
-- - total_points = increased by 500
```

### Common Issues & Solutions

**Issue:** Streak doesn't increment
**Check:**
- Is order total ≥ ₦15,000?
- Are orders being placed on consecutive days?
- Is `/api/user/update-streak` being called?

**Issue:** Points not awarded
**Check:**
- Does streak reach 7 consecutive days?
- Check API response for `awardedPoints` field
- Check `total_points` in database

**Issue:** Streak resets incorrectly
**Check:**
- Check timezone settings in Supabase
- Verify `setHours(0,0,0,0)` is applied consistently
- Check server logs for streak calculation

---

## 📝 Files Modified

- ✅ `app/api/user/update-streak/route.ts` - Complete rewrite with 7-day streak logic
  - Added 7-day max limit
  - Added 500-point reward
  - Added total_points tracking
  - Enhanced logging
  - Better error messages

- ✅ `app/api/orders/route.ts` - Calls streak update on order creation (lines 353-370)

---

## 🎯 Success Criteria

The 7-day streak system is working correctly when:

✅ Streak increments on consecutive days with orders ≥ ₦15,000
✅ Streak resets when there's a gap in ordering
✅ Streak caps at 7 days maximum
✅ 500 points awarded when 7-day streak completed
✅ Streak resets to 0 after awarding points
✅ User can immediately start a new streak
✅ Points properly added to `total_points` field
✅ Dashboard displays accurate streak and points information
✅ Browser console shows streak completion notification

---

## 🎨 UI Updates Needed

Consider updating the dashboard to show:
- ✅ Points earned message when 7-day streak completes
- ✅ Total points balance display
- ✅ Clear indication of streak reset after completion
- ✅ Animation/celebration when reaching 7-day streak

---

**Status:** 🟢 Complete and Ready for Testing
