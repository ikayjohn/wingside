import { NextRequest, NextResponse } from 'next/server';
import embedlyClient, { Bank, Country, Currency, CustomerType } from '@/lib/embedly/client';

// GET /api/embedly/utilities - Get various utility data (banks, countries, currencies)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'banks':
        const banks = await embedlyClient.getBanks();
        return NextResponse.json({
          success: true,
          data: banks
        });

      case 'countries':
        const countries = await embedlyClient.getCountries();
        return NextResponse.json({
          success: true,
          data: countries
        });

      case 'currencies':
        const currencies = await embedlyClient.getCurrencies();
        return NextResponse.json({
          success: true,
          data: currencies
        });

      case 'customer-types':
        const customerTypes = await embedlyClient.getCustomerTypes();
        return NextResponse.json({
          success: true,
          data: customerTypes
        });

      case 'all':
        // Return all utility data
        const [allBanks, allCountries, allCurrencies, allCustomerTypes] = await Promise.all([
          embedlyClient.getBanks(),
          embedlyClient.getCountries(),
          embedlyClient.getCurrencies(),
          embedlyClient.getCustomerTypes()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            banks: allBanks,
            countries: allCountries,
            currencies: allCurrencies,
            customerTypes: allCustomerTypes
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid utility type. Use: banks, countries, currencies, customer-types, or all' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Embedly utilities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utility data' },
      { status: 500 }
    );
  }
}

// POST /api/embedly/utilities/name-enquiry - Perform account name verification
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

    const { bankCode, accountNumber } = body;

    if (!bankCode || !accountNumber) {
      return NextResponse.json(
        { error: 'Bank code and account number are required' },
        { status: 400 }
      );
    }

    const nameEnquiry = await embedlyClient.nameEnquiry(bankCode, accountNumber);

    return NextResponse.json({
      success: true,
      data: nameEnquiry
    });

  } catch (error) {
    console.error('Name enquiry error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify account name',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}