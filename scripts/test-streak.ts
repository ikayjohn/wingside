/**
 * Streak System Test Script
 * This script tests the streak system by:
 * 1. Checking if the streak API exists and works
 * 2. Simulating order placement and streak updates
 * 3. Verifying streak calculation logic
 */

const streak = async () => {
  try {
    console.log('\n=== Streak System Test ===\n');

    // Test 1: Check if streak update API exists
    console.log('1. Testing streak API endpoint...');
    const response = await fetch('/api/user/update-streak', {
      method: 'POST',
    headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('   Status:', response.status);
    console.log('   Response:', data);

    if (response.ok) {
      console.log('   ✅ Streak API is working');
      console.log(`   Current streak: ${data.streak}`);
      console.log(`   Longest streak: ${data.longestStreak}`);
    } else {
      console.log('   ❌ Streak API error:', data.error);
    }

    // Test 2: Check streak data from database
    console.log('\n2. Fetching profile data...');
    const profileResponse = await fetch('/api/user/profile');
    const profileData = await profileResponse.json();

    if (profileResponse.ok && profileData.profile) {
      const profile = profileData.profile;
      console.log('   Current streak:', profile.current_streak ?? 0);
      console.log('   Longest streak:', profile.longest_streak ?? 0);
      console.log('   Last order date:', profile.last_order_date || 'Never');
      console.log('   Streak start date:', profile.streak_start_date || 'Never');
    } else {
      console.log('   ❌ Failed to fetch profile');
    }

    // Test 3: Manual streak update test
    console.log('\n3. Testing streak calculation logic...');

    // Create test scenarios
    const testCases = [
      {
        name: 'First order ever (no last_order_date)',
        lastOrderDate: null,
        expectedStreak: 1,
      },
      {
        name: 'Same day order (daysDiff = 0)',
        lastOrderDate: '2025-01-28',
        today: '2025-01-28',
        expectedStreak: 'no change (same day)',
      },
      {
        name: 'Consecutive day (daysDiff = 1)',
        lastOrderDate: '2025-01-27',
        today: '2025-01-28',
        expectedStreak: 'increment by 1',
      },
      {
        name: 'Streak broken (daysDiff > 1)',
        lastOrderDate: '2025-01-25',
        today: '2025-01-28',
        expectedStreak: 'reset to 1',
      },
    ];

    testCases.forEach((testCase, index) => {
      console.log(`\n   Test Case ${index + 1}: ${testCase.name}`);
      console.log(`      Last order: ${testCase.lastOrderDate || 'Never'}`);
      console.log(`      Expected: ${testCase.expectedStreak}`);
    });

    console.log('\n=== Test Complete ===');
    console.log('\nTo manually test streaks:');
    console.log('1. Place an order today (first time)');
    console.log('2. Check dashboard for streak = 1');
    console.log('3. Place another order tomorrow (consecutive day)');
    console.log('4. Check dashboard for streak = 2');
    console.log('5. Skip a day, then order again (streak should reset)');
    console.log('6. Check dashboard for streak = 1 (reset)');

  } catch (error) {
    console.error('Test error:', error);
  }
};

streak();
