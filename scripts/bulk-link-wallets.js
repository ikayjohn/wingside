// Bulk link wallets from a CSV file
// CSV format: email,accountNumber
// Usage: node scripts/bulk-link-wallets.js <csv-file>

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

async function embedlyRequest(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${EMBEDLY_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'x-api-key': EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedly API error (${endpoint}): ${error}`);
  }

  return response.json();
}

async function linkWallet(email, accountNumber) {
  try {
    // Get wallet by account number
    const walletResponse = await embedlyRequest(`/wallets/get/wallet/account/${accountNumber}`);
    const wallet = walletResponse.data || walletResponse;

    if (!wallet || !wallet.id) {
      return { success: false, email, error: 'Wallet not found' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return { success: false, email, error: 'Profile not found' };
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_customer_id: wallet.customerId,
        embedly_wallet_id: wallet.id,
        bank_account: wallet.virtualAccount.accountNumber,
        bank_name: wallet.virtualAccount.bankName,
        bank_code: wallet.virtualAccount.bankCode,
        wallet_balance: wallet.availableBalance || 0,
        is_wallet_active: true,
        last_wallet_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      return { success: false, email, error: updateError.message };
    }

    return {
      success: true,
      email,
      walletId: wallet.id,
      accountNumber: wallet.virtualAccount.accountNumber,
      bankName: wallet.virtualAccount.bankName,
      balance: wallet.availableBalance
    };

  } catch (error) {
    return { success: false, email, error: error.message };
  }
}

async function main() {
  const csvFile = process.argv[2];

  if (!csvFile) {
    console.log('Usage: node scripts/bulk-link-wallets.js <csv-file>');
    console.log('\nCSV format (no header):');
    console.log('  email1@example.com,1234567890');
    console.log('  email2@example.com,0987654321');
    console.log('\nTo create a template from unlinked profiles:');
    console.log('  node scripts/bulk-link-wallets.js --template');
    return;
  }

  if (csvFile === '--template') {
    // Generate template
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, embedly_customer_id')
      .not('embedly_customer_id', 'is', null)
      .is('embedly_wallet_id', null)
      .order('email', { ascending: true });

    if (!profiles || profiles.length === 0) {
      console.log('✅ All profiles have wallets linked!');
      return;
    }

    console.log('📝 Template CSV (save to file and add account numbers):');
    console.log('\n# Lookup these customer IDs in Embedly dashboard');
    console.log('# Then add the account numbers and run: node scripts/bulk-link-wallets.js <file>');
    console.log('\nemail,accountNumber,customerId');
    profiles.forEach(p => {
      console.log(`${p.email},,${p.embedly_customer_id}`);
    });
    return;
  }

  // Read CSV file
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
  const entries = lines.slice(startIndex).filter(line => line.trim());

  console.log(`\n🚀 Processing ${entries.length} wallet links...\n`);

  const results = [];
  for (let i = 0; i < entries.length; i++) {
    const line = entries[i].trim();
    if (!line) continue;

    const [email, accountNumber] = line.split(',').map(s => s.trim());

    if (!email || !accountNumber) {
      console.log(`⚠️ Skipping invalid line ${i + 1}: ${line}`);
      continue;
    }

    console.log(`[${i + 1}/${entries.length}] Processing: ${email}`);
    const result = await linkWallet(email, accountNumber);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Linked: ${result.accountNumber} - ${result.bankName}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n❌ Failed:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }
}

main().catch(console.error);
