const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Old header patterns (brown background with text OR yellow with existing logo)
const oldHeaderPattern = /<div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">\s*<h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside<\/h1>\s*<\/div>|<div style="background-color: #F7C400; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">\s*<img src="https:\/\/wingside\.ng\/logo\.png" alt="Wingside Logo" style="max-width: 200px; height: auto;">\s*<\/div>/g;

// New header (yellow background with logo)
const newHeader = `<div style="background-color: #F7C400; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
  <img src="https://wingside.ng/logo.png" alt="Wingside Logo" style="max-width: 200px; height: 100px; object-fit: contain;">
</div>`;

async function updateEmailTemplates() {
  try {
    console.log('Fetching all email templates...');

    // Get all templates
    const { data: templates, error: fetchError } = await supabase
      .from('email_templates')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${templates.length} templates`);

    let updatedCount = 0;

    // Update each template
    for (const template of templates) {
      const oldContent = template.html_content;
      const newContent = oldContent.replace(oldHeaderPattern, newHeader);

      if (oldContent !== newContent) {
        const { error: updateError } = await supabase
          .from('email_templates')
          .update({
            html_content: newContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (updateError) {
          console.error(`Failed to update template "${template.name}":`, updateError.message);
        } else {
          console.log(`Updated template: ${template.name} (${template.template_key})`);
          updatedCount++;
        }
      } else {
        console.log(`- Skipped template (already updated): ${template.name}`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} email templates!`);
    console.log('\nAll email templates now have a yellow header bar with the Wingside logo.');

  } catch (error) {
    console.error('Error updating email templates:', error);
    process.exit(1);
  }
}

// Run the update
updateEmailTemplates();
