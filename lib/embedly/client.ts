/**
 * Embedly API Client for Wingside Integration
 * Handles customer management, wallet operations, and payment processing
 */

export interface EmbedlyCustomer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emailAddress: string;
  mobileNumber: string;
  address?: string;
  city?: string;
  countryId: string;
  alias?: string;
  customerTypeId: string;
  dateCreated?: string;
  isCorporateVerified?: string;
}

export interface EmbedlyWallet {
  id: string;
  walletGroupId: string;
  customerId: string;
  availableBalance: number;
  ledgerBalance: number;
  currencyId: string;
  name: string;
  virtualAccount: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
  };
  isDefault: boolean;
  mobNum?: string;
}

export interface EmbedlyTransaction {
  id: string;
  walletId: string;
  amount: number;
  debitCreditIndicator: 'D' | 'C';
  balance: number;
  transactionReference: string;
  remarks: string;
  dateCreated: string;
  accountNumber: string;
  name?: string;
}

export interface Country {
  id: string;
  name: string;
  countryCodeTwo: string;
  countryCodeThree: string;
}

export interface Currency {
  id: string;
  name: string;
  shortName: string;
}

export interface CustomerType {
  id: string;
  name: string;
}

export interface Bank {
  bankname: string;
  bankcode: string;
}

export interface CreateCustomerRequest {
  organizationId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emailAddress: string;
  mobileNumber: string;
  dob?: string;
  customerTypeId: string;
  address?: string;
  city?: string;
  countryId: string;
  alias?: string;
}

export interface CreateWalletRequest {
  customerId: string;
  currencyId: string;
  name: string;
}

export interface WalletTransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  transactionReference: string;
  remarks: string;
}

export interface InterBankTransferRequest {
  destinationBankCode: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  sourceAccountNumber: string;
  sourceAccountName: string;
  remarks: string;
  amount: number;
  currencyId: string;
  customerTransactionReference: string;
}

export interface SimulateInflowRequest {
  beneficiaryAccountName: string;
  beneficiaryAccountNumber: string;
  amount: string;
  narration: string;
}

export interface CheckoutWalletRequest {
  organizationId: string;
  expectedAmount: number;
  organizationPrefixMappingId: string;
  expiryDurationMinutes?: number;
}

export interface CheckoutWalletResponse {
  id: string;
  walletNumber: string;
  organizationId: string;
  walletName: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  expectedAmount: number;
  checkoutRef: string;
}

class EmbedlyClient {
  private apiKey: string;
  private baseUrl: string;
  private payoutUrl: string;
  private checkoutUrl: string;
  private cardUrl: string;

  constructor(apiKey: string, environment: 'production' | 'staging' = 'production') {
    this.apiKey = apiKey;

    if (environment === 'production') {
      this.baseUrl = 'https://waas-prod.embedly.ng/api/v1';
      this.payoutUrl = 'https://payout-staging.embedly.ng/api/Payout'; // Note: staging URL for payout
      this.checkoutUrl = 'https://checkout-prod.embedly.ng';
      this.cardUrl = 'https://waas-card-middleware-api-prod.embedly.ng';
    } else {
      this.baseUrl = 'https://waas-staging.embedly.ng/api/v1';
      this.payoutUrl = 'https://payout-staging.embedly.ng/api/Payout';
      this.checkoutUrl = 'https://checkout-staging.embedly.ng';
      this.cardUrl = 'https://waas-card-middleware-api-staging.embedly.ng';
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    customBaseUrl?: string
  ): Promise<T> {
    const url = `${customBaseUrl || this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Embedly API Error:', error);
      throw error;
    }
  }

  // Customer Management
  async createCustomer(customerData: CreateCustomerRequest): Promise<EmbedlyCustomer> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: EmbedlyCustomer;
    }>('/customers/add', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });

    return response.data;
  }

  async getCustomerById(customerId: string): Promise<EmbedlyCustomer> {
    const response = await this.makeRequest<{
      data: EmbedlyCustomer;
      status: number;
      message: string;
    }>(`/customers/get/id/${customerId}`);

    return response.data;
  }

  async getCustomerByEmail(email: string): Promise<EmbedlyCustomer | null> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: EmbedlyCustomer[];
    }>('/customers/get/all');

    const customers = response.data.filter(
      (customer: EmbedlyCustomer) =>
        customer.emailAddress.toLowerCase() === email.toLowerCase()
    );

    return customers.length > 0 ? customers[0] : null;
  }

  async updateCustomerName(
    customerId: string,
    updateData: Partial<CreateCustomerRequest>
  ): Promise<void> {
    await this.makeRequest(`/customers/customer/${customerId}/updatename`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async updateCustomerContact(
    customerId: string,
    updateData: { mobileNumber?: string; emailAddress?: string }
  ): Promise<void> {
    await this.makeRequest(`/customers/customer/${customerId}/updatecontact`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Wallet Management
  async createWallet(walletData: CreateWalletRequest): Promise<EmbedlyWallet> {
    const response = await this.makeRequest<{
      message: string;
      walletId: string;
      virtualAccount: {
        accountNumber: string;
        bankCode: string;
        bankName: string;
      };
      mobNum?: string;
    }>('/wallets/add', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });

    // Get full wallet details
    return await this.getWalletById(response.walletId);
  }

  async getWalletById(walletId: string): Promise<EmbedlyWallet> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: EmbedlyWallet;
    }>(`/wallets/get/wallet/${walletId}`);

    return response.data;
  }

  async getWalletByAccountNumber(accountNumber: string): Promise<EmbedlyWallet> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: EmbedlyWallet;
    }>(`/wallets/get/wallet/account/${accountNumber}`);

    return response.data;
  }

  async getWalletHistory(walletId: string): Promise<EmbedlyTransaction[]> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: {
        walletHistories: EmbedlyTransaction[];
      };
    }>(`/wallets/history?walletId=${walletId}`);

    return response.data.walletHistories;
  }

  async getWalletHistoryByAccountNumber(accountNumber: string): Promise<EmbedlyTransaction[]> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: {
        walletHistories: EmbedlyTransaction[];
      };
    }>(`/wallets/account-number/history?accountNumber=${accountNumber}`);

    return response.data.walletHistories;
  }

  // Wallet Transfers
  async walletToWalletTransfer(transferData: WalletTransferRequest): Promise<void> {
    await this.makeRequest('/wallets/wallet/transaction/v2/wallet-to-wallet', {
      method: 'PUT',
      body: JSON.stringify(transferData),
    });
  }

  async getTransferStatus(transactionReference: string): Promise<{
    reference: string;
    status: string;
    timestamp: string;
  }> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: {
        reference: string;
        status: string;
        timestamp: string;
      };
    }>(`/wallets/wallet/transaction/wallet-to-wallet/status/${transactionReference}`);

    return response.data;
  }

  // Interbank Transfers
  async interBankTransfer(transferData: InterBankTransferRequest): Promise<string> {
    const response = await this.makeRequest<{
      data: string;
      statusCode: number;
      code: string;
      message: string;
      succeeded: boolean;
    }>('/inter-bank-transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    }, this.payoutUrl);

    return response.data;
  }

  async getInterBankTransferStatus(transactionRef: string): Promise<{
    status: string;
    transactionReference: string;
    providerReference?: string;
    paymentReference?: string;
    sessionId?: string;
  }> {
    const response = await this.makeRequest<{
      data: {
        status: string;
        transactionReference: string;
        providerReference?: string;
        paymentReference?: string;
        sessionId?: string;
      };
      statusCode: number;
      message: string;
      succeeded: boolean;
    }>(`/status/${transactionRef}`, {}, this.payoutUrl);

    return response.data;
  }

  // Utilities
  async getCountries(): Promise<Country[]> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: Country[];
    }>('/utilities/countries/get');

    return response.data;
  }

  async getCurrencies(): Promise<Currency[]> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: Currency[];
    }>('/utilities/currencies/get');

    return response.data;
  }

  async getCustomerTypes(): Promise<CustomerType[]> {
    const response = await this.makeRequest<{
      code: string;
      success: boolean;
      message: string;
      data: CustomerType[];
    }>('/customers/types/all');

    return response.data;
  }

  async getBanks(): Promise<Bank[]> {
    const response = await this.makeRequest<{
      data: Bank[];
      statusCode: number;
      code: string;
      message: string;
      succeeded: boolean;
    }>('/banks', {}, this.payoutUrl);

    return response.data;
  }

  async nameEnquiry(bankCode: string, accountNumber: string): Promise<{
    destinationBankCode: string;
    accountNumber: string;
    accountName: string;
  }> {
    const response = await this.makeRequest<{
      data: {
        destinationBankCode: string;
        accountNumber: string;
        accountName: string;
      };
      statusCode: number;
      code: string;
      message: string;
      succeeded: boolean;
    }>('/name-enquiry', {
      method: 'POST',
      body: JSON.stringify({
        bankCode,
        accountNumber,
      }),
    }, this.payoutUrl);

    return response.data;
  }

  // Staging Only - Simulate Inflow
  async simulateInflow(inflowData: SimulateInflowRequest): Promise<void> {
    if (this.baseUrl.includes('prod')) {
      throw new Error('Simulate inflow is only available in staging environment');
    }

    await this.makeRequest('/WaasCore/api/v1/nip/inflow/simulate-inflow', {
      method: 'POST',
      body: JSON.stringify(inflowData),
    }, this.baseUrl.replace('/api/v1', ''));
  }

  // Checkout Wallets
  async createCheckoutWallet(checkoutData: CheckoutWalletRequest): Promise<CheckoutWalletResponse> {
    const response = await this.makeRequest<{
      statusCode: number;
      message: string;
      data: CheckoutWalletResponse;
    }>('/checkout-wallet', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    }, this.checkoutUrl);

    return response.data;
  }

  async getCheckoutWallets(): Promise<CheckoutWalletResponse[]> {
    const response = await this.makeRequest<{
      statusCode: number;
      message: string;
      data: CheckoutWalletResponse[];
    }>('/checkout-wallet', {}, this.checkoutUrl);

    return response.data;
  }

  // KYC Operations
  async performNinKyc(firstName: string, lastName: string, dob: string): Promise<any> {
    const response = await this.makeRequest('/customers/kyc/customer/nin', {
      method: 'POST',
      body: JSON.stringify({
        firstname: firstName,
        lastname: lastName,
        dob: dob,
      }),
    });

    return response;
  }

  async performBvnKyc(customerId: string, bvn: string): Promise<any> {
    const response = await this.makeRequest('/customers/kyc/premium-kyc', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        bvn,
      }),
    });

    return response;
  }
}

// Create singleton instance
const embedlyClient = new EmbedlyClient(
  process.env.EMBEDLY_API_KEY || '',
  'production' // Always use production as per your setup
);

export default embedlyClient;
export { EmbedlyClient };