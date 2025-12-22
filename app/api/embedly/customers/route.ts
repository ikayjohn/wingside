import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import embedlyClient, {
  CreateCustomerRequest,
  Country,
  CustomerType
} from '@/lib/embedly/client';

// GET /api/embedly/customers - Get customer details for authenticated user
export async function GET() {
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

    // Check if customer already exists in Embedly
    try {
      if (profile.embedly_customer_id) {
        const embedlyCustomer = await embedlyClient.getCustomerById(profile.embedly_customer_id);
        return NextResponse.json({
          success: true,
          customer: embedlyCustomer,
          hasEmbedlyAccount: true
        });
      }

      // Try to find customer by email
      const customerByEmail = await embedlyClient.getCustomerByEmail(profile.email);
      if (customerByEmail) {
        // Update profile with Embedly customer ID
        await supabase
          .from('profiles')
          .update({ embedly_customer_id: customerByEmail.id })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          customer: customerByEmail,
          hasEmbedlyAccount: true
        });
      }
    } catch (error) {
      // Customer doesn't exist in Embedly, continue
    }

    return NextResponse.json({
      success: true,
      customer: null,
      hasEmbedlyAccount: false,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone
      }
    });

  } catch (error) {
    console.error('Embedly customer fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

// POST /api/embedly/customers - Create new customer in Embedly
export async function POST(request: NextRequest) {
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

    // Get required data for Embedly customer creation
    const countries = await embedlyClient.getCountries();
    const customerTypes = await embedlyClient.getCustomerTypes();

    // Find Nigeria (should exist)
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
        message: 'Customer created successfully',
        customer: embedlyCustomer
      });

    } catch (embedlyError) {
      console.error('Embedly customer creation error:', embedlyError);

      // Check if customer already exists (might have been created by another request)
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
            customer: existingCustomer
          });
        }
      } catch (findError) {
        // Customer doesn't exist, return original error
      }

      return NextResponse.json(
        {
          error: 'Failed to create customer in Embedly',
          details: embedlyError instanceof Error ? embedlyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Embedly customer creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}