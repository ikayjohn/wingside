// Embedly.ng API Integration
// Docs: https://docs.embedly.ng

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

// Cached GUIDs
let NIGERIA_COUNTRY_ID: string | null = null;
let INDIVIDUAL_CUSTOMER_TYPE_ID: string | null = null;
let NGN_CURRENCY_ID: string | null = null;

// Make authenticated API request
async function embedlyRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  if (!EMBEDLY_API_KEY) {
    throw new Error('Embedly API key not configured');
  }

  const response = await fetch(`${EMBEDLY_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'x-api-key': EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Embedly API error (${endpoint}):`, error);
    throw new Error(`Embedly API request failed: ${response.status}`);
  }

  return response.json();
}

// Get Nigeria's country GUID
async function getNigeriaCountryId(): Promise<string> {
  if (NIGERIA_COUNTRY_ID) {
    return NIGERIA_COUNTRY_ID;
  }

  try {
    const result = await embedlyRequest('/utilities/countries/get');
    const nigeria = result.data?.find((c: any) => c.countryCodeTwo === 'NG');
    if (nigeria) {
      NIGERIA_COUNTRY_ID = nigeria.id;
      return NIGERIA_COUNTRY_ID;
    }
    throw new Error('Nigeria not found in countries list');
  } catch (error) {
    console.error('Failed to get Nigeria country ID:', error);
    throw error;
  }
}

// Get individual customer type GUID
async function getIndividualCustomerTypeId(): Promise<string> {
  if (INDIVIDUAL_CUSTOMER_TYPE_ID) {
    return INDIVIDUAL_CUSTOMER_TYPE_ID;
  }

  try {
    const result = await embedlyRequest('/customers/types/all');
    const individual = result.data?.find((t: any) => t.name.toLowerCase() === 'individual');
    if (individual) {
      INDIVIDUAL_CUSTOMER_TYPE_ID = individual.id;
      return INDIVIDUAL_CUSTOMER_TYPE_ID;
    }
    // Use first customer type if individual not found
    if (result.data && result.data.length > 0) {
      INDIVIDUAL_CUSTOMER_TYPE_ID = result.data[0].id;
      return INDIVIDUAL_CUSTOMER_TYPE_ID;
    }
    throw new Error('No customer types found');
  } catch (error) {
    console.error('Failed to get individual customer type ID:', error);
    throw error;
  }
}

// Get NGN currency GUID
async function getNgnCurrencyId(): Promise<string> {
  if (NGN_CURRENCY_ID) {
    return NGN_CURRENCY_ID;
  }

  try {
    const result = await embedlyRequest('/utilities/currencies/get');
    const ngn = result.data?.find((c: any) => c.shortName === 'NGN');
    if (ngn) {
      NGN_CURRENCY_ID = ngn.id;
      return NGN_CURRENCY_ID;
    }
    throw new Error('NGN currency not found in currencies list');
  } catch (error) {
    console.error('Failed to get NGN currency ID:', error);
    throw error;
  }
}

// ============ Customer Operations ============

export interface EmbedlyCustomer {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organisationId?: string;
  emailAddress?: string; // Alternative field name from API
  walletId?: string; // If customer has a default wallet
}

// Create customer
export async function createCustomer(customer: Omit<EmbedlyCustomer, 'id'>): Promise<string> {
  // Get required GUIDs
  const countryId = await getNigeriaCountryId();
  const customerTypeId = await getIndividualCustomerTypeId();

  const result = await embedlyRequest('/customers/add', 'POST', {
    organizationId: EMBEDLY_ORG_ID,
    firstName: customer.firstName,
    lastName: customer.lastName,
    emailAddress: customer.email,
    mobileNumber: customer.phone || '',
    countryId,
    customerTypeId,
    city: 'Port Harcourt', // Default city - can be overridden
    address: 'Wingside Customer', // Default address - can be overridden
  });
  return result.data?.id || result.id;
}

// Get customer by ID
export async function getCustomer(customerId: string): Promise<EmbedlyCustomer | null> {
  try {
    const result = await embedlyRequest(`/customer/${customerId}`);
    return result.data || result;
  } catch {
    return null;
  }
}

// Get customer by email (checks all customers)
export async function getCustomerByEmail(email: string): Promise<EmbedlyCustomer | null> {
  try {
    const result = await embedlyRequest('/customers/get/all', 'GET');
    const customers = result.data || result;

    // Handle both array and non-array responses
    const customerArray = Array.isArray(customers) ? customers : [];

    const found = customerArray.find((c: any) => {
      const customerEmail = (c.emailAddress || c.email || '').toLowerCase();
      return customerEmail === email.toLowerCase();
    });

    return found || null;
  } catch (error) {
    console.error('Error finding customer by email:', error);
    return null;
  }
}

// ============ Wallet Operations ============

export interface EmbedlyWallet {
  id: string;
  customerId: string;
  balance: number;
  currency: string;
  status: string;
}

// Create wallet for customer
export async function createWallet(customerId: string, customerName?: string, currency: string = 'NGN'): Promise<string> {
  // Get NGN currency GUID
  const currencyId = await getNgnCurrencyId();

  const result = await embedlyRequest('/wallets/add', 'POST', {
    customerId,
    currencyId,
    name: customerName || 'Wallet', // Use customer name if provided
  });
  return result.data?.id || result.walletId || result.id;
}

// Get wallet by ID
export async function getWallet(walletId: string): Promise<EmbedlyWallet | null> {
  try {
    const result = await embedlyRequest(`/wallet/${walletId}`);
    return result.data || result;
  } catch {
    return null;
  }
}

// Get wallet balance
export async function getWalletBalance(walletId: string): Promise<number> {
  const wallet = await getWallet(walletId);
  return wallet?.balance || 0;
}

// Credit wallet (add funds/points)
export async function creditWallet(
  walletId: string,
  amount: number,
  description: string = 'Credit'
): Promise<boolean> {
  try {
    await embedlyRequest('/wallet/credit', 'POST', {
      walletId,
      amount,
      description,
      organisationId: EMBEDLY_ORG_ID,
    });
    return true;
  } catch (error) {
    console.error('Embedly credit error:', error);
    return false;
  }
}

// Debit wallet (remove funds/points)
export async function debitWallet(
  walletId: string,
  amount: number,
  description: string = 'Debit'
): Promise<boolean> {
  try {
    await embedlyRequest('/wallet/debit', 'POST', {
      walletId,
      amount,
      description,
      organisationId: EMBEDLY_ORG_ID,
    });
    return true;
  } catch (error) {
    console.error('Embedly debit error:', error);
    return false;
  }
}

// ============ Helper Functions ============

export function isEmbedlyConfigured(): boolean {
  return !!(EMBEDLY_API_KEY && EMBEDLY_ORG_ID);
}

// Create customer and wallet in one call
// Also handles linking to existing Embedly customers created offline/at store
export async function setupCustomerWithWallet(customer: {
  email: string;
  full_name: string;
  phone?: string;
}): Promise<{ customerId: string; walletId: string; isNewCustomer: boolean } | null> {
  if (!isEmbedlyConfigured()) {
    console.warn('Embedly not configured, skipping setup');
    return null;
  }

  try {
    const nameParts = customer.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    let customerId: string;
    let isNewCustomer = false;

    // Check if customer already exists in Embedly (e.g., created at store)
    const existingCustomer = await getCustomerByEmail(customer.email);

    if (existingCustomer?.id) {
      // Customer exists - link to existing account
      customerId = existingCustomer.id;
      console.log(`Embedly: Found existing customer ${customerId} for ${customer.email} - linking account`);
    } else {
      // Create new customer
      customerId = await createCustomer({
        email: customer.email,
        firstName,
        lastName,
        phone: customer.phone,
      });
      isNewCustomer = true;
      console.log(`Embedly: Created new customer ${customerId} for ${customer.email}`);
    }

    // Try to get existing wallet for the customer
    let walletId: string;

    // Try to create wallet (will use existing if customer has one, or create new)
    try {
      walletId = await createWallet(customerId, customer.full_name);
      console.log(`Embedly: Wallet ${walletId} ready for customer ${customerId}`);
    } catch (walletError: any) {
      // Wallet creation failed - customer might already have max wallets
      console.error(`Embedly: Could not create wallet for customer ${customerId}:`, walletError.message);
      // Return customer ID without wallet - user may need to select existing wallet
      return { customerId, walletId: '', isNewCustomer };
    }

    return { customerId, walletId, isNewCustomer };
  } catch (error) {
    console.error('Embedly setup error:', error);
    return null;
  }
}

// Credit loyalty points based on order total
export async function creditLoyaltyPoints(
  walletId: string,
  orderTotal: number,
  orderNumber: string,
  pointsPerNaira: number = 0.1 // 10 points per ₦100
): Promise<{ pointsEarned: number; newBalance: number } | null> {
  if (!isEmbedlyConfigured()) {
    console.warn('Embedly not configured, skipping points credit');
    return null;
  }

  try {
    const pointsEarned = Math.floor(orderTotal * pointsPerNaira);

    if (pointsEarned > 0) {
      await creditWallet(
        walletId,
        pointsEarned,
        `Points from order ${orderNumber}`
      );
    }

    const newBalance = await getWalletBalance(walletId);

    console.log(`Embedly: Credited ${pointsEarned} points for order ${orderNumber}`);
    return { pointsEarned, newBalance };
  } catch (error) {
    console.error('Embedly points credit error:', error);
    return null;
  }
}

// Redeem points for discount
export async function redeemPoints(
  walletId: string,
  pointsToRedeem: number,
  orderNumber: string
): Promise<boolean> {
  if (!isEmbedlyConfigured()) {
    return false;
  }

  try {
    const balance = await getWalletBalance(walletId);
    if (balance < pointsToRedeem) {
      console.error('Insufficient points balance');
      return false;
    }

    await debitWallet(
      walletId,
      pointsToRedeem,
      `Redeemed for order ${orderNumber}`
    );

    console.log(`Embedly: Redeemed ${pointsToRedeem} points for order ${orderNumber}`);
    return true;
  } catch (error) {
    console.error('Embedly points redeem error:', error);
    return false;
  }
}
