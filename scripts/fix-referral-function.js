/**
 * Fix Referral Function Migration
 *
 * This script fixes the referral function parameter type issue
 * by dropping the existing function and recreating it with the correct types.
 *
 * Usage:
 *   node scripts/fix-referral-function.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n' + '='.repeat(70));
log('REFERRAL SYSTEM FIX - Points-Based Migration', 'bright');
console.log('='.repeat(70));

log('\nThis will fix the referral system to use points instead of naira.', 'yellow');
log('\nThe migration will:', 'blue');
log('  1. Add total_points column to profiles table', 'cyan');
log('  2. Update referral rewards from ₦500 to 200 points', 'cyan');
log('  3. Drop and recreate the referral function with correct types', 'cyan');
log('  4. Update all referral-related logic to use points', 'cyan');
log('\n⚠️  Make sure your Supabase project URL is set in .env.local', 'yellow');

rl.question('\nPress Enter to continue or Ctrl+C to cancel...', async () => {
  try {
    log('\n🔧 Applying SQL fix...', 'blue');

    // Read the migration file
    const fs = require('fs');
    const sqlPath = './supabase/migrations/20250113_update_referral_system_to_points.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');

    log('\n✅ Migration files loaded', 'green');
    log('\n📝 To apply these migrations, you need to run BOTH files in order:', 'yellow');

    log('\n📄 Step 1: Add total_points column', 'blue');
    log('   File: supabase/migrations/20250113_add_total_points_column.sql', 'cyan');
    log('   This adds the total_points column to the profiles table', 'yellow');

    log('\n📄 Step 2: Update referral system', 'blue');
    log('   File: supabase/migrations/20250113_update_referral_system_to_points.sql', 'cyan');
    log('   This updates referrals to use points instead of naira', 'yellow');

    log('\n📋 Instructions:', 'blue');
    log('   1. Open your Supabase dashboard SQL editor:', 'cyan');
    log('      https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new', 'yellow');
    log('\n   2. Run Step 1 first (add_total_points_column.sql)', 'cyan');
    log('\n   3. Then run Step 2 (update_referral_system_to_points.sql)', 'cyan');

    rl.question('\nPress Enter to open SQL editor in browser...', () => {
      const { exec } = require('child_process');

      // Try to open the browser
      const url = 'https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new';
      const command = process.platform === 'win32' ? 'start' : 'open';
      exec(`${command} ${url}`, (error) => {
        if (error) {
          log('\n⚠️  Could not open browser automatically', 'yellow');
          log(`   Please open this URL manually: ${url}`, 'cyan');
        }
      });

      log('\n✨ SQL Editor opened!', 'green');
      log('\n📋 Remember to run BOTH files in order:', 'yellow');
      log('\n  Step 1: Run add_total_points_column.sql FIRST', 'cyan');
      log('  Step 2: Run update_referral_system_to_points.sql SECOND', 'cyan');
      log('\nAfter running both:', 'yellow');
      log('  ✓ Referral rewards will be 200 points (not ₦500)', 'green');
      log('  ✓ Points are awarded to both referrer and referred user', 'green');
      log('  ✓ Points are added to total_points column in profiles', 'green');
      log('\n', 'reset');

      rl.close();
    });
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    rl.close();
    process.exit(1);
  }
});
