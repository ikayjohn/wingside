import { createClient } from '@/lib/supabase/server';

/**
 * Update user's order streak after successful payment
 */
export async function updateOrderStreak(userId: string) {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, streak_start_date, last_order_date')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const lastOrderDate = profile.last_order_date ? new Date(profile.last_order_date) : null;
  const currentStreak = profile.current_streak || 0;
  const longestStreak = profile.longest_streak || 0;

  let newStreak = currentStreak;
  let newLongestStreak = longestStreak;
  let streakStartDate = profile.streak_start_date;

  if (!lastOrderDate) {
    // First order ever
    newStreak = 1;
    streakStartDate = today.toISOString();
  } else {
    const lastOrderDay = new Date(lastOrderDate);
    lastOrderDay.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastOrderDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day - no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      newStreak = currentStreak + 1;
    } else {
      // Streak broken, restart
      newStreak = 1;
      streakStartDate = today.toISOString();
    }
  }

  // Update longest streak if current exceeds it
  if (newStreak > longestStreak) {
    newLongestStreak = newStreak;
  }

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      streak_start_date: streakStartDate,
      last_order_date: today.toISOString()
    })
    .eq('id', userId);

  console.log(`🔥 Streak updated: ${newStreak} days (Longest: ${newLongestStreak})`);
}
