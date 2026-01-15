// Test referral code validation
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralCode(testCode) {
  console.log(`🧪 Testing referral code: "${testCode}"`);
  console.log(`   Length: ${testCode.length}`);
  console.log(`   Trimmed: "${testCode.trim()}"`);
  console.log(`   Lowercase: "${testCode.toLowerCase()}"`);
  console.log(`   Uppercase: "${testCode.toUpperCase()}"`);

  // Test 1: Exact match
  console.log('\n📋 Test 1: Exact match');
  const { data: exactMatch, error: exactError } = await supabase
    .from('profiles')
    .select('email, full_name, referral_code')
    .eq('referral_code', testCode);

  console.log(`   Found: ${exactMatch?.length || 0} results`);
  if (exactMatch && exactMatch.length > 0) {
    exactMatch.forEach(p => {
      console.log(`   - ${p.email}: "${p.referral_code}"`);
    });
  }
  if (exactError) console.log(`   Error: ${exactError.message}`);

  // Test 2: Trimmed match
  console.log('\n📋 Test 2: Trimmed match');
  const { data: trimmedMatch, error: trimmedError } = await supabase
    .from('profiles')
    .select('email, full_name, referral_code')
    .eq('referral_code', testCode.trim());

  console.log(`   Found: ${trimmedMatch?.length || 0} results`);
  if (trimmedMatch && trimmedMatch.length > 0) {
    trimmedMatch.forEach(p => {
      console.log(`   - ${p.email}: "${p.referral_code}"`);
    });
  }
  if (trimmedError) console.log(`   Error: ${trimmedError.message}`);

  // Test 3: Lowercase match (what the app uses)
  console.log('\n📋 Test 3: Lowercase match (app logic)');
  const { data: lowerMatch, error: lowerError } = await supabase
    .from('profiles')
    .select('email, full_name, referral_code')
    .eq('referral_code', testCode.trim().toLowerCase());

  console.log(`   Found: ${lowerMatch?.length || 0} results`);
  if (lowerMatch && lowerMatch.length > 0) {
    lowerMatch.forEach(p => {
      console.log(`   - ${p.email}: "${p.referral_code}"`);
    });
  }
  if (lowerError) console.log(`   Error: ${lowerError.message}`);

  // Test 4: Get all codes that look similar
  console.log('\n📋 Test 4: Similar codes (contains "roger")');
  const { data: similarCodes, error: similarError } = await supabase
    .from('profiles')
    .select('email, full_name, referral_code')
    .ilike('referral_code', '%roger%');

  console.log(`   Found: ${similarCodes?.length || 0} results`);
  if (similarCodes && similarCodes.length > 0) {
    similarCodes.forEach(p => {
      console.log(`   - ${p.email}: "${p.referral_code}" (length: ${p.referral_code?.length})`);
    });
  }
  if (similarError) console.log(`   Error: ${similarError.message}`);

  // Test 5: Check the actual user with that code
  console.log('\n📋 Test 5: Get rogershotnoise@gmail.com profile');
  const { data: rogersProfile, error: rogersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'rogershotnoise@gmail.com')
    .single();

  if (rogersError) {
    console.log(`   Error: ${rogersError.message}`);
  } else {
    console.log(`   Email: ${rogersProfile.email}`);
    console.log(`   Name: ${rogersProfile.full_name}`);
    console.log(`   Referral Code: "${rogersProfile.referral_code}"`);
    console.log(`   Code Length: ${rogersProfile.referral_code?.length}`);
    console.log(`   Code Chars: [${rogersProfile.referral_code?.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
  }
}

async function main() {
  const testCode = process.argv[2] || 'rogetest969';

  console.log('='.repeat(80));
  console.log('REFERRAL CODE VALIDATION DEBUG');
  console.log('='.repeat(80));

  await testReferralCode(testCode);

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
