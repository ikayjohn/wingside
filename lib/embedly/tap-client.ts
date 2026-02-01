/**
 * Embedly TAP Card API Client
 * Wrapper for Embedly's physical card tap payment API
 */

const EMBEDLY_TAP_BASE_URL = process.env.EMBEDLY_TAP_API_URL || 'https://api.embedly.com/tap/v1';
const EMBEDLY_TAP_API_KEY = process.env.EMBEDLY_TAP_API_KEY;

interface EmbedlyTapResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface CardOnboardRequest {
  customer_id: string;
  wallet_id: string;
  card_serial: string;
  card_pin: string; // Will be hashed by Embedly
}

interface CardOnboardResponse {
  card_id: string;
  customer_id: string;
  wallet_id: string;
  card_serial: string;
  status: 'active' | 'pending';
  created_at: string;
}

interface CardBalanceResponse {
  card_serial: string;
  balance: number;
  currency: string;
  last_updated: string;
}

interface CardTransaction {
  transaction_id: string;
  card_serial: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  merchant?: string;
  location?: string;
  timestamp: string;
  balance_after: number;
}

interface CardHistoryResponse {
  card_serial: string;
  transactions: CardTransaction[];
  total_count: number;
  page: number;
  limit: number;
}

interface CardTopUpRequest {
  card_serial: string;
  amount: number;
  source: 'wallet' | 'external';
  reference?: string;
}

interface CardTopUpResponse {
  transaction_id: string;
  card_serial: string;
  amount: number;
  new_balance: number;
  timestamp: string;
}

/**
 * Make authenticated request to Embedly TAP API
 */
async function embedlyTapRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EmbedlyTapResponse<T>> {
  if (!EMBEDLY_TAP_API_KEY) {
    console.error('EMBEDLY_TAP_API_KEY not configured');
    return {
      success: false,
      error: 'TAP card service not configured'
    };
  }

  const url = `${EMBEDLY_TAP_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${EMBEDLY_TAP_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Embedly TAP API error:', {
        status: response.status,
        endpoint,
        error: data
      });

      return {
        success: false,
        error: data.message || data.error || 'TAP card API request failed',
        data
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Embedly TAP API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Onboard a physical card to customer's wallet
 */
export async function onboardCard(params: CardOnboardRequest): Promise<EmbedlyTapResponse<CardOnboardResponse>> {
  return embedlyTapRequest<CardOnboardResponse>('/cards/onboard', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

/**
 * Get card balance (same as wallet balance)
 */
export async function getCardBalance(cardSerial: string): Promise<EmbedlyTapResponse<CardBalanceResponse>> {
  return embedlyTapRequest<CardBalanceResponse>(`/cards/${cardSerial}/balance`, {
    method: 'GET'
  });
}

/**
 * Get card transaction history
 */
export async function getCardHistory(
  cardSerial: string,
  page: number = 1,
  limit: number = 50
): Promise<EmbedlyTapResponse<CardHistoryResponse>> {
  return embedlyTapRequest<CardHistoryResponse>(
    `/cards/${cardSerial}/transactions?page=${page}&limit=${limit}`,
    { method: 'GET' }
  );
}

/**
 * Top up card (adds to wallet balance)
 */
export async function topUpCard(params: CardTopUpRequest): Promise<EmbedlyTapResponse<CardTopUpResponse>> {
  return embedlyTapRequest<CardTopUpResponse>('/cards/topup', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

/**
 * Suspend or unsuspend a card
 */
export async function updateCardStatus(
  cardSerial: string,
  status: 'active' | 'suspended' | 'lost' | 'stolen'
): Promise<EmbedlyTapResponse<{ status: string }>> {
  return embedlyTapRequest(`/cards/${cardSerial}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

/**
 * Verify card PIN (for POS transactions)
 */
export async function verifyCardPin(
  cardSerial: string,
  pin: string
): Promise<EmbedlyTapResponse<{ valid: boolean }>> {
  return embedlyTapRequest(`/cards/${cardSerial}/verify-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin })
  });
}
