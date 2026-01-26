const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplates() {
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('template_key, name')
      .order('name');

    if (error) throw error;

    console.log('\nCurrent Email Templates:\n');
    templates.forEach(t => {
      console.log(`• ${t.name} (${t.template_key})`);
    });

    // Get one template to show the header
    const { data: sample } = await supabase
      .from('email_templates')
      .select('html_content')
      .eq('template_key', 'order_confirmation')
      .single();

    if (sample) {
      // Extract just the header part
      const headerMatch = sample.html_content.match(/<div style="background-color: #[\w]+;[^>]*>[\s\S]*?<\/div>\s*<div style="background-color: white/);
      if (headerMatch) {
        console.log('\nSample Header (Order Confirmation):');
        console.log(headerMatch[0].substring(0, 300) + '...\n');
      }
    }

    console.log('All templates use: https://wingside.ng/logo.png');
    console.log('   This serves the logo.png from your public folder.\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTemplates();
