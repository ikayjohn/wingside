import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient, { CreateCustomerRequest } from '@/lib/embedly/client';

// POST /api/embedly/initialize - Initialize Embedly customer for authenticated user
export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if customer already exists
    if (profile.embedly_customer_id) {
      return NextResponse.json({
        success: true,
        message: 'Customer already initialized',
        customerId: profile.embedly_customer_id,
        hasWallet: !!profile.embedly_wallet_id
      });
    }

    // Get required data for Embedly customer creation
    const [countries, customerTypes] = await Promise.all([
      embedlyClient.getCountries(),
      embedlyClient.getCustomerTypes()
    ]);

    // Find Nigeria
    const nigeria = countries.find(country => country.countryCodeTwo === 'NG');
    if (!nigeria) {
      return NextResponse.json(
        { error: 'Nigeria country not found in Embedly system' },
        { status: 500 }
      );
    }

    // Find Individual customer type
    const individualType = customerTypes.find(type => type.name.toLowerCase() === 'individual');
    if (!individualType) {
      return NextResponse.json(
        { error: 'Individual customer type not found' },
        { status: 500 }
      );
    }

    // Parse full name
    const nameParts = (profile.full_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

    // Prepare customer data
    const customerData: CreateCustomerRequest = {
      organizationId: process.env.EMBEDLY_ORG_ID!,
      firstName,
      lastName,
      middleName,
      emailAddress: profile.email,
      mobileNumber: profile.phone || '',
      customerTypeId: individualType.id,
      countryId: nigeria.id,
      address: profile.address || undefined,
      city: profile.city || undefined,
      alias: profile.full_name || undefined,
    };

    // Create customer in Embedly
    try {
      const embedlyCustomer = await embedlyClient.createCustomer(customerData);

      // Update profile with Embedly customer ID
      await supabase
        .from('profiles')
        .update({
          embedly_customer_id: embedlyCustomer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Customer initialized successfully',
        customer: embedlyCustomer,
        customerId: embedlyCustomer.id,
        hasWallet: false
      });

    } catch (embedlyError) {
      console.error('Embedly customer initialization error:', embedlyError);

      // Check if customer already exists
      try {
        const existingCustomer = await embedlyClient.getCustomerByEmail(profile.email);
        if (existingCustomer) {
          await supabase
            .from('profiles')
            .update({
              embedly_customer_id: existingCustomer.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          return NextResponse.json({
            success: true,
            message: 'Customer already exists',
            customer: existingCustomer,
            customerId: existingCustomer.id,
            hasWallet: !!profile.embedly_wallet_id
          });
        }
      } catch (findError) {
        // Customer doesn't exist, return original error
      }

      return NextResponse.json(
        {
          error: 'Failed to initialize customer in Embedly',
          details: embedlyError instanceof Error ? embedlyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Embedly customer initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize customer' },
      { status: 500 }
    );
  }
}