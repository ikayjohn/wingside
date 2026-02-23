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
    console.error(`Embedly API error (${endpoint}): [HTTP ${response.status}]`, errorText || '(empty body)');
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
    dob: formatDobForEmbedly(customer.dateOfBirth) || '1990-01-01T00:00:00.000Z', // Embedly requires YYYY-MM-DDTHH:MM:SS.000Z
    city: 'Port Harcourt', // Default city - can be overridden
    address: 'Wingside Customer', // Default address - can be overridden
  });
  return result.data?.id || (result as any).id;
}

// Get customer by ID — try multiple endpoint patterns since Embedly docs are unclear
export async function getCustomer(customerId: string): Promise<EmbedlyCustomer | null> {
  const endpoints = [
    `/customers/get/${customerId}`,
    `/customers/${customerId}`,
    `/customer/${customerId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await embedlyRequest<EmbedlyCustomer>(endpoint);
      const customer = result.data || (result as any);
      // Validate we got a real customer object (not an empty body parsed as {})
      if (customer && (customer.id || customer.emailAddress || customer.email)) {
        console.log(`Embedly getCustomer: found via ${endpoint}`);
        return customer;
      }
    } catch (error) {
      console.error(`Embedly getCustomer [${endpoint}]:`, error instanceof Error ? error.message : error);
      // try next endpoint
    }
  }
  return null;
}

// Get customer by email (checks all customers)
// Embedly /customers/get/all returns paginated responses in multiple shapes.
// extractCustomerArray handles all known variants.
function extractCustomerArray(result: any): any[] {
  // Try result.data first (embedlyRequest wraps payload in .data)
  const raw = result.data ?? result;

  if (Array.isArray(raw)) return raw;

  // Paginated object shapes
  if (Array.isArray(raw?.items))     return raw.items;
  if (Array.isArray(raw?.content))   return raw.content;
  if (Array.isArray(raw?.records))   return raw.records;
  if (Array.isArray(raw?.customers)) return raw.customers;
  if (Array.isArray(raw?.data))      return raw.data;
  if (Array.isArray(raw?.results))   return raw.results;
  if (Array.isArray(raw?.list))      return raw.list;

  // Single object that is itself a customer?
  if (raw?.id && (raw?.emailAddress || raw?.email)) return [raw];

  return [];
}

// Normalize phone to last 10 digits for comparison (handles +234, 234, 0 prefixes)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length > 10) return digits.slice(3);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  return digits;
}

// Find a customer in Embedly by phone number (used when email lookup fails due to credential conflict)
async function getCustomerByPhone(phone: string): Promise<EmbedlyCustomer | null> {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 7) return null;

  const listEndpoints = [
    `/customers/get/all?organizationId=${EMBEDLY_ORG_ID}`,
    `/customers/get/all`,
  ];

  for (const endpoint of listEndpoints) {
    try {
      const result = await embedlyRequest<any>(endpoint, 'GET');
      const customerArray = extractCustomerArray(result);
      if (customerArray.length === 0) continue;

      const found = customerArray.find((c: any) => {
        const cp = normalizePhone(c.mobileNumber || c.phone || '');
        return cp.length >= 7 && cp === normalizedPhone;
      });

      if (found) return found;
      return null; // Got a list, no match — phone not in Embedly
    } catch (error) {
      console.error(`Embedly getCustomerByPhone [${endpoint}]:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

export async function getCustomerByEmail(email: string): Promise<EmbedlyCustomer | null> {
  const emailLower = email.toLowerCase();

  // Strategy 1: try a direct email-filter query if the API supports it
  const filterEndpoints = [
    `/customers/get/all?organizationId=${EMBEDLY_ORG_ID}&email=${encodeURIComponent(email)}`,
    `/customers/get/all?organizationId=${EMBEDLY_ORG_ID}&emailAddress=${encodeURIComponent(email)}`,
    `/customers/search?organizationId=${EMBEDLY_ORG_ID}&email=${encodeURIComponent(email)}`,
  ];

  for (const endpoint of filterEndpoints) {
    try {
      const result = await embedlyRequest<any>(endpoint, 'GET');
      const arr = extractCustomerArray(result);
      if (arr.length > 0) {
        const found = arr.find((c: any) =>
          (c.emailAddress || c.email || '').toLowerCase() === emailLower
        );
        if (found) {
          console.log(`Embedly getCustomerByEmail: found via filter endpoint ${endpoint}`);
          return found;
        }
      }
    } catch {
      // Filter param not supported — fall through to full scan
    }
  }

  // Strategy 2: fetch the full customer list (Embedly returns all customers in one shot, ignores pageSize)
  const listEndpoints = [
    `/customers/get/all?organizationId=${EMBEDLY_ORG_ID}`,
    `/customers/get/all`,
  ];

  for (const endpoint of listEndpoints) {
    try {
      const result = await embedlyRequest<any>(endpoint, 'GET');
      const customerArray = extractCustomerArray(result);

      console.log(`Embedly getCustomerByEmail: scanning ${customerArray.length} customers for ${email}`);

      if (customerArray.length === 0) continue;

      const found = customerArray.find((c: any) =>
        (c.emailAddress || c.email || '').toLowerCase() === emailLower
      );

      if (found) return found;

      // Got a non-empty list but no match — customer genuinely not in Embedly
      console.log(`Embedly getCustomerByEmail: ${email} not found in ${customerArray.length} customers`);
      return null;
    } catch (error) {
      console.error(`Embedly getCustomerByEmail [${endpoint}]:`, error instanceof Error ? error.message : error);
    }
  }

  console.warn(`Embedly getCustomerByEmail: all endpoints failed for ${email}`);
  return null;
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

// Extract walletId from any customer object shape
function extractWalletId(obj: any): string | undefined {
  return obj?.walletId || obj?.wallet_id || obj?.defaultWalletId || obj?.wallets?.[0]?.id || obj?.wallet?.id;
}

// Get existing wallet for a customer (fallback when wallet limit is reached)
async function getCustomerWallets(customerId: string): Promise<any[]> {
  // Strategy 1: try dedicated wallet-by-customer endpoints
  const walletEndpoints = [
    `/wallet/customer/${customerId}`,
    `/wallets/customer/${customerId}`,
    `/wallets/get/all?customerId=${customerId}`,
    `/wallets/get/all?customerId=${customerId}&organizationId=${EMBEDLY_ORG_ID}`,
  ];

  for (const endpoint of walletEndpoints) {
    try {
      const result = await embedlyRequest<any>(endpoint);
      const raw = result.data ?? result;
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : null;
      if (arr && arr.length > 0) {
        console.log(`Embedly: Found ${arr.length} wallet(s) via ${endpoint}`);
        return arr;
      }
      if (raw?.id || raw?.walletId) {
        console.log(`Embedly: Found wallet object via ${endpoint}`);
        return [raw];
      }
    } catch (err) {
      console.error(`Embedly getCustomerWallets [${endpoint}]:`, err instanceof Error ? err.message : err);
    }
  }

  // Strategy 2: get customer record — it may embed a walletId field
  try {
    const customer = await getCustomer(customerId) as any;
    if (customer) {
      const walletId = extractWalletId(customer);
      if (walletId) {
        console.log(`Embedly: Found wallet ${walletId} on customer record for ${customerId}`);
        return [{ id: walletId }];
      }
      console.warn(`Embedly: Customer ${customerId} fetched by ID but no walletId. Keys: ${Object.keys(customer).join(', ')}`);
    }
  } catch { /* ignore */ }

  // Strategy 3: scan the full customer list and find by ID — walletId may be on the list entry
  try {
    const result = await embedlyRequest<any>(`/customers/get/all?organizationId=${EMBEDLY_ORG_ID}`);
    const customers = extractCustomerArray(result);
    const found = customers.find((c: any) => c.id === customerId);
    if (found) {
      const walletId = extractWalletId(found);
      if (walletId) {
        console.log(`Embedly: Found wallet ${walletId} for customer ${customerId} via customer list scan`);
        return [{ id: walletId }];
      }
      console.warn(`Embedly: Customer ${customerId} found in list scan but no walletId. Keys: ${Object.keys(found).join(', ')}`);
    }
  } catch (err) {
    console.error('Embedly getCustomerWallets [list scan]:', err instanceof Error ? err.message : err);
  }

  // Strategy 4: fetch ALL wallets for the org and match by customerId
  const orgWalletEndpoints = [
    `/wallets/get/all?organizationId=${EMBEDLY_ORG_ID}`,
    `/wallets/get/all`,
    `/wallet/get/all?organizationId=${EMBEDLY_ORG_ID}`,
  ];

  for (const endpoint of orgWalletEndpoints) {
    try {
      const result = await embedlyRequest<any>(endpoint);
      const raw = result.data ?? result;
      const arr: any[] = Array.isArray(raw) ? raw
        : Array.isArray(raw?.items)    ? raw.items
        : Array.isArray(raw?.content)  ? raw.content
        : Array.isArray(raw?.records)  ? raw.records
        : Array.isArray(raw?.wallets)  ? raw.wallets
        : Array.isArray(raw?.data)     ? raw.data
        : [];

      if (arr.length > 0) {
        const found = arr.find((w: any) =>
          w.customerId === customerId ||
          w.customer_id === customerId ||
          w.customer?.id === customerId
        );
        if (found) {
          const walletId = found.id || found.walletId;
          if (walletId) {
            console.log(`Embedly: Found wallet ${walletId} for customer ${customerId} via org wallet list scan (${endpoint})`);
            return [found];
          }
        }
        // Got a list but no match — no point trying other endpoints
        console.warn(`Embedly: Org wallet list returned ${arr.length} wallets but none matched customer ${customerId}`);
        break;
      }
    } catch (err) {
      console.error(`Embedly getCustomerWallets [org wallet scan ${endpoint}]:`, err instanceof Error ? err.message : err);
    }
  }

  return [];
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

    // Embedly wraps the wallet object in result.data.
    // Virtual account is inside result.data, not at the top-level result.
    const walletId: string = result.data?.id || (result as any).walletId || (result as any).id;
    // Bug fix: read virtualAccount from result.data first (where embedlyRequest puts the payload),
    // with a fallback to the top level in case the API response shape changes.
    const va = (result.data as any)?.virtualAccount ?? (result as any).virtualAccount;

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

// Convert app's DOB format (DD-MM-YYYY or DD-MM) to Embedly's YYYY-MM-DDTHH:MM:SS.000Z
// Returns undefined if conversion fails — caller uses the placeholder
function formatDobForEmbedly(dob?: string): string | undefined {
  if (!dob) return undefined;
  const parts = dob.split('-');
  if (parts.length === 3) {
    let year: string, month: string, day: string;
    if (parts[0].length === 4) {
      // Already YYYY-MM-DD
      [year, month, day] = parts;
    } else {
      // DD-MM-YYYY (app storage format)
      [day, month, year] = parts;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
  }
  return undefined; // DD-MM only (no year) — not enough for Embedly
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

      // If the customer record already carries a walletId, use it directly
      const existingWalletId = extractWalletId(existingCustomer);
      if (existingWalletId) {
        console.log(`Embedly: Customer ${customerId} already has wallet ${existingWalletId} — skipping creation`);
        return { customerId, walletId: existingWalletId, isNewCustomer: false };
      }
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

    // "already exists" can mean email OR phone is duplicated.
    // Search by email first, then by phone, before giving up.
    if (msg.toLowerCase().includes('already exist')) {
      console.log(`Embedly: "already exists" for ${customer.email} (original: "${msg}") — searching by email then phone`);

      // 1. Try email lookup
      const existingByEmail = await getCustomerByEmail(customer.email);
      if (existingByEmail?.id) {
        customerId = existingByEmail.id;
        console.log(`Embedly: Found existing customer ${customerId} for ${customer.email} by email`);
      } else if (localPhone) {
        // 2. Phone is the duplicate — find the Embedly account that holds this phone
        console.log(`Embedly: Email not found — searching by phone ${localPhone} for ${customer.email}`);
        const existingByPhone = await getCustomerByPhone(localPhone);
        if (existingByPhone?.id) {
          customerId = existingByPhone.id;
          console.log(`Embedly: Found existing customer ${customerId} by phone (stored email: ${existingByPhone.emailAddress || existingByPhone.email}) — linking to ${customer.email}`);
        } else {
          throw new Error(`Embedly: "already exists" but customer not found by email or phone. The conflicting credential may be in a different org. Original error: "${msg}"`);
        }
      } else {
        throw new Error(`Embedly: "already exists" but ${customer.email} not found in customer list. Original error: "${msg}"`);
      }
    } else {
      console.error(`❌ Embedly customer creation failed for ${customer.email}:`, msg);
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();
        await admin.from('failed_integrations').insert({
          integration_type: 'embedly_customer_creation',
          user_email: customer.email,
          error_message: msg,
          error_details: { full_name: customer.full_name, email: customer.email, error: msg },
          status: 'pending_retry',
          created_at: new Date().toISOString(),
        });
      } catch (trackingError) {
        console.error('Failed to track customer creation failure:', trackingError);
      }
      throw new Error(`Embedly customer creation failed: ${msg}`);
    }
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

    // "Allowed number of wallets reached" means the customer already HAS a wallet in Embedly,
    // but none of the lookup strategies found it. Save the customer ID anyway so they
    // appear as "Customer only" (not "Not synced") and can be manually resolved.
    if (errorMessage.includes('Allowed number of wallets reached')) {
      console.warn(`Embedly: ${customer.email} already has a wallet in Embedly but it could not be fetched. Saving customer ID only.`);
      return { customerId, walletId: '', isNewCustomer };
    }

    // Throw so callers (admin sync) can surface the real error message.
    // The signup flow catches this via try/catch in syncNewCustomer so signup still succeeds.
    throw new Error(`Embedly wallet creation failed for customer ${customerId}: ${errorMessage}`);
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
