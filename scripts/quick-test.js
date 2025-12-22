
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const adminSupabase = createClient(
  process.env.SUPABASE_URL || 'https://cxbqochxrhokdscgijxe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

adminSupabase
  .from('profiles')
  .select('email, full_name, referral_code')
  .then(({ data, error }) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Referral Code Registry:');
    data.forEach((user, index) => {
      console.log((index + 1) + '. ' + (user.full_name || user.email) + ' → ' + (user.referral_code || 'NO CODE'));
    });
    
    const withCodes = data.filter(u => u.referral_code);
    console.log('\nSuccess: ' + withCodes.length + '/' + data.length + ' users have referral codes');
  });

