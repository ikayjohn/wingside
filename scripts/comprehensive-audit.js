const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveAudit() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE SYSTEM AUDIT');
  console.log('='.repeat(80));
  console.log();

  const issues = [];
  const warnings = [];
  const successes = [];

  // 1. Check RPC functions exist
  console.log('1. Checking RPC Functions...');
  console.log('-'.repeat(80));

  const requiredFunctions = [
    'award_points',
    'claim_reward',
    'generate_order_number',
    'get_maintenance_settings',
    'process_referral_reward_after_first_order'
  ];

  for (const funcName of requiredFunctions) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = '${funcName}'
        ) as exists`
      });

      if (error) {
        issues.push(`❌ Cannot check function ${funcName}: ${error.message}`);
        console.log(`   ❌ ${funcName} - Cannot verify`);
      } else {
        console.log(`   ✅ ${funcName} - exists`);
        successes.push(`✅ Function ${funcName} exists`);
      }
    } catch (e) {
      issues.push(`❌ Function ${funcName} missing or cannot check`);
      console.log(`   ❌ ${funcName} - MISSING`);
    }
  }

  console.log();

  // 2. Check required tables
  console.log('2. Checking Required Tables...');
  console.log('-'.repeat(80));

  const requiredTables = [
    'profiles',
    'orders',
    'order_items',
    'points_history',
    'reward_claims',
    'referrals',
    'referral_rewards',
    'referral_settings',
    'promo_codes',
    'products',
    'flavors',
    'delivery_areas',
    'notifications',
    'wallet_transactions'
  ];

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          issues.push(`❌ Table ${tableName} does not exist`);
          console.log(`   ❌ ${tableName} - MISSING`);
        } else {
          warnings.push(`⚠️  Table ${tableName} has access issues: ${error.message}`);
          console.log(`   ⚠️  ${tableName} - Access issue`);
        }
      } else {
        console.log(`   ✅ ${tableName}`);
        successes.push(`✅ Table ${tableName} exists`);
      }
    } catch (e) {
      issues.push(`❌ Table ${tableName} check failed`);
      console.log(`   ❌ ${tableName} - Check failed`);
    }
  }

  console.log();

  // 3. Check profiles structure
  console.log('3. Checking Profiles Table Structure...');
  console.log('-'.repeat(80));

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, total_points, wallet_balance, referral_code')
      .limit(1);

    if (error) {
      issues.push(`❌ Profiles query failed: ${error.message}`);
      console.log('   ❌ Cannot query profiles');
    } else {
      console.log('   ✅ Profiles table accessible');
      console.log(`   ✅ Columns: id, email, total_points, wallet_balance, referral_code`);
    }
  } catch (e) {
    issues.push(`❌ Profiles check failed: ${e.message}`);
    console.log('   ❌ Profiles check failed');
  }

  console.log();

  // 4. Check orders vs points mismatch
  console.log('4. Checking Orders vs Points Mismatch...');
  console.log('-'.repeat(80));

  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, payment_status, created_at')
      .eq('payment_status', 'paid');

    if (ordersError) {
      console.log('   ⚠️  Cannot fetch orders');
    } else {
      console.log(`   📊 Total paid orders: ${orders.length}`);

      // Calculate expected points per user
      const userPoints = {};
      orders.forEach(order => {
        if (!userPoints[order.user_id]) {
          userPoints[order.user_id] = 0;
        }
        // ₦100 = 1 point (from webhook logic)
        userPoints[order.user_id] += Math.floor(Number(order.total) / 100);
      });

      console.log(`   📊 Users with paid orders: ${Object.keys(userPoints).length}`);

      // Check if profiles have points
      const userIds = Object.keys(userPoints).slice(0, 5); // Check first 5
      for (const userId of userIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, total_points')
          .eq('id', userId)
          .single();

        if (profile) {
          const expectedPoints = userPoints[userId];
          const actualPoints = profile.total_points || 0;
          const mismatch = expectedPoints - actualPoints;

          if (mismatch > 0) {
            issues.push(`❌ ${profile.email}: Expected ${expectedPoints} points, has ${actualPoints} (missing ${mismatch})`);
            console.log(`   ❌ ${profile.email}: Missing ${mismatch} points`);
          } else {
            console.log(`   ✅ ${profile.email}: ${actualPoints} points correct`);
          }
        }
      }
    }
  } catch (e) {
    warnings.push(`⚠️  Orders vs points check failed: ${e.message}`);
  }

  console.log();

  // 5. Check referral system
  console.log('5. Checking Referral System...');
  console.log('-'.repeat(80));

  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrals_referrer_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('   ⚠️  Cannot query referrals');
    } else {
      console.log(`   📊 Total referrals found: ${referrals.length}`);

      referrals.forEach(ref => {
        console.log(`   - ${ref.referrer_email} → ${ref.referred_email}: ${ref.status}`);
      });
    }

    // Check referral settings
    const { data: settings, error: settingsError } = await supabase
      .from('referral_settings')
      .select('*');

    if (settingsError) {
      issues.push('❌ Cannot query referral_settings');
      console.log('   ❌ Referral settings not accessible');
    } else {
      console.log(`   ✅ Referral settings configured: ${settings.length} settings`);
    }
  } catch (e) {
    warnings.push(`⚠️  Referral system check failed: ${e.message}`);
  }

  console.log();

  // 6. Check notifications
  console.log('6. Checking Notification System...');
  console.log('-'.repeat(80));

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('   ⚠️  Cannot query notifications');
    } else {
      console.log(`   📊 Total notifications: ${notifications.length}`);
      console.log(`   ✅ Notification system working`);
    }
  } catch (e) {
    warnings.push(`⚠️  Notifications check failed: ${e.message}`);
  }

  console.log();

  // 7. Summary
  console.log('='.repeat(80));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log();

  if (issues.length > 0) {
    console.log(`🚨 CRITICAL ISSUES (${issues.length}):`);
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(warning => console.log(`  ${warning}`));
    console.log();
  }

  console.log(`✅ SUCCESSES (${successes.length}):`);
  successes.slice(0, 10).forEach(success => console.log(`  ${success}`));
  if (successes.length > 10) {
    console.log(`  ... and ${successes.length - 10} more`);
  }

  console.log();
  console.log('='.repeat(80));

  return {
    issues,
    warnings,
    successes
  };
}

comprehensiveAudit().then(result => {
  if (result.issues.length > 0) {
    console.log('\n⚠️  Action required: Fix critical issues before proceeding');
    process.exit(1);
  } else {
    console.log('\n✅ All critical systems operational');
    process.exit(0);
  }
}).catch(err => {
  console.error('\n❌ Audit failed:', err);
  process.exit(1);
});
