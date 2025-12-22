// Script to generate unique referral codes for all existing users
// This script will:
// 1. Find all users without referral codes
// 2. Generate unique referral codes based on first name + last name + number
// 3. Update profiles table with new referral codes
// 4. Handle duplicates by incrementing numbers

const { createClient } = require('@supabase/supabase-js');
const { createAdminClient } = require('../lib/supabase/admin');

// Initialize Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const adminSupabase = createAdminClient();

// Enhanced referral code generator
function generateReferralCode(firstName, lastName, existingCodes = []) {
  // Clean and normalize the name parts
  const cleanName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8); // Limit to 8 characters
  };

  const namePart = cleanName(firstName + lastName);
  if (namePart.length < 3) {
    // If name is too short, use first name only
    return cleanName(firstName) + Math.floor(Math.random() * 1000);
  }

  let baseCode = namePart;
  let counter = 1;
  let finalCode = baseCode;

  // Keep incrementing until we find a unique code
  while (existingCodes.includes(finalCode)) {
    counter++;
    finalCode = `${basePart}${counter}`;
  }

  return finalCode;
}

// Main function to generate referral codes for all users
async function generateReferralCodesForAllUsers() {
  console.log('🚀 Starting referral code generation for all users...\n');

  try {
    // Step 1: Get all profiles without referral codes
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
      } else {
        console.log(`  ✅ Updated ${update.email} with referral code: ${update.referral_code}`);
      }
    }

    // Step 5: Generate summary report
    console.log('\n📊 Referral Code Generation Summary:');
    console.log(`  Total users processed: ${updates.length}`);
    console.log(`  Referral codes generated: ${updates.length}`);
    console.log(`  Total unique codes in system: ${existingCodes.length + updates.length}`);

    // Step 6: Test a few codes to verify they work
    console.log('\n📋 Step 5: Verifying generated codes...');
    const { data: verification } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, referral_code')
      .in('referral_code', updates.slice(0, 3).map(u => u.referral_code));

    if (verification) {
      console.log('✅ Verification successful - sample codes:');
      verification.forEach(user => {
        console.log(`  ${user.full_name} (${user.email}): ${user.referral_code}`);
      });
    }

    console.log('\n🎉 Referral code generation completed successfully!');

    return {
      success: true,
      totalUpdated: updates.length,
      users: updates
    };

  } catch (error) {
    console.error('\n❌ Error during referral code generation:', error);
    throw error;
  }
}

// Additional function to generate referral code for a single user
async function generateReferralCodeForUser(userId) {
  console.log(`🔍 Generating referral code for user ID: ${userId}`);

  try {
    // Get user details
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, referral_code')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User not found');
    }

    // Get existing codes
    const { data: existingCodes } = await adminSupabase
      .from('profiles')
      .select('referral_code')
      .not('referral_code', 'is', null);

    const codeList = existingCodes ? existingCodes.map(p => p.referral_code) : [];

    // Generate new code
    let firstName = '';
    let lastName = '';

    if (profile.full_name) {
      const nameParts = profile.full_name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    }

    if (!firstName) {
      firstName = profile.email?.split('@')[0] || 'user';
    }

    const newReferralCode = generateReferralCode(firstName, lastName, codeList);

    // Update user
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        referral_code: newReferralCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated referral code for ${profile.email}: ${newReferralCode}`);
    return newReferralCode;

  } catch (error) {
    console.error(`❌ Error generating referral code for user ${userId}:`, error);
    throw error;
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateReferralCodesForAllUsers,
    generateReferralCodeForUser,
    generateReferralCode
  };
}

// Run the script if called directly
if (typeof require !== 'undefined' && require.main === module) {
  generateReferralCodesForAllUsers()
    .then(result => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}