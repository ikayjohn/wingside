const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestNotifications() {
  // First, get a user to add notifications for
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
  console.log(`Adding test notifications for user: ${userId}`)

  const testNotifications = [
    {
      user_id: userId,
      type: 'order',
      title: 'Order Delivered!',
      message: 'Your order #WC123456 has been delivered. Enjoy your wings!',
      read: false,
      metadata: { order_number: 'WC123456' }
    },
    {
      user_id: userId,
      type: 'reward',
      title: 'Points Earned!',
      message: 'You earned 50 points from your recent order. Keep ordering to earn more!',
      read: false,
      metadata: { points_earned: 50 }
    },
    {
      user_id: userId,
      type: 'promotion',
      title: 'Special Offer',
      message: 'Get 20% off your next order with code WINGS20. Limited time offer!',
      read: true,
      metadata: { promo_code: 'WINGS20', discount: 20 }
    },
    {
      user_id: userId,
      type: 'tier',
      title: 'Tier Progress',
      message: 'You\'re 100 points away from Wing Leader tier! Order more to unlock exclusive perks.',
      read: true,
      metadata: { points_to_next_tier: 100, next_tier: 'Wing Leader' }
    },
    {
      user_id: userId,
      type: 'system',
      title: 'Welcome to Wingside!',
      message: 'Thank you for joining Wingside! Start ordering and earn rewards today.',
      read: true,
      metadata: {}
    }
  ]

  const { data, error } = await supabase
    .from('notifications')
    .insert(testNotifications)
    .select()

  if (error) {
    console.error('Error inserting notifications:', error)
  } else {
    console.log(`Successfully added ${data.length} test notifications!`)
    console.log('Notifications:', data)
  }
}

addTestNotifications()
  .then(() => {
    console.log('\nDone! Check your dashboard at http://localhost:3000/my-account/dashboard')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
