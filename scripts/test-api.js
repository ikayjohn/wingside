
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test the profile API endpoint
const testApi = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/user/profile');
    console.log('Profile API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Profile has referral_code:', !!data.profile?.referral_code);
      if (data.profile?.referral_code) {
        console.log('Referral code in API:', data.profile.referral_code);
      }
    } else {
      console.log('API Response:', await response.text());
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
};

// Test the referrals API
const testReferralsApi = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/referrals/my-referrals');
    console.log('Referrals API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Referrals API has referral_code:', !!data.referralCode);
      if (data.referralCode) {
        console.log('Referral code in referrals API:', data.referralCode);
      }
    } else {
      console.log('Referrals API Response:', await response.text());
    }
  } catch (error) {
    console.error('Error testing referrals API:', error.message);
  }
};

testApi();
setTimeout(testReferralsApi, 1000);

