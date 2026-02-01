const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files already updated
const updatedFiles = [
  'app/api/products/route.ts',
  'app/api/orders/route.ts',
  'app/api/user/profile/route.ts',
  'app/api/admin/users/delete/route.ts',
  'app/api/admin/stores/[id]/route.ts',
  'app/api/admin/stores/route.ts',
  'app/api/admin/social-verifications/[id]/route.ts',
  'app/api/admin/sms-test/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/admin/referrals/generate-codes/route.ts',
  'app/api/admin/referral-fraud/review/route.ts',
  'app/api/admin/points/award/route.ts',
  'app/api/admin/points/deduct/route.ts',
  'app/api/admin/points/adjust/route.ts',
  'app/api/admin/email-test/route.ts',
  'app/api/admin/maintenance/route.ts', // Already has error handling
  'app/api/auth/signup/route.ts',
  'app/api/wingside-card/status/route.ts',
  'app/api/wingside-card/top-up/route.ts',
];

// Get all files with await request.json()
const allFiles = execSync('grep -r "await request\\.json()" app/api --include="*.ts" -l', {
  encoding: 'utf-8',
  cwd: __dirname
}).trim().split('\n').map(f => f.replace(/\\/g, '/'));

// Files still needing updates
const remainingFiles = allFiles.filter(f => !updatedFiles.includes(f));

console.log(`Total files with await request.json(): ${allFiles.length}`);
console.log(`Files already updated: ${updatedFiles.length}`);
console.log(`Files remaining: ${remainingFiles.length}\n`);

console.log('=== Remaining files ===');
remainingFiles.forEach(f => console.log(f));
