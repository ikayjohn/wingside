const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setTestStreak() {
  // Get a user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (userError) {
    console.error('Error fetching user:', userError)
    return
  }

  if (!users || users.length === 0) {
    console.error('No users found in profiles table')
    return
  }

  const userId = users[0].id
  console.log(`Setting test streak for user: ${userId}`)

  // Calculate dates
  const today = new Date()
  const streakStart = new Date(today)
  streakStart.setDate(streakStart.getDate() - 4) // 5 day streak

  // Format as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('profiles')
    .update({
      current_streak: 5,
      longest_streak: 7,
      last_order_date: formatDate(today),
      streak_start_date: formatDate(streakStart),
    })
    .eq('id', userId)
    .select()

  if (error) {
    console.error('Error updating streak:', error)
  } else {
    console.log('Successfully set test streak!')
    console.log('Current streak: 5 days')
    console.log('Longest streak: 7 days')
    console.log('Streak start date:', formatDate(streakStart))
    console.log('\nCheck your dashboard at http://localhost:3000/my-account/dashboard')
  }
}

setTestStreak()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
