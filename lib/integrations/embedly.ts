// Embedly.ng API Integration
// Docs: https://docs.embedly.ng

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

// Embedly API response types
interface EmbedlyCountry {
  id: string;
  countryCodeTwo: string;
  name: string;
}

interface EmbedlyCustomerType {
  id: string;
  name: string;
}

interface EmbedlyCurrency {
  id: string;
  shortName: string;
  name: string;
}

interface EmbedlyCustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface EmbedlyApiResponse<T = unknown> {
  data?: T;
  message?: string;
  status?: string;
}

// Cached GUIDs
let NIGERIA_COUNTRY_ID: string | null = null;
let INDIVIDUAL_CUSTOMER_TYPE_ID: string | null = null;
let NGN_CURRENCY_ID: string | null = null;

// Make authenticated API request
async function embedlyRequest<T = unknown>(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>
): Promise<EmbedlyApiResponse<T>> {
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
    const errorText = await response.text();
    console.error(`Embedly API error (${endpoint}):`, errorText);
    let parsedMessage = '';
    try {
      const parsed = JSON.parse(errorText);
      parsedMessage = parsed.message || '';
    } catch { /* not JSON */ }
    throw new Error(`Embedly API request failed: ${response.status}${parsedMessage ? ` - ${parsedMessage}` : ''}`);
  }

  return (await response.json()) as EmbedlyApiResponse<T>;
}

// Get Nigeria's country GUID
async function getNigeriaCountryId(): Promise<string> {
  if (NIGERIA_COUNTRY_ID) {
    return NIGERIA_COUNTRY_ID;
  }

  try {
    const result = await embedlyRequest<EmbedlyCountry[]>('/utilities/countries/get');
    const nigeria = result.data?.find((c) => c.countryCodeTwo === 'NG');
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
    const result = await embedlyRequest<EmbedlyCustomerType[]>('/customers/types/all');
    const individual = result.data?.find((t) => t.name.toLowerCase() === 'individual');
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
    const result = await embedlyRequest<EmbedlyCurrency[]>('/utilities/currencies/get');
    const ngn = result.data?.find((c) => c.shortName === 'NGN');
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
  dateOfBirth?: string; // DD-MM-YYYY format (e.g. '14-12-2003')
  organisationId?: string;
  emailAddress?: string; // Alternative field name from API
  walletId?: string; // If customer has a default wallet
}

// Create customer
export async function createCustomer(customer: Omit<EmbedlyCustomer, 'id'>): Promise<string> {
  // Get required GUIDs
  const countryId = await getNigeriaCountryId();
  const customerTypeId = await getIndividualCustomerTypeId();

  const result = await embedlyRequest<{ id?: string }>('/customers/add', 'POST', {
    organizationId: EMBEDLY_ORG_ID,
    firstName: customer.firstName,
    lastName: customer.lastName,
    emailAddress: customer.email,
    mobileNumber: customer.phone || '',
    countryId,
    customerTypeId,
    dateOfBirth: customer.dateOfBirth || '01-01-1990', // Embedly requires DD-MM-YYYY format
    city: 'Port Harcourt', // Default city - can be overridden
    address: 'Wingside Customer', // Default address - can be overridden
  });
  return result.data?.id || (result as any).id;
}

// Get customer by ID
export async function getCustomer(customerId: string): Promise<EmbedlyCustomer | null> {
  try {
    const result = await embedlyRequest<EmbedlyCustomer>(`/customer/${customerId}`);
    return result.data || (result as any);
  } catch {
    return null;
  }
}

// Get customer by email (checks all customers)
export async function getCustomerByEmail(email: string): Promise<EmbedlyCustomer | null> {
  try {
    const result = await embedlyRequest<any>('/customers/get/all', 'GET');
    const customers = result.data || result;

    // Handle both array and non-array responses
    const customerArray: any[] = Array.isArray(customers) ? customers : [];

    const found = customerArray.find((c) => {
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

interface WalletCreateResult {
  walletId: string;
  bankAccount?: string;
  bankName?: string;
  bankCode?: string;
}

// Get existing wallets for a customer (fallback when wallet limit is reached)
async function getCustomerWallets(customerId: string): Promise<any[]> {
  try {
    const result = await embedlyRequest<any>(`/wallets/customer/${customerId}`);
    const wallets = result.data;
    if (Array.isArray(wallets)) return wallets;
    if (wallets && (wallets.id || wallets.walletId)) return [wallets];
    return [];
  } catch {
    return [];
  }
}

// Create wallet for customer — returns wallet ID and virtual account details
export async function createWallet(customerId: string, customerName?: string): Promise<WalletCreateResult> {
  const currencyId = await getNgnCurrencyId();

  try {
    const result = await embedlyRequest<any>('/wallets/add', 'POST', {
      customerId,
      currencyId,
      name: customerName || 'Wallet',
    });

    // Embedly returns { walletId, virtualAccount: { accountNumber, bankName, bankCode } }
    const walletId: string = result.data?.id || (result as any).walletId || (result as any).id;
    const va = (result as any).virtualAccount;

    return {
      walletId,
      bankAccount: va?.accountNumber,
      bankName: va?.bankName,
      bankCode: va?.bankCode,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Customer already has maximum wallets — retrieve the existing one
    if (message.includes('Allowed number of wallets reached')) {
      console.log(`Embedly: Wallet limit reached for customer ${customerId} — fetching existing wallet`);
      const existing = await getCustomerWallets(customerId);
      if (existing.length > 0) {
        const w = existing[0];
        const walletId = w.id || w.walletId;
        console.log(`Embedly: Using existing wallet ${walletId} for customer ${customerId}`);
        return {
          walletId,
          bankAccount: w.virtualAccount?.accountNumber || w.bankAccount,
          bankName: w.virtualAccount?.bankName || w.bankName,
          bankCode: w.virtualAccount?.bankCode || w.bankCode,
        };
      }
      console.warn(`Embedly: Could not retrieve existing wallets for customer ${customerId}`);
    }

    throw error;
  }
}

// Get wallet by ID
export async function getWallet(walletId: string): Promise<EmbedlyWallet | null> {
  try {
    const result = await embedlyRequest<EmbedlyWallet>(`/wallet/${walletId}`);
    return result.data || (result as any);
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

// Strip +234 country code prefix so Embedly gets local format (e.g. "08012345678")
function normalisePhoneForEmbedly(phone?: string): string {
  if (!phone) return '';
  if (phone.startsWith('+234')) return '0' + phone.slice(4);
  if (phone.startsWith('234') && phone.length > 10) return '0' + phone.slice(3);
  return phone;
}

// Embedly rejects names containing numbers or most special characters.
// Keep only letters, spaces, hyphens, apostrophes; trim and cap at 50 chars.
function sanitiseNameForEmbedly(raw: string): string {
  return raw
    .replace(/[^a-zA-Z\s\-']/g, '') // strip digits and symbols
    .replace(/\s+/g, ' ')            // collapse multiple spaces
    .trim()
    .slice(0, 50);
}

function parseNameForEmbedly(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = sanitiseNameForEmbedly(parts[0] || '') || 'Customer';
  // Use only the LAST word as lastName — Embedly rejects multi-word lastNames like "Thomas Amadi"
  const lastWordRaw = parts.length > 1 ? parts[parts.length - 1] : '';
  const lastName    = sanitiseNameForEmbedly(lastWordRaw) || firstName; // fallback to firstName
  return { firstName, lastName };
}

// Create customer and wallet in one call
// Also handles linking to existing Embedly customers created offline/at store
export async function setupCustomerWithWallet(customer: {
  email: string;
  full_name: string;
  phone?: string;
  dateOfBirth?: string; // DD-MM-YYYY or DD-MM from profiles.date_of_birth
}): Promise<{ customerId: string; walletId: string; isNewCustomer: boolean; bankAccount?: string; bankName?: string; bankCode?: string } | null> {
  if (!isEmbedlyConfigured()) {
    console.warn('Embedly not configured, skipping setup');
    return null;
  }

  const { firstName, lastName } = parseNameForEmbedly(customer.full_name);
  // Embedly expects local phone format e.g. "08012345678", not "+2348012345678"
  const localPhone = normalisePhoneForEmbedly(customer.phone);

  let customerId: string | undefined;
  let isNewCustomer = false;

  try {
    // Check if customer already exists in Embedly (e.g., created at store)
    const existingCustomer = await getCustomerByEmail(customer.email);

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
      console.log(`Embedly: Found existing customer ${customerId} for ${customer.email} - linking account`);
    } else {
      customerId = await createCustomer({
        email: customer.email,
        firstName,
        lastName,
        phone: localPhone,
        dateOfBirth: customer.dateOfBirth, // Pass actual DOB from profile (DD-MM-YYYY)
      });
      isNewCustomer = true;
      console.log(`Embedly: Created new customer ${customerId} for ${customer.email}`);
    }

    if (!customerId) {
      throw new Error(`Embedly customer creation returned no ID for ${customer.email}`);
    }
  } catch (customerError: unknown) {
    const msg = customerError instanceof Error ? customerError.message : String(customerError);
    console.error(`❌ Embedly customer creation failed for ${customer.email}:`, msg);
    return null;
  }

  // Create wallet (separate try so we keep the customerId for error tracking)
  try {
    const walletResult = await createWallet(customerId, customer.full_name);
    if (!walletResult.walletId) {
      throw new Error(`Embedly wallet creation returned no ID for customer ${customerId}`);
    }
    console.log(`Embedly: Wallet ${walletResult.walletId} ready for customer ${customerId}`);
    return {
      customerId,
      walletId: walletResult.walletId,
      isNewCustomer,
      bankAccount: walletResult.bankAccount,
      bankName: walletResult.bankName,
      bankCode: walletResult.bankCode,
    };
  } catch (walletError: unknown) {
    const errorMessage = walletError instanceof Error ? walletError.message : String(walletError);
    console.error(`❌ CRITICAL: Embedly wallet creation failed for customer ${customerId} (${customer.email}):`, errorMessage);

    // Track the failure for manual recovery using the admin client (no cookie context needed)
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();

      await admin.from('failed_integrations').insert({
        integration_type: 'embedly_wallet_creation',
        user_email: customer.email,
        error_message: errorMessage,
        error_details: {
          embedly_customer_id: customerId,
          full_name: customer.full_name,
          email: customer.email,
          error: errorMessage,
        },
        status: 'pending_retry',
        created_at: new Date().toISOString(),
      });
    } catch (trackingError) {
      console.error('Failed to track wallet creation failure:', trackingError);
    }

    // Return null — signup should still succeed even when wallet creation fails
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
