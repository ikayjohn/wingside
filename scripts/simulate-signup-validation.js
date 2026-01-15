// Simulate exact signup validation logic
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateSignupValidation(referralId) {
  console.log('🔄 Simulating signup validation...\n');
  console.log(`Input referral ID: "${referralId}"`);
  console.log(`Trimmed: "${referralId.trim()}"`);
  console.log(`Lowercase: "${referralId.trim().toLowerCase()}"`);

  // Exact copy of the signup logic
  const referredByUserId = null;
  if (referralId.trim()) {
    const { data: referrerData, error: referrerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralId.trim().toLowerCase())
      .single();

    console.log('\n📋 Query Result:');
    console.log(`   Data: ${JSON.stringify(referrerData)}`);
    console.log(`   Error: ${referrerError ? JSON.stringify(referrerError) : 'null'}`);

    if (!referrerError && referrerData) {
      console.log('\n✅ SUCCESS: Referral code is valid!');
      console.log(`   Referrer ID: ${referrerData.id}`);
      return { success: true, referrerId: referrerData.id };
    } else {
      console.log('\n❌ FAILED: Invalid referral ID');
      if (referrerError) {
        console.log(`   Error message: ${referrerError.message}`);
        console.log(`   Error details: ${JSON.stringify(referrerError)}`);
      }
      return { success: false, error: referrerError };
    }
  }

  return { success: true, referrerId: null };
}

async function checkTableCaseSensitivity() {
  console.log('\n🔍 Checking table case sensitivity...\n');

  // Test with exact case
  const { data: exact } = await supabase
    .from('profiles')
    .select('id, email, referral_code')
    .eq('referral_code', 'rogetest969')
    .limit(5);

  console.log(`Exact match "rogetest969": ${exact?.length || 0} results`);

  // Test with uppercase
  const { data: upper } = await supabase
    .from('profiles')
    .select('id, email, referral_code')
    .eq('referral_code', 'ROGETEST969')
    .limit(5);

  console.log(`Uppercase "ROGETEST969": ${upper?.length || 0} results`);

  // Test with mixed case
  const { data: mixed } = await supabase
    .from('profiles')
    .select('id, email, referral_code')
    .eq('referral_code', 'RoGeTeSt969')
    .limit(5);

  console.log(`Mixed case "RoGeTeSt969": ${mixed?.length || 0} results`);
}

async function main() {
  const testCode = process.argv[2] || 'rogetest969';

  console.log('='.repeat(80));
  console.log('SIGNUP VALIDATION SIMULATION');
  console.log('='.repeat(80));

  await simulateSignupValidation(testCode);
  await checkTableCaseSensitivity();

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
