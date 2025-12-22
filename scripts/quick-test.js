
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const adminSupabase = createClient(
  'https://cxbqochxrhokdscgijxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YnFvY2h4cmhva2RzY2dpanhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MTUzNCwiZXhwIjoyMDgxNjI3NTM0fQ.NkuvWwmfalPWiIc_hRBFHIrzAyP3Shbv9sw167ITXFQ'
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

