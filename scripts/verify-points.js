const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPoints() {
  console.log('=== Current Points in Database ===\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, total_points')
    .gte('total_points', 0)
    .order('total_points', { ascending: false });

  if (error) {
    console.log('Error:', error);
    return;
  }

  profiles.forEach(p => {
    console.log(`${p.email}: ${p.total_points || 0} points`);
  });
}

verifyPoints().catch(err => console.error(err));
