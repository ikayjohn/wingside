// Check profiles table schema
const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  'https://cxbqochxrhokdscgijxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YnFvY2h4cmhva2RzY2dpanhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MTUzNCwiZXhwIjoyMDgxNjI3NTM0fQ.NkuvWwmfalPWiIc_hRBFHIrzAyP3Shbv9sw167ITXFQ'
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
