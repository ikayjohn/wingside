const webpush = require('web-push');

console.log('Generating VAPID Keys for Web Push Notifications...\n');

const keys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated!\n');
console.log('━'.repeat(60));
console.log('\n📋 Add these to your .env.local file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_SUBJECT=mailto:admin@wingside.ng`);
console.log('\n' + '━'.repeat(60));

console.log('\n⚠️  Important Notes:');
console.log('  • Keep the PRIVATE_KEY secret and never commit it to git');
console.log('  • The PUBLIC_KEY can be shared (it\'s already public)');
console.log('  • Update the SUBJECT email to your admin email');
console.log('  • Restart your dev server after adding these keys\n');

// Optional: Test the keys
console.log('✨ Keys are ready to use! Push notifications will work once these');
console.log('   environment variables are set.\n');

process.exit(0);
