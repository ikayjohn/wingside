const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDashboardAPI() {
  console.log('Checking Dashboard API Data for Mocha Badom...\n');

  // Get Mocha Badom's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'billionaireboyscorp@gmail.com')
    .single();

  if (error) {
    console.log('Error fetching profile:', error);
    return;
  }

  console.log('=== Raw Profile Data ===');
  console.log('Email:', profile.email);
  console.log('ID:', profile.id);
  console.log('Full Name:', profile.full_name);
  console.log('Total Points (raw):', profile.total_points);
  console.log('Points:', profile.points);
  console.log('Wallet Balance:', profile.wallet_balance);
  console.log();

  // Simulate what the dashboard API would calculate
  // Get orders for tier calculation
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, created_at, status, payment_status')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  console.log('=== Orders ===');
  console.log(`Total orders: ${orders?.length || 0}`);

  const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
  const confirmedOrders = orders?.filter(o => o.status === 'confirmed') || [];

  console.log(`Paid orders: ${paidOrders.length}`);
  console.log(`Confirmed orders: ${confirmedOrders.length}`);
  console.log();

  // Calculate what dashboard SHOULD show
  const totalPoints = profile.total_points || 0;

  // Tier calculation (from dashboard API)
  let currentTier = 'Wing Member';
  let nextTier = 'Wing Leader';
  let tierThreshold = 5000;

  if (totalPoints >= 20000) {
    currentTier = 'Wingzard';
    nextTier = 'Wingzard';
    tierThreshold = 20000;
  } else if (totalPoints >= 5001) {
    currentTier = 'Wing Leader';
    nextTier = 'Wingzard';
    tierThreshold = 20000;
  }

  // Points this month
  const now = new Date();
  const pointsThisMonth = Math.floor(
    orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === now.getMonth() &&
             orderDate.getFullYear() === now.getFullYear();
    })?.reduce((sum, order) => sum + Number(order.total), 0) || 0
  ) / 10;

  console.log('=== Dashboard Calculations ===');
  console.log('Total Points:', totalPoints);
  console.log('Current Tier:', currentTier);
  console.log('Next Tier:', nextTier);
  console.log('Tier Threshold:', tierThreshold);
  console.log('Points This Month:', pointsThisMonth);
  console.log('Convertible Points (50%):', Math.floor(totalPoints * 0.5));
  console.log();

  // Check if total_points column exists
  console.log('=== Column Check ===');
  console.log('Using total_points column directly:', profile.total_points);
  console.log('Using points column:', profile.points);
}

checkDashboardAPI().catch(err => console.error(err));
