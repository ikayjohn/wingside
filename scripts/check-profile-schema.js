// Check profiles table schema
const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.SUPABASE_URL || 'https://cxbqochxrhokdscgijxe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const userId = 'b0c5db1a-7d93-47a0-8ab3-29ece9a0beb5';

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('📊 Profile columns:');
    console.log(Object.keys(data).join('\n'));
    console.log('\n📝 Full data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkSchema().then(() => process.exit(0));
