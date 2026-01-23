const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disablePaystack() {
  console.log('Disabling Paystack payment gateway...');

  // Check current setting
  const { data: currentSetting } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'payment_gateway_paystack_enabled')
    .single();

  console.log('Current setting:', currentSetting);

  // Update or insert the setting
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      key: 'payment_gateway_paystack_enabled',
      value: 'false',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    .select();

  if (error) {
    console.error('Error disabling Paystack:', error);
    process.exit(1);
  }

  console.log('✅ Paystack payment gateway disabled');
  console.log('Updated setting:', data);

  // Verify the change
  const { data: verifySetting } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'payment_gateway_paystack_enabled')
    .single();

  console.log('Verified setting:', verifySetting);
}

disablePaystack();
