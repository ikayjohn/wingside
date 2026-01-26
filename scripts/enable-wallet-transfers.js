// Script to enable wallet-to-wallet transfers in the payment route
const fs = require('fs');
const path = require('path');

async function enableWalletTransfers() {
  console.log('🔧 Enabling wallet-to-wallet transfers...\n');

  try {
    const routePath = path.join(__dirname, '../app/api/embedly/wallet-payment/route.ts');
    let content = fs.readFileSync(routePath, 'utf8');

    // Check if merchant wallet ID is set
    require('dotenv').config({ path: '.env.local' });
    const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;

    if (!merchantWalletId || merchantWalletId === 'placeholder-merchant-wallet-id') {
      console.error('❌ Merchant wallet not set up!');
      console.error('\n💡 Please run: node scripts/create-merchant-wallet.js first\n');
      process.exit(1);
    }

    console.log(`✅ Merchant Wallet ID found: ${merchantWalletId}\n`);

    // Uncomment the wallet transfer code
    const updatedContent = content.replace(
      /\/\/ TODO: Implement actual wallet-to-wallet transfer to merchant wallet[\s\S]*?\/\/ }\n/,
      `// Perform wallet-to-wallet transfer to merchant wallet
      const merchantWalletId = process.env.EMBEDLY_MERCHANT_WALLET_ID;

      if (merchantWalletId && merchantWalletId !== 'placeholder-merchant-wallet-id') {
        console.log(\`Transferring ₦\${amount} from customer wallet to merchant wallet...\`);

        try {
          // Get merchant wallet details
          const merchantWallet = await embedlyClient.getWalletById(merchantWalletId);

          // Transfer from customer wallet to merchant wallet
          await embedlyClient.walletToWalletTransfer({
            fromAccount: wallet.virtualAccount.accountNumber,
            toAccount: merchantWallet.virtualAccount.accountNumber,
            amount: amount,
            transactionReference: transactionReference,
            remarks: remarks || \`Payment for order \${order_id}\`
          });

          console.log(\`✅ Successfully transferred ₦\${amount} to merchant wallet\`);
        } catch (transferError) {
          console.error('❌ Wallet transfer failed:', transferError);
          throw new Error('Failed to transfer funds to merchant wallet');
        }
      } else {
        console.warn('⚠️ Merchant wallet not configured. Skipping actual transfer.');
      }
`
    );

    fs.writeFileSync(routePath, updatedContent);

    console.log('✅ Wallet transfers enabled!\n');
    console.log('📝 Changes made:');
    console.log('   - Uncommented wallet-to-wallet transfer code');
    console.log('   - Added merchant wallet ID check');
    console.log('   - Enabled actual balance deduction from customer wallets\n');
    console.log('⚠️  IMPORTANT: Restart your dev server (npm run dev)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  enableWalletTransfers()
    .then(() => {
      console.log('✅ Done!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { enableWalletTransfers };
