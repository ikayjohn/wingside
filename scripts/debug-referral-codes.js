// Debug referral codes in database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugReferralCodes() {
  console.log('🔍 Fetching all referral codes from database...\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, full_name, referral_code')
    .not('referral_code', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${profiles.length} profiles with referral codes:\n`);
  console.log('EMAIL'.padEnd(40), 'NAME'.padEnd(25), 'REFERRAL CODE');
  console.log('='.repeat(100));

  profiles.forEach(profile => {
    console.log(
      profile.email.substring(0, 40).padEnd(40),
      (profile.full_name || '').substring(0, 25).padEnd(25),
      profile.referral_code || 'NULL'
    );
  });

  console.log('\n' + '='.repeat(100));

  // Test a specific code
  const testCode = 'johndoe123';
  console.log(`\n🧪 Testing search for code: "${testCode}"`);

  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('email, referral_code')
    .eq('referral_code', testCode)
    .single();

  if (testError) {
    console.log('❌ Not found:', testError.message);
  } else {
    console.log('✅ Found:', testData);
  }

  // Test with uppercase
  const testCodeUpper = 'JOHNDOE123';
  console.log(`\n🧪 Testing search for code: "${testCodeUpper}"`);

  const { data: testDataUpper, error: testErrorUpper } = await supabase
    .from('profiles')
    .select('email, referral_code')
    .eq('referral_code', testCodeUpper)
    .single();

  if (testErrorUpper) {
    console.log('❌ Not found:', testErrorUpper.message);
  } else {
    console.log('✅ Found:', testDataUpper);
  }
}

debugReferralCodes().catch(console.error);
