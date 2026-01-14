require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'rogershotnoise@gmail.com';

  console.log(`🔍 Checking profile for: ${email}\n`);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !profile) {
    console.log('❌ Profile not found');
    return;
  }

  console.log('📋 Profile Details:');
  console.log(`   Email: ${profile.email}`);
  console.log(`   Full Name: ${profile.full_name}`);
  console.log(`   Phone: ${profile.phone}`);
  console.log(`   Created At: ${profile.created_at}`);
  console.log(`   Embedly Customer ID: ${profile.embedly_customer_id || 'NOT SET'}`);
  console.log(`   Embedly Wallet ID: ${profile.embedly_wallet_id || 'NOT SET'}`);
  console.log(`   Bank Account: ${profile.bank_account || 'NOT SET'}`);
  console.log(`   Bank Name: ${profile.bank_name || 'NOT SET'}`);

  // Parse the name to see what might be wrong
  console.log('\n🔍 Name Analysis:');
  const nameParts = (profile.full_name || '').trim().split(/\s+/);
  console.log(`   Name parts: ${nameParts.length}`);
  console.log(`   Parts: ${JSON.stringify(nameParts)}`);

  if (nameParts.length < 2) {
    console.log('\n⚠️ ISSUE: Name has no lastname!');
    console.log('   Embedly requires both first name and last name');
  }

  // Check if phone is valid
  console.log('\n🔍 Phone Analysis:');
  const phone = profile.phone || '';
  console.log(`   Phone: "${phone}"`);
  const phoneRegex = /^(\+234|0)[789]\d{9,10}$/;
  if (!phone || !phone.match(phoneRegex)) {
    console.log('   ⚠️ ISSUE: Invalid phone format');
    console.log('   Expected format: +234XXXXXXXXXX or 0XXXXXXXXXX');
  } else {
    console.log('   ✅ Phone format looks valid');
  }
}

main().catch(console.error);
