// Simple script to generate referral codes for existing users
// Using direct database connection via API

async function generateReferralCode(firstName, lastName) {
  const cleanName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8);
  };

  const namePart = cleanName(firstName + lastName);
  if (namePart.length < 3) {
    return cleanName(firstName) + Math.floor(Math.random() * 1000);
  }

  // Add random suffix for uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${namePart}${randomSuffix}`;
}

async function generateReferralCodesForAllUsers() {
  console.log('🚀 Starting referral code generation...\n');

  try {
    // Get existing codes to avoid duplicates
    console.log('📋 Step 1: Getting existing referral codes...');
    const existingResponse = await fetch('http://localhost:3000/api/referrals/my-referrals/');
    const existingData = await existingResponse.json();

    const existingCodes = [];
    if (existingData.referrals) {
      existingData.referrals.forEach(referral => {
        if (referral.profiles?.full_name) {
          existingCodes.push(referral.profiles.full_name);
        }
      });
    }

    console.log(`Found ${existingCodes.length} existing codes`);

    // Get all users who need referral codes
    console.log('\n📋 Step 2: Getting users without referral codes...');
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    console.log(`Found ${data.users.length} total users`);

    // Find users without referral codes (we'll need to check via profile API)
    const usersNeedingCodes = [];
    for (const user of data.users) {
      const profileResponse = await fetch(`http://localhost:3000/api/user/profile`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (!profileData.profile?.referral_code) {
          usersNeedingCodes.push({
            id: user.id,
            email: user.email,
            name: profileData.profile?.full_name || user.name || 'User',
            full_name: profileData.profile?.full_name
          });
        }
      }
    }

    console.log(`Found ${usersNeedingCodes.length} users needing referral codes`);

    if (usersNeedingCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      return;
    }

    // Generate referral codes via admin API
    console.log('\n📋 Step 3: Generating referral codes via API...');
    const batchResponse = await fetch('http://localhost:3000/api/admin/referrals/generate-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generateForAll: true
      })
    });

    if (!batchResponse.ok) {
      const errorData = await batchResponse.json();
      console.error('❌ API Error:', errorData);
      throw new Error('Failed to generate referral codes');
    }

    const result = await batchResponse.json();
    console.log('\n🎉 Results:');
    console.log(`✅ Total updated: ${result.totalUpdated}`);
    console.log(`✅ Success: ${result.message}`);

    if (result.users && result.users.length > 0) {
      console.log('\n📝 Generated Codes:');
      result.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.fullName} (${user.email}) → ${user.referralCode}`);
      });
    }

    return result;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run the script
generateReferralCodesForAllUsers()
  .then(result => {
    console.log('\n✅ Referral code generation completed successfully!');
  })
  .catch(error => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });