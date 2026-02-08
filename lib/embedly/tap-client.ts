/**
 * Embedly TAP Card API Client (CORRECTED)
 * Based on official Embedly TAP API documentation
 *
 * Base URLs:
 * - Staging: https://waas-staging.embedly.ng/embedded/api/v1/tap/
 * - Production: https://waas-prod.embedly.ng/embedded/api/v1/tap/
 */

const EMBEDLY_TAP_BASE_URL = process.env.EMBEDLY_TAP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://waas-prod.embedly.ng/embedded/api/v1/tap'
    : 'https://waas-staging.embedly.ng/embedded/api/v1/tap');

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY; // Same key as wallet API

// Bypass mode for UI testing without actual API calls
const BYPASS_EMBEDLY_TAP = process.env.BYPASS_EMBEDLY_TAP === 'true';

/**
 * Embedly TAP API Response Structure
 */
interface EmbedlyTapApiResponse<T = any> {
  data: {
    error: {
      message: string;
      status: number;
      details: any;
    };
    success: {
      message: string;
      status: number; // 1 = success, 0 = failure
      details: any;
    };
    content: T;
    statusCode: number;
    newStatusCode: number;
  };
  status: number;
  message: string;
}

/**
 * Simplified response for our application
 */
interface EmbedlyTapResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Onboard Customer Request
 */
interface OnboardCustomerRequest {
  customerId: string;        // Embedly customer ID
  walletId: string;          // Embedly wallet ID
  cardSerial: string;        // Physical card serial (e.g., WS123456)
  transactionPin: string;    // Card PIN (will be hashed by Embedly)
  maxDebit: number;          // Maximum single transaction amount
}

/**
 * Get Balance Request
 */
interface GetBalanceRequest {
  cardSerial: string;
}

/**
 * Balance Response Content
 */
interface BalanceContent {
  phone: string;
  fullname: string;
  walletBalance: number;
  valid: number; // 1 = valid, 0 = invalid
}

/**
 * Transaction History Request
 */
interface TransactionHistoryRequest {
  cardSerial: string;
  fromDate: string;  // ISO date string
  toDate: string;    // ISO date string
}

/**
 * Transaction History Content
 */
interface TransactionHistoryContent {
  transactions: Array<{
    transactionId: string;
    cardSerial: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    merchantName?: string;
    merchantLocation?: string;
    timestamp: string;
    balanceAfter: number;
    reference: string;
  }>;
  totalCount: number;
}

/**
 * Search Customer Request
 */
interface SearchCustomerRequest {
  cardSerial: string;
}

/**
 * Search Customer Content
 */
interface SearchCustomerContent {
  customerId: string;
  walletId: string;
  fullname: string;
  phone: string;
  email?: string;
  cardSerial: string;
  status: string;
}

/**
 * Top Up Customer Request
 */
interface TopUpCustomerRequest {
  mobileNumber: string;
  amount: number;
  cardSerial: string;
}

/**
 * Make authenticated request to Embedly TAP API
 */
async function embedlyTapRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EmbedlyTapResponse<T>> {
  if (!EMBEDLY_API_KEY) {
    console.error('EMBEDLY_API_KEY not configured');
    return {
      success: false,
      error: 'TAP card service not configured - missing API key'
    };
  }

  const url = `${EMBEDLY_TAP_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY, // Correct authentication header
        ...options.headers,
      },
    });

    // Check if response is OK
    if (!response.ok) {
      console.error(`Embedly TAP API HTTP error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`
      };
    }

    const apiResponse: EmbedlyTapApiResponse<T> = await response.json();

    // Validate response structure
    if (!apiResponse || !apiResponse.data) {
      console.error('Embedly TAP API returned invalid response structure:', apiResponse);
      return {
        success: false,
        error: 'Invalid API response structure'
      };
    }

    // Check if the request was successful
    // Embedly returns 200 even for errors, check data.success.status
    if (apiResponse.data.success?.status === 1) {
      return {
        success: true,
        data: apiResponse.data.content,
        message: apiResponse.data.success.message
      };
    } else {
      // Extract error message safely
      const errorMessage = apiResponse.data.error?.message
        || apiResponse.data.success?.message
        || 'TAP card API request failed';

      console.error('Embedly TAP API error:', {
        endpoint,
        error: apiResponse.data.error,
        success: apiResponse.data.success,
        response: apiResponse
      });

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  } catch (error) {
    console.error('Embedly TAP API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * 1. Onboard a physical card to customer's wallet
 *
 * POST /onboard-customer
 */
export async function onboardCard(params: {
  customer_id: string;
  wallet_id: string;
  card_serial: string;
  card_pin: string;
  max_debit?: number;
}): Promise<EmbedlyTapResponse<any>> {
  return embedlyTapRequest('/onboard-customer', {
    method: 'POST',
    body: JSON.stringify({
      customerId: params.customer_id,
      walletId: params.wallet_id,
      cardSerial: params.card_serial,
      transactionPin: params.card_pin,
      maxDebit: params.max_debit || 50000 // Default ₦50,000
    })
  });
}

/**
 * 2. Get card balance (returns wallet balance)
 *
 * POST /get-balance
 */
export async function getCardBalance(
  cardSerial: string
): Promise<EmbedlyTapResponse<BalanceContent>> {
  return embedlyTapRequest<BalanceContent>('/get-balance', {
    method: 'POST',
    body: JSON.stringify({
      cardSerial
    })
  });
}

/**
 * 3. Get card transaction history
 *
 * GET /transaction-history with query params
 */
export async function getCardHistory(
  cardSerial: string,
  fromDate?: string,
  toDate?: string
): Promise<EmbedlyTapResponse<TransactionHistoryContent>> {
  // Default to last 30 days if not specified
  const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = toDate || new Date().toISOString().split('T')[0];

  const params = new URLSearchParams({
    cardSerial,
    fromDate: from,
    toDate: to
  });

  return embedlyTapRequest<TransactionHistoryContent>(
    `/transaction-history?${params.toString()}`,
    { method: 'GET' }
  );
}

/**
 * 4. Search for customer by card serial
 *
 * POST /search-customer
 */
export async function searchCustomer(
  cardSerial: string
): Promise<EmbedlyTapResponse<SearchCustomerContent>> {
  return embedlyTapRequest<SearchCustomerContent>('/search-customer', {
    method: 'POST',
    body: JSON.stringify({
      cardSerial
    })
  });
}

/**
 * 5. Top up card (credit customer wallet)
 *
 * POST /credit-or-topup-customer
 */
export async function topUpCard(params: {
  mobile_number: string;
  amount: number;
  card_serial: string;
}): Promise<EmbedlyTapResponse<any>> {
  return embedlyTapRequest('/credit-or-topup-customer', {
    method: 'POST',
    body: JSON.stringify({
      mobileNumber: params.mobile_number,
      amount: params.amount,
      cardSerial: params.card_serial
    })
  });
}

/**
 * Helper: Validate card serial format
 */
export function validateCardSerial(cardSerial: string): boolean {
  // Format: 8 alphanumeric characters (e.g., 372FB056)
  return /^[0-9A-F]{8}$/i.test(cardSerial);
}

/**
 * Helper: Validate transaction PIN format
 */
export function validateTransactionPin(pin: string): boolean {
  // PIN must be 4-6 digits
  return /^\d{4,6}$/.test(pin);
}

// Export types for use in API routes
export type {
  EmbedlyTapResponse,
  OnboardCustomerRequest,
  BalanceContent,
  TransactionHistoryContent,
  SearchCustomerContent,
  TopUpCustomerRequest
};
