import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { syncNewCustomer } from '@/lib/integrations';
import { sendWelcomeEmail } from '@/lib/notifications/email';
import { comprehensiveBotProtection } from '@/lib/bot-protection';

// Validate environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!serviceKey) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(url, serviceKey);

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName: string, lastName: string): string {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();

  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  let code = `${firstPart}${lastPart}${randomDigits}`;

  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 4).toLowerCase();
    code = `${code}${extraRandom}`;
  }

  return code.slice(0, 15);
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // TEMPORARILY DISABLED: Bot protection blocks legitimate signups without frontend timestamp
    // TODO: Add BotProtection component to signup form then re-enable
    // const botCheck = await comprehensiveBotProtection(request, body, {
    //   honeypotField: 'website_verify',
    //   minSubmissionTime: 3000,
    //   maxSubmissionTime: 1800000,
    // });
    // if (!botCheck.valid) {
    //   return NextResponse.json(
    //     { error: botCheck.error || 'Invalid submission. Please try again.' },
    //     { status: botCheck.status || 400 }
    //   );
    // }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      referralId,
      dateOfBirth,
      gender,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate gender
    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { error: 'Gender must be Male or Female' },
        { status: 400 }
      );
    }

    // Validate date of birth (day and month required)
    let formattedDOB = null;
    if (dateOfBirth) {
      const parts = dateOfBirth.split('-');
      if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2] || null;

        // Format for Embedly: DD-MM-YYYY or DD-MM
        formattedDOB = year ? `${day}-${month}-${year}` : `${day}-${month}`;
      }
    }

    // Validate referral code if provided
    let referredByUserId = null;
    if (referralId && referralId.trim()) {
      const searchCode = referralId.trim().toLowerCase();

      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', searchCode)
        .single();

      if (referrerError || !referrerData) {
        return NextResponse.json(
          { error: `Invalid referral ID: "${searchCode}"` },
          { status: 404 }
        );
      }

      referredByUserId = referrerData.id;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm (no verification email)
      user_metadata: {
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: `+234${phone}`,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate referral code for new user
    const referralCode = generateReferralCode(firstName, lastName);

    // Check if profile was auto-created by Supabase Auth
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .eq('id', authData.user.id)
      .single();

    // Log error but continue - profile might not exist yet
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
    }

    let profileData;
    let profileError;

    if (existingProfile) {
      // Profile exists (auto-created by Supabase Auth), UPDATE it with referral_code
      console.log('Profile auto-created by Supabase Auth, updating with referral code...');
      const result = await supabase
        .from('profiles')
        .update({
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: `+234${phone}`,
          role: 'customer',
          referral_code: referralCode,
          referred_by: referredByUserId,
          date_of_birth: formattedDOB,
          gender: gender,
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      profileData = result.data;
      profileError = result.error;
    } else {
      // Profile doesn't exist, INSERT it
      const result = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: `+234${phone}`,
          role: 'customer',
          referral_code: referralCode,
          referred_by: referredByUserId,
          date_of_birth: formattedDOB,
          gender: gender,
        })
        .select()
        .single();

      profileData = result.data;
      profileError = result.error;
    }

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'Failed to save profile. Please try again.' },
        { status: 400 }
      );
    }

    // Sync customer to integrations (Zoho CRM and Embedly)
    const syncResult = await syncNewCustomer({
      id: authData.user.id,
      email: authData.user.email!,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: `+234${phone}`,
    });

    if (syncResult.zoho) {
      console.log(`Zoho CRM: Contact ${syncResult.zoho.action} - ${authData.user.email}`);
    }

    if (syncResult.embedly) {
      console.log(`Embedly: Customer ${syncResult.embedly.isNewCustomer ? 'created' : 'linked'} - ${syncResult.embedly.customer_id}`);
      if (syncResult.embedly.wallet_id) {
        console.log(`Embedly: Wallet ${syncResult.embedly.wallet_id} created`);
      }
    }

    if (syncResult.error) {
      console.warn('Integration sync failed, but signup succeeded:', syncResult.error);
    }

    // Send welcome email
    try {
      const emailResult = await sendWelcomeEmail(
        authData.user.email!,
        `${firstName.trim()} ${lastName.trim()}`,
        referralCode
      );

      if (emailResult.success) {
        console.log(`Welcome email sent to ${authData.user.email}`);
      } else {
        console.warn(`Welcome email failed: ${emailResult.error}`);
      }
    } catch (emailError) {
      // Don't fail signup if email fails
      console.warn('Welcome email error:', emailError);
    }

    // Create referral record if user was referred
    if (referredByUserId) {
      const { error: referralError } = await supabase.from('referrals').insert({
        referrer_id: referredByUserId,
        referred_user_id: authData.user.id,
        referral_code_used: referralId.trim().toLowerCase(),
        status: 'signed_up', // Changed from 'pending_signup' to 'signed_up' since signup is complete
        reward_amount: 1000, // Updated to ₦1000 naira reward
        referred_email: email.toLowerCase().trim(),
      });

      if (referralError) {
        console.error('❌ Referral creation error:', {
          newUserId: authData.user.id,
          newUserEmail: email,
          referrerId: referredByUserId,
          referralCode: referralId,
          error: referralError
        });

        // Create admin notification for failed referral creation
        try {
          await supabase.from('notifications').insert({
            user_id: null, // Admin notification
            type: 'referral_creation_failed',
            title: 'Referral Creation Failed',
            message: `Failed to create referral record for new user ${email} using code ${referralId}`,
            metadata: {
              new_user_id: authData.user.id,
              new_user_email: email,
              referrer_id: referredByUserId,
              referral_code: referralId,
              error: referralError.message
            }
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        // Don't fail signup if referral record creation fails
      } else {
        console.log(`✅ Referral created: User ${authData.user.id} referred by ${referredByUserId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        referralCode,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
