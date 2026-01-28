import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MIN_ORDER_AMOUNT_FOR_STREAK = 15000; // ₦15,000
const MAX_STREAK_DAYS = 7; // Maximum 7-day streak
const STREAK_REWARD_POINTS = 500; // Points awarded for completing a 7-day streak

/**
 * Update user's order streak after successful payment (Advanced 7-Day System)
 *
 * @param userId - The user's profile ID
 * @param orderTotal - The total order amount in Naira
 * @param useAdminClient - Whether to use admin client (for webhooks) or regular client
 * @returns Object with streak info and rewards
 */
export async function updateOrderStreak(
  userId: string,
  orderTotal: number = 0,
  useAdminClient: boolean = false
) {
  const supabase = useAdminClient ? createAdminClient() : await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('[Streak Update] User:', userId, 'Order total:', orderTotal);

  // Get current user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_order_date, streak_start_date, total_points')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for streak update:', profileError);
    return { streak: 0, message: 'Profile not found' };
  }

  const lastOrderDate = profile.last_order_date ? new Date(profile.last_order_date) : null;
  if (lastOrderDate) {
    lastOrderDate.setHours(0, 0, 0, 0);
  }

  let currentStreak = profile.current_streak || 0;
  let longestStreak = profile.longest_streak || 0;
  let streakStartDate = profile.streak_start_date ? new Date(profile.streak_start_date) : today;
  const currentTotalPoints = profile.total_points || 0;

  // Calculate if this is a consecutive day
  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysDiff = lastOrderDate ? Math.floor((today.getTime() - lastOrderDate.getTime()) / oneDayMs) : null;

  // Check if order qualifies for streak (must be >= ₦15,000)
  const qualifiesForStreak = orderTotal >= MIN_ORDER_AMOUNT_FOR_STREAK;

  console.log('[Streak Update] Days diff:', daysDiff, 'Qualifies:', qualifiesForStreak, 'Current streak:', currentStreak);

  // Track if we just completed a 7-day streak and awarded points
  let awardedPoints = 0;
  let streakCompletedMessage = '';

  if (!lastOrderDate) {
    // First order ever
    if (qualifiesForStreak) {
      currentStreak = 1;
      streakStartDate = today;
      console.log('[Streak Update] First qualifying order - streak set to 1');
    } else {
      console.log('[Streak Update] First order but does not qualify (<₦' + MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString() + ')');
      return {
        streak: currentStreak,
        longestStreak,
        qualifiesForStreak: false,
        message: `Order must be ₦${MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString()}+ to count for streak`
      };
    }
  } else if (daysDiff === 0) {
    // Same day - don't update streak (already updated today)
    console.log('[Streak Update] Same day - no update');
    return {
      streak: currentStreak,
      longestStreak,
      qualifiesForStreak,
      message: 'Already updated today'
    };
  } else if (daysDiff === 1 && qualifiesForStreak) {
    // Consecutive day with qualifying order - increment streak
    currentStreak += 1;
    console.log('[Streak Update] Consecutive qualifying day - streak incremented to', currentStreak);

    // Check if user just completed a 7-day streak
    if (currentStreak === MAX_STREAK_DAYS) {
      console.log('[Streak Update] *** 7-day streak completed - awarding', STREAK_REWARD_POINTS, 'points');

      awardedPoints = STREAK_REWARD_POINTS;
      streakCompletedMessage = `*** Amazing! You completed a ${MAX_STREAK_DAYS}-day streak! ${STREAK_REWARD_POINTS} points awarded!`;

      // Reset streak to 0 for new streak
      currentStreak = 0;
      streakStartDate = null;
    }
  } else if (daysDiff === 1 && !qualifiesForStreak) {
    // Consecutive day but order doesn't qualify - don't update streak
    console.log('[Streak Update] Consecutive day but order does not qualify (<₦' + MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString() + ')');
    return {
      streak: currentStreak,
      longestStreak,
      qualifiesForStreak: false,
      message: `Order must be ₦${MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString()}+ to count for streak`
    };
  } else {
    // Streak broken (daysDiff > 1) - start new streak
    // Check if today's order qualifies
    if (qualifiesForStreak) {
      currentStreak = 1;
      streakStartDate = today;
      console.log('[Streak Update] Streak broken but qualifying order - reset to 1');
    } else {
      console.log('[Streak Update] Streak broken and order does not qualify (<₦' + MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString() + ')');
      return {
        streak: 0,
        longestStreak,
        qualifiesForStreak: false,
        message: `Order must be ₦${MIN_ORDER_AMOUNT_FOR_STREAK.toLocaleString()}+ to count for streak`
      };
    }
  }

  // Update longest streak if needed
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    console.log('[Streak Update] New longest streak:', longestStreak);
  }

  // Prepare update data
  const updateData: any = {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_order_date: today.toISOString().split('T')[0],
  };

  // Only set streak_start_date if there's an active streak
  if (currentStreak > 0) {
    updateData.streak_start_date = streakStartDate.toISOString().split('T')[0];
  } else {
    updateData.streak_start_date = null;
  }

  // Add points to total if streak was completed
  if (awardedPoints > 0) {
    updateData.total_points = currentTotalPoints + awardedPoints;
    console.log('[Streak Update] Total points before:', currentTotalPoints, 'Adding:', awardedPoints, 'New total:', updateData.total_points);
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating streak:', updateError);
    return {
      streak: currentStreak,
      longestStreak,
      error: 'Failed to update streak'
    };
  }

  let message = '';
  if (streakCompletedMessage) {
    message = streakCompletedMessage;
  } else if (currentStreak > 1) {
    message = `* ${currentStreak} day streak!`;
  } else if (currentStreak === 1 && qualifiesForStreak) {
    message = 'Streak started! Keep ordering!';
  }

  console.log(`* Streak updated: ${currentStreak} days (Longest: ${longestStreak})`, message);

  return {
    streak: currentStreak,
    longestStreak,
    message,
    qualifiesForStreak,
    awardedPoints,
    streakCompleted: streakCompletedMessage !== ''
  };
}
