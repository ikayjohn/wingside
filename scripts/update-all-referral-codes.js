// Update all existing users' referral codes to use new name-based format
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName, lastName) {
  // Clean and format names
  const cleanFirst = (firstName || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = (lastName || '').replace(/[^a-zA-Z]/g, '').toLowerCase();

  // Take first 4 chars of first name and first 4 chars of last name
  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  // Generate 3 random digits
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  // Combine: FIRST4 + LAST4 + 3DIGITS
  let code = `${firstPart}${lastPart}${randomDigits}`;

  // Ensure code is at least 5 characters
  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 4).toUpperCase();
    code = `${code}${extraRandom}`;
  }

  // Max length 15 characters
  return code.slice(0, 15);
}

// Check if referral code already exists
async function isCodeUnique(code, excludeUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .neq('id', excludeUserId)
    .limit(1);

  if (error) {
    console.error('Error checking code uniqueness:', error);
    return true; // Assume unique on error to avoid infinite loop
  }

  return !data || data.length === 0;
}

async function generateUniqueCode(firstName, lastName, userId) {
  let attempts = 0;
  let code;

  do {
    code = generateReferralCode(firstName, lastName);
    attempts++;

    if (attempts > 100) {
      throw new Error(`Could not generate unique code for ${firstName} ${lastName}`);
    }
  } while (!(await isCodeUnique(code, userId)));

  return code;
}

async function updateAllReferralCodes() {
  console.log('🔄 Fetching all users from database...\n');

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, referral_code')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles found');
    return;
  }

  console.log(`📊 Found ${profiles.length} profiles\n`);
  console.log('='.repeat(80));

  let updateCount = 0;
  let skipCount = 0;
  let errors = [];

  for (const profile of profiles) {
    try {
      // Parse name
      const nameParts = (profile.full_name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      if (!firstName || !lastName) {
        console.log(`⏭️  SKIP ${profile.email}: No name available`);
        skipCount++;
        continue;
      }

      // Generate new code
      const newCode = await generateUniqueCode(firstName, lastName, profile.id);
      const oldCode = profile.referral_code;

      console.log(`\n🔄 Processing: ${profile.email}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Old Code: ${oldCode || 'NONE'}`);
      console.log(`   New Code: ${newCode}`);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log(`   ✅ Updated successfully`);
      updateCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errors.push({
        email: profile.email,
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total profiles: ${profiles.length}`);
  console.log(`✅ Successfully updated: ${updateCount}`);
  console.log(`⏭️  Skipped (no name): ${skipCount}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Failed updates:');
    errors.forEach(err => {
      console.log(`   - ${err.email}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Done!');
  console.log('='.repeat(80));
}

async function showPreview() {
  console.log('\n🔍 Preview: What will change?\n');
  console.log('Getting first 10 users as examples...\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, referral_code')
    .limit(10)
    .order('created_at', { ascending: true });

  if (error || !profiles) {
    console.error('Error fetching profiles');
    return;
  }

  console.log('EMAIL'.padEnd(40), 'OLD CODE'.padEnd(20), 'NEW CODE');
  console.log('='.repeat(80));

  for (const profile of profiles) {
    const nameParts = (profile.full_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    if (firstName && lastName) {
      const newCode = generateReferralCode(firstName, lastName);
      console.log(
        profile.email.substring(0, 40).padEnd(40),
        (profile.referral_code || 'NONE').padEnd(20),
        newCode
      );
    }
  }

  console.log('='.repeat(80));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0 && args[0] === '--preview') {
    await showPreview();
  } else if (args.length > 0 && args[0] === '--confirm') {
    await updateAllReferralCodes();
  } else {
    console.log('⚠️  This will update ALL referral codes in the database!\n');
    console.log('Step 1: Preview changes (recommended)');
    console.log('  node scripts/update-all-referral-codes.js --preview\n');
    console.log('Step 2: Execute update');
    console.log('  node scripts/update-all-referral-codes.js --confirm\n');
    console.log('The new format: firstName(4) + lastName(4) + 3 random digits');
    console.log('Example: johndoe123');
  }
}

main().catch(console.error);
