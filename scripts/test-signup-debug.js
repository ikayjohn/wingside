#!/usr/bin/env node

/**
 * Test signup to debug referral code issue
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testSignup() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const timestamp = Date.now();
  const testData = {
    email: `test-${timestamp}@wingside.ng`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: `User${timestamp.toString().slice(-4)}`,
    phone: '8012345678',
    gender: 'Male',
    dateOfBirth: '15-05-1990',
    referralId: ''
  };

  console.log('🧪 Testing Signup...');
  console.log('=======================');
  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('');

  // First, try to create auth user directly
  console.log('Step 1: Creating auth user...');
  let userId;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${testData.firstName} ${testData.lastName}`,
        phone: `+234${testData.phone}`,
      },
    });

    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      // Try to continue anyway if user already exists
    } else {
      userId = authData.user.id;
      console.log('✅ Auth user created:', userId);
    }
  } catch (error) {
    console.log('⚠️  Auth creation exception:', error.message);
  }

  if (!userId) {
    console.log('⚠️  Trying to find existing auth user...');
    // List users to find our test user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users.find(u => u.email === testData.email);
    if (testUser) {
      userId = testUser.id;
      console.log('✅ Found existing auth user:', userId);
    } else {
      console.log('❌ Could not find auth user, aborting');
      return;
    }
  }

  // Check if profile exists
  console.log('');
  console.log('Step 2: Checking if profile exists...');
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, referral_code, created_at')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    console.log('⚠️  Profile already exists!');
    console.log('   Referral Code:', existingProfile.referral_code || '❌ NULL/MISSING');
    console.log('   Created:', existingProfile.created_at);
    console.log('');
    console.log('This explains the duplicate key error!');
    console.log('A profile is being created before our signup code runs.');
  } else {
    console.log('✅ Profile does not exist yet (this is correct)');
    console.log('Now testing manual profile creation...');

    // Try to create profile manually
    const referralCode = `${testData.firstName.toLowerCase()}${testData.lastName.toLowerCase()}${timestamp.toString().slice(-3)}`;

    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: testData.email,
        full_name: `${testData.firstName} ${testData.lastName}`,
        phone: `+234${testData.phone}`,
        role: 'customer',
        referral_code: referralCode,
      })
      .select()
      .single();

    if (profileError) {
      console.log('❌ Manual profile creation failed:', profileError.message);
    } else {
      console.log('✅ Manual profile creation successful!');
      console.log('   Referral Code:', newProfile.referral_code);
    }
  }

  // Cleanup
  console.log('');
  console.log('🧹 Cleaning up...');
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from('profiles').delete().eq('id', userId);
  console.log('✅ Cleanup complete');

  console.log('');
  console.log('=======================');
  console.log('Test Complete!');
  console.log('');
  console.log('💡 If profile already exists, check for:');
  console.log('   1. Database triggers that auto-create profiles');
  console.log('   2. Supabase Auth hooks (webhooks)');
  console.log('   3. RLS policies or triggers in profiles table');
}

testSignup().catch(console.error);
