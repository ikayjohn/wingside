#!/usr/bin/env node

/**
 * Backfill referral codes for existing users who don't have one
 */

const { createClient } = require('@supabase/supabase-js');

// Try to load from multiple possible env file locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback to .env

// Verify required env vars are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set');
  console.error('💡 Make sure environment variables are set in .env or .env.local');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('💡 Make sure environment variables are set in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName, lastName, userId) {
  const cleanFirst = (firstName || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = (lastName || '').replace(/[^a-zA-Z]/g, '').toLowerCase();

  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  // Use part of user ID as random component if name is too short
  const randomComponent = userId.slice(0, 4).toLowerCase();

  let code = `${firstPart}${lastPart}${randomComponent}`;

  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 5).toUpperCase();
    code = `${code}${extraRandom}`;
  }

  return code.slice(0, 15).toLowerCase();
}

async function backfillReferralCodes() {
  console.log('🔄 Backfilling Referral Codes...\n');

  // Fetch all customers without referral codes
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, referral_code')
    .is('referral_code', null)
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch customers:', error);
    process.exit(1);
  }

  console.log(`Found ${customers.length} customers without referral codes\n`);

  if (customers.length === 0) {
    console.log('✅ All customers already have referral codes!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const customer of customers) {
    const nameParts = (customer.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate unique referral code
    let referralCode = generateReferralCode(firstName, lastName, customer.id);

    // Ensure referral code is unique
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        // Add more randomness and try again
        referralCode = generateReferralCode(firstName, lastName, customer.id + attempts.toString());
        attempts++;
      }
    }

    // Update customer with referral code
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code })
      .eq('id', customer.id)
      .select('id, email, referral_code')
      .single();

    if (updateError) {
      console.log(`❌ ${customer.email}: Failed - ${updateError.message}`);
      failCount++;
    } else {
      console.log(`✅ ${customer.email}: ${updateData.referral_code}`);
      successCount++;
    }
  }

  console.log(`\n\n========================================`);
  console.log(`📊 Backfill Complete!`);
  console.log(`========================================`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${customers.length}`);
  console.log(`========================================\n`);
}

backfillReferralCodes().catch(console.error);
