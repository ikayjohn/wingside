const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeDuplicates() {
  console.log('Removing duplicate events...\n');

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  // Group by title to find duplicates
  const grouped = {};
  events.forEach(event => {
    if (!grouped[event.title]) {
      grouped[event.title] = [];
    }
    grouped[event.title].push(event);
  });

  // Delete duplicates, keep only the first (most recent) one
  let deletedCount = 0;
  for (const [title, events] of Object.entries(grouped)) {
    if (events.length > 1) {
      console.log(`\nProcessing duplicates for: "${title}"`);

      // Keep the first one, delete the rest
      const toKeep = events[0];
      const toDelete = events.slice(1);

      console.log(`  Keeping: ${toKeep.id} (created ${toKeep.created_at})`);

      for (const event of toDelete) {
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', event.id);

        if (deleteError) {
          console.error(`  ✗ Failed to delete ${event.id}:`, deleteError);
        } else {
          console.log(`  ✓ Deleted ${event.id} (created ${event.created_at})`);
          deletedCount++;
        }
      }
    }
  }

  console.log(`\n\nTotal duplicates removed: ${deletedCount}`);
}

removeDuplicates();
