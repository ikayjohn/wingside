const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log('Checking for duplicate events...\n');

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  console.log(`Total events: ${events.length}\n`);

  // Group by title to find duplicates
  const grouped = {};
  events.forEach(event => {
    if (!grouped[event.title]) {
      grouped[event.title] = [];
    }
    grouped[event.title].push(event);
  });

  // Show duplicates
  Object.keys(grouped).forEach(title => {
    if (grouped[title].length > 1) {
      console.log(`\n⚠️  Duplicate found: "${title}"`);
      grouped[title].forEach(event => {
        console.log(`  - ID: ${event.id}`);
        console.log(`    Created: ${event.created_at}`);
        console.log(`    Date: ${event.event_date}`);
      });
    }
  });

  // Show all events
  console.log('\n\nAll events (most recent first):');
  events.forEach((event, index) => {
    console.log(`${index + 1}. ${event.title}`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Date: ${event.event_date}`);
    console.log(`   Created: ${event.created_at}`);
    console.log('');
  });
}

checkDuplicates();
