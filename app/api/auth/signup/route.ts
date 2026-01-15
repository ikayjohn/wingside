import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import embedlyClient, { CreateCustomerRequest } from '@/lib/embedly/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if Embedly is configured
function isEmbedlyConfigured(): boolean {
  return !!(process.env.EMBEDLY_API_KEY && process.env.EMBEDLY_ORG_ID);
}

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName: string, lastName: string): string {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();

  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  let code = `${firstPart}${lastPart}${randomDigits}`;

  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 4).toUpperCase();
    code = `${code}${extraRandom}`;
  }

  return code.slice(0, 15);
}

// Initialize Embedly customer for new user
async function initializeEmbedlyCustomer(
  email: string,
  firstName: string,
  lastName: string,
  phone: string,
  dateOfBirth: string | null
): Promise<{ customerId: string | null; error: string | null }> {
  if (!isEmbedlyConfigured()) {
    console.log('Embedly not configured, skipping customer initialization');
    return { customerId: null, error: null };
  }

  try {
    // Get required Embedly configuration
    const [countries, customerTypes] = await Promise.all([
      embedlyClient.getCountries(),
      embedlyClient.getCustomerTypes()
    ]);

    // Find Nigeria
    const nigeria = countries.find(country => country.countryCodeTwo === 'NG');
    if (!nigeria) {
      console.error('Embedly: Nigeria country not found');
      return { customerId: null, error: 'Nigeria country not found in Embedly system' };
    }

    // Find Individual customer type
    const individualType = customerTypes.find(type => type.name.toLowerCase() === 'individual');
    if (!individualType) {
      console.error('Embedly: Individual customer type not found');
      return { customerId: null, error: 'Individual customer type not found' };
    }

    // Prepare customer data
    const customerData: CreateCustomerRequest = {
      organizationId: process.env.EMBEDLY_ORG_ID!,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: email.toLowerCase().trim(),
      mobileNumber: phone,
      customerTypeId: individualType.id,
      countryId: nigeria.id,
    };

    // Add date of birth if provided
    if (dateOfBirth) {
      customerData.dob = dateOfBirth;
    }

    // Create customer in Embedly
    const embedlyCustomer = await embedlyClient.createCustomer(customerData);

    console.log(`Embedly: Customer ${embedlyCustomer.id} created for ${email}`);
    return { customerId: embedlyCustomer.id, error: null };

  } catch (error: any) {
    // Check if customer already exists
    try {
      const existingCustomer = await embedlyClient.getCustomerByEmail(email);
      if (existingCustomer) {
        console.log(`Embedly: Existing customer ${existingCustomer.id} found for ${email}`);
        return { customerId: existingCustomer.id, error: null };
      }
    } catch (findError) {
      // Customer doesn't exist, return original error
    }

    console.error('Embedly customer initialization error:', error);
    return { customerId: null, error: error.message || 'Failed to create Embedly customer' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    if (gender !== 'M' && gender !== 'F') {
      return NextResponse.json(
        { error: 'Gender must be M or F' },
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
        { error: authError.message },
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

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: `+234${phone}`,
      role: 'customer',
      referral_code: referralCode,
      referred_by: referredByUserId,
      date_of_birth: formattedDOB,
      gender: gender,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the entire signup if profile creation fails
      // But log it for debugging
    }

    // Initialize Embedly customer account
    const embedlyResult = await initializeEmbedlyCustomer(
      authData.user.email!,
      firstName,
      lastName,
      `+234${phone}`,
      formattedDOB
    );

    // Update profile with Embedly customer ID if successful
    if (embedlyResult.customerId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ embedly_customer_id: embedlyResult.customerId })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Profile update error (Embedly ID):', updateError);
        // Don't fail signup if we can't save the Embedly ID
      } else {
        console.log(`Profile updated with Embedly customer ID: ${embedlyResult.customerId}`);
      }
    } else if (embedlyResult.error) {
      console.warn('Embedly initialization failed, but signup succeeded:', embedlyResult.error);
      // Continue with signup even if Embedly fails
    }

    // Create referral record if user was referred
    if (referredByUserId) {
      const { error: referralError } = await supabase.from('referrals').insert({
        referrer_id: referredByUserId,
        referred_user_id: authData.user.id,
        referral_code_used: referralId.trim().toUpperCase(),
        status: 'pending_signup',
        reward_amount: 200,
        referred_email: email.toLowerCase().trim(),
      });

      if (referralError) {
        console.error('Referral creation error:', referralError);
        // Don't fail signup if referral record creation fails
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
