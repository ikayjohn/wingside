const fs = require('fs');
const path = require('path');

// The replacement pattern
const errorHandlingCode = `let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }`;

// Files to update
const filesToUpdate = [
  'app/api/admin/blog/posts/route.ts',
  'app/api/admin/blog/posts/[id]/route.ts',
  'app/api/admin/contact-submissions/[id]/route.ts',
  'app/api/admin/events/route.ts',
  'app/api/admin/events/[id]/route.ts',
  'app/api/admin/flavors/route.ts',
  'app/api/admin/flavors/[id]/route.ts',
  'app/api/admin/gift-cards/route.ts',
  'app/api/admin/job-applications/[id]/route.ts',
  'app/api/admin/notifications/resend/route.ts',
  'app/api/admin/notifications/send/route.ts',
  'app/api/admin/notifications/send-test/route.ts',
  'app/api/admin/notifications/templates/route.ts',
  'app/api/admin/test-embedly-sync/route.ts',
  'app/api/admin/wingpost-locations/route.ts',
  'app/api/admin/wingpost-locations/[id]/route.ts',
  'app/api/captcha/verify/route.ts',
  'app/api/categories/route.ts',
  'app/api/categories/[id]/route.ts',
  'app/api/contact/route.ts',
  'app/api/delivery-areas/route.ts',
  'app/api/delivery-areas/[id]/route.ts',
  'app/api/embedly/transfers/route.ts',
  'app/api/embedly/utilities/route.ts',
  'app/api/embedly/wallet-payment/route.ts',
  'app/api/events/route.ts',
  'app/api/events/[id]/route.ts',
  'app/api/franchise-application/route.ts',
  'app/api/gift-cards/balance/route.ts',
  'app/api/hcaptcha/verify/route.ts',
  'app/api/hero-slides/insert-without-auth/route.ts',
  'app/api/hero-slides/route.ts',
  'app/api/hero-slides/test-insert/route.ts',
  'app/api/hero-slides/[id]/route.ts',
  'app/api/integrations/sync-customer/route.ts',
  'app/api/job-positions/route.ts',
  'app/api/job-positions/[id]/route.ts',
  'app/api/newsletter/signup/route.ts',
  'app/api/notifications/preferences/route.ts',
  'app/api/notifications/push/subscribe/route.ts',
  'app/api/notifications/route.ts',
  'app/api/orders/[id]/cancel/route.ts',
  'app/api/partnership/route.ts',
  'app/api/payment/initialize/route.ts',
  'app/api/payment/nomba/initialize/route.ts',
  'app/api/payment/nomba/verify/route.ts',
  'app/api/pickup-locations/route.ts',
  'app/api/pickup-locations/[id]/route.ts',
  'app/api/points/convert/route.ts',
  'app/api/products/[id]/route.ts',
  'app/api/promo-codes/route.ts',
  'app/api/promo-codes/validate/route.ts',
  'app/api/promo-codes/[id]/route.ts',
  'app/api/recaptcha/verify/route.ts',
  'app/api/referrals/process-reward/route.ts',
  'app/api/referrals/share/route.ts',
  'app/api/referrals/validate/route.ts',
  'app/api/referrals/validate-code/route.ts',
  'app/api/rewards/award/route.ts',
  'app/api/rewards/claim/route.ts',
  'app/api/rewards/social-verify/route.ts',
  'app/api/subcategories/route.ts',
  'app/api/subcategories/[id]/route.ts',
  'app/api/test-simple/route.ts',
  'app/api/user/addresses/route.ts',
  'app/api/user/addresses/[id]/route.ts',
  'app/api/user/change-password/route.ts',
  'app/api/user/update-streak/route.ts',
  'app/api/validate-access-code/route.ts',
  'app/api/webhooks/n8n/route.ts',
  'app/api/webhooks/notify/route.ts',
  'app/api/wingside-card/onboard/route.ts',
];

let successCount = 0;
let failCount = 0;
let skippedCount = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  SKIP: ${file} - File not found`);
      skippedCount++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has error handling for JSON parsing
    if (content.includes('try {') && content.includes('await request.json()') &&
        content.includes('JSON parse error')) {
      console.log(`✅ SKIP: ${file} - Already has error handling`);
      skippedCount++;
      return;
    }

    // Common patterns to replace
    const patterns = [
      // Pattern 1: const body = await request.json()
      {
        regex: /(    )(const body = await request\.json\(\))/g,
        replacement: `$1${errorHandlingCode}`
      },
      // Pattern 2: const { ... } = await request.json()
      {
        regex: /(    )(const \{[^}]+\} = await request\.json\(\))/g,
        replacement: (match, indent, original) => {
          const varExtraction = original.replace('await request.json()', 'body');
          return `${indent}${errorHandlingCode}\n${indent}${varExtraction}`;
        }
      },
      // Pattern 3: Multiple spaces before await
      {
        regex: /(      )(const body = await request\.json\(\))/g,
        replacement: (match, indent) => {
          return indent + errorHandlingCode.replace(/    /g, '      ');
        }
      }
    ];

    let updated = false;
    patterns.forEach(({regex, replacement}) => {
      if (content.match(regex)) {
        content = content.replace(regex, replacement);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ UPDATE: ${file}`);
      successCount++;
    } else {
      console.log(`⚠️  MANUAL: ${file} - Pattern not matched, needs manual review`);
      failCount++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${file} - ${error.message}`);
    failCount++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total files: ${filesToUpdate.length}`);
console.log(`✅ Updated: ${successCount}`);
console.log(`⚠️  Skipped: ${skippedCount}`);
console.log(`❌ Failed/Manual: ${failCount}`);
