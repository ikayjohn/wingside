// Direct referral code generator using service role admin access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize admin client with service role key
const adminSupabase = createClient(
  process.env.SUPABASE_URL || 'https://cxbqochxrhokdscgijxe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Enhanced referral code generator
function generateReferralCode(firstName, lastName, existingCodes = []) {
  const cleanName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8);
  };

  const namePart = cleanName(firstName + lastName);
  if (namePart.length < 3) {
    return cleanName(firstName) + Math.floor(Math.random() * 1000);
  }

  let baseCode = namePart;
  let counter = 1;
  let finalCode = baseCode;

  while (existingCodes.includes(finalCode)) {
    counter++;
    finalCode = `${basePart}${counter}`;
  }

  return finalCode;
}

async function generateReferralCodesForAllUsers() {
  console.log('🚀 Starting referral code generation...\n');

  try {
    // Step 1: Get all users without referral codes
    console.log('📋 Step 1: Fetching users without referral codes...');
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, referral_code')
      .is('referral_code', null);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles.length} users without referral codes`);

    if (profiles.length === 0) {
      console.log('✅ All users already have referral codes!');
      return;
    }

    // Step 2: Get existing referral codes to avoid duplicates
    console.log('\n📋 Step 2: Checking existing referral codes...');
    const { data: existingProfilesWithCodes } = await adminSupabase
      .from('profiles')
      .select('referral_code')
      .not('referral_code', 'is', null);

    const existingCodes = existingProfilesWithCodes
      ? existingProfilesWithCodes.map(p => p.referral_code).filter(Boolean)
      : [];

    console.log(`Found ${existingCodes.length} existing referral codes`);

    // Step 3: Generate unique referral codes for each user
    console.log('\n📋 Step 3: Generating unique referral codes...');
    const updates = [];

    for (const profile of profiles) {
      let firstName = '';
      let lastName = '';

      // Parse full name
      if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      }

      // If no name, use email prefix
      if (!firstName) {
        firstName = profile.email?.split('@')[0] || 'user';
      }

      const referralCode = generateReferralCode(firstName, lastName, existingCodes);

      // Add to existing codes to avoid conflicts in this batch
      existingCodes.push(referralCode);

      updates.push({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        referral_code: referralCode,
        first_name: firstName,
        last_name: lastName
      });

      console.log(`  📝 ${profile.email} → ${referralCode}`);
    }

    // Step 4: Update profiles with new referral codes
    console.log('\n📋 Step 4: Updating profiles with referral codes...');
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          referral_code: update.referral_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Error updating ${update.email}:`, updateError);
        errorCount++;
      } else {
        console.log(`  ✅ Updated ${update.email} with referral code: ${update.referral_code}`);
        successCount++;
      }
    }

    // Step 5: Generate summary report
    console.log('\n📊 Referral Code Generation Summary:');
    console.log(`  Total users processed: ${updates.length}`);
    console.log(`  Successfully updated: ${successCount}`);
    console.log(`  Failed updates: ${errorCount}`);
    console.log(`  Total unique codes in system: ${existingCodes.length}`);

    console.log('\n🎉 Referral code generation completed!');

    return {
      success: true,
      totalUpdated: successCount,
      totalFailed: errorCount,
      users: updates
    };

  } catch (error) {
    console.error('\n❌ Error during referral code generation:', error);
    throw error;
  }
}

// Additional function to check current status
async function checkReferralStatus() {
  try {
    const { data: totalUsers, count: totalCount } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: usersWithCodes, count: withCodesCount } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('referral_code', 'is', null);

    const { data: usersWithoutCodes, count: withoutCodesCount } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('referral_code', null);

    console.log('📊 Current Referral Code Status:');
    console.log(`  Total users: ${totalCount}`);
    console.log(`  Users with codes: ${withCodesCount}`);
    console.log(`  Users without codes: ${withoutCodesCount}`);
    console.log(`  Percentage with codes: ${totalCount ? Math.round((withCodesCount / totalCount) * 100) : 0}%`);

  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Run the script
async function main() {
  // Check current status first
  await checkReferralStatus();

  console.log('\n' + '='.repeat(60) + '\n');

  // Generate codes
  await generateReferralCodesForAllUsers();

  console.log('\n' + '='.repeat(60) + '\n');

  // Check final status
  await checkReferralStatus();
}

// Check if running directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateReferralCodesForAllUsers,
  generateReferralCode,
  checkReferralStatus
};