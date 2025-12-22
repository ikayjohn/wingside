// Embedly.ng API Integration
// Docs: https://docs.embedly.ng

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

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
  const result = await embedlyRequest('/customer', 'POST', {
    ...customer,
    organisationId: EMBEDLY_ORG_ID,
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
export async function createWallet(customerId: string, currency: string = 'NGN'): Promise<string> {
  const result = await embedlyRequest('/wallet', 'POST', {
    customerId,
    currency,
    organisationId: EMBEDLY_ORG_ID,
  });
  return result.data?.id || result.id;
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
      walletId = await createWallet(customerId);
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
  pointsPerNaira: number = 0.01 // 1 point per ₦100
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
