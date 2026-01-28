# Streak System Test Guide

## 🐛 Bug Found & Fixed

**Issue:** The streak system API (`/api/user/update-streak`) exists but was **never called** when orders were created.

**Fix Applied:** Added streak update call to `/api/orders` POST endpoint (line 353-370 in `app/api/orders/route.ts`).

---

## 🧪 How Streaks Work

A streak is a count of **consecutive days** a user places an order:

### Streak Rules:
1. **First order ever** → Streak = 1, Start date = today
2. **Same day (daysDiff = 0)** → No change (streak not updated twice in one day)
3. **Consecutive day (daysDiff = 1)** → Streak + 1
4. **Streak broken (daysDiff > 1)** → Reset to 1, New start date = today

### Example:
- Day 1: Order placed → Streak = 1
- Day 2: Order placed → Streak = 2
- Day 3: No order → No change
- Day 4: Order placed → Streak = 3
- Day 5: No order → No change
- Day 8: Order placed (streak broken, gap > 1 day) → Streak = 1 (reset)

---

## 🧪 How to Test the Streak System

### Option 1: Manual Testing (Recommended)

#### Test 1: First Order
1. Clear browser localStorage: `localStorage.clear()`
2. Log in to your account
3. Go to `/my-account/dashboard`
4. Note your current streak (should be 0)
5. Place your first order (any amount ₦1,000+)
6. After order completion, refresh dashboard
7. **Expected:** Streak = 1, message: "1 Day in a Row!"

#### Test 2: Consecutive Days
1. Order another item the next day
2. Refresh dashboard
3. **Expected:** Streak = 2, message: "2 Days in a Row!"

#### Test 3: Same Day (No Change)
1. Place another order the same day
2. Refresh dashboard
3. **Expected:** Streak still = 2 (no change, same day)

#### Test 4: Streak Reset
1. Don't order for 2 days
2. Place order on day 3
3. Refresh dashboard
4. **Expected:** Streak = 1 (reset because gap > 1 day)

#### Test 5: Long Streak
1. Place orders for 7 consecutive days
2. Refresh dashboard
3. **Expected:**
   - Streak = 7
   - Message: "🔥 7 day streak! 🔥 Amazing!"
   - Badge/celebration UI

### Option 2: Database Direct Test (Advanced)

```sql
-- Check your current streak
SELECT
  current_streak,
  longest_streak,
  last_order_date,
  streak_start_date
FROM profiles
WHERE id = '<your-user-id>';

-- Check streak calculation logic
-- The streak should increment when:
-- 1. last_order_date is today (daysDiff = 0) → no change
-- 2. last_order_date is yesterday (daysDiff = 1) → +1 streak
-- 3. last_order_date is older (daysDiff > 1) → reset to 1

-- To manually test, you can update last_order_date:
UPDATE profiles
SET last_order_date = '2025-01-27'  -- Yesterday
WHERE id = '<your-user-id>';

-- Then place an order today, streak should increment to current + 1
```

---

## ✅ Streak System Now Working

After the fix, the streak system should:
- ✅ Update streaks automatically when orders are created
- ✅ Track longest streak achieved
- ✅ Reset streak when consecutive ordering stops
- ✅ Display streak information on dashboard
- ✅ Show motivational messages based on streak length

---

## 🔍 Debugging Tips

If streaks still don't update, check:

### 1. Check Browser Console
```
// Look for these logs when placing orders:
✅ Streak update triggered for user: <user-id>
✅ Order created with order_number: <number>
```

### 2. Check Server Console
Look for streak update API logs:
```
[Streak Update] User: <user-id> placed order on <date>
[Streak Update] Previous streak: <number>
[Streak Update] New streak: <number>
[Streak Update] Streak updated: <message>
```

### 3. Check Database
```sql
SELECT
  current_streak,
  longest_streak,
  last_order_date,
  streak_start_date
FROM profiles
WHERE id = auth.uid();
```

### 4. Common Issues

**Issue:** Streak always shows 0
**Solution:** Verify `/api/user/update-streak` is being called after order creation

**Issue:** Streak doesn't increment
**Solution:** Check if `last_order_date` is being updated correctly in profiles table

**Issue:** Streak resets incorrectly
**Solution:** Check timezone issues in date comparison (code uses UTC with setHours(0,0,0,0))

---

## 📊 Expected Dashboard Behavior

When you visit `/my-account/dashboard`, you should see:

### Active Streak Display
- Shows "X Day(s) in a Row!" with fire emoji
- Different messages based on streak length:
  - 1-2 days: "Great streak! Keep ordering!"
  - 3-6 days: "🔥 X day streak! You're on fire!"
  - 7+ days: "🔥🔥🔥 Amazing! X day streak! Legendary!"

### Stats Cards
- **Current Streak:** Shows active consecutive days
- **Best Streak:** Shows longest streak achieved
- **Streak Started:** Shows when current streak began

### No Streak State
When current_streak = 0:
- Shows "Start Your Streak Today!" CTA
- Displays encouragement message

---

## 🎯 Success Criteria

The streak system is working correctly if:

✅ Streak increments on consecutive days of ordering
✅ Streak doesn't change on same-day repeat orders
✅ Streak resets when there's a gap in ordering
✅ Longest streak updates when broken
✅ Dashboard displays accurate streak information
✅ Browser console shows "✅ Streak update triggered" after orders

---

## 📝 Modified Files

- `app/api/orders/route.ts` - Added streak update call (lines 353-370)
