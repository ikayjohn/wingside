// Embedly Checkout API Types

export interface EmbedlyCredentials {
  apiKey: string
  organizationId: string
  settlementAccountId: string
  alias: string
  baseUrl: string
}

export interface EmbedlyOrganizationPrefixMapping {
  id: string
  secondaryPrefix: string
  primaryPrefixId: string
  organizationId: string
  alias: string
  organizationName: string
  organizationIsActive: string
}

export interface EmbedlyBeneficiary {
  beneficiaryId: string
  splitValue: number
  feeValue?: number
  feeBearer?: boolean
}

export interface CreateCheckoutWalletRequest {
  organizationId: string
  expectedAmount: number
  organizationPrefixMappingId: string
  expiryDurationMinutes: number
  invoiceReference: string
  description: string
  currencyCode: string
  customerEmail: string
  customerName: string
  metadata?: string
  splitType?: 'Fixed' | 'Percentage'
  incomeSplitConfig?: EmbedlyBeneficiary[]
}

export interface CheckoutWallet {
  id: string
  walletNumber: string
  organizationId: string
  walletName: string
  status: 'Active' | 'Used' | 'Expired' | 'Reactivated'
  createdAt: string
  expiresAt: string
  usedAt?: string
  expiredAt?: string
  reactivatedAt?: string
  expectedAmount: number
  checkoutRef: string
  invoiceReference?: string
  description?: string
  currencyCode?: string
  customerEmail?: string
  customerName?: string
  metadata?: string
  splitConfigurations?: any[]
}

export interface CheckoutWalletTransaction {
  id: string
  amount: number
  senderAccountNumber: string
  senderName: string
  recipientAccountNumber: string
  recipientName: string
  organizationSettlementAccount: string
  status: 'Completed' | 'Pending' | 'Failed'
  reference: string
  createdAt: string
  completedAt?: string
  sessionId: string
  reversalId?: string
}

export interface WalletTransactionsResponse {
  id: string
  walletNumber: string
  organizationId: string
  walletName: string
  status: string
  transactions: CheckoutWalletTransaction[]
}

export interface EmbedlyApiResponse<T> {
  statusCode: number
  message: string
  data: T
  pagination?: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface EmbedlyWebhookEvent {
  event: string
  data: {
    walletId: string
    walletNumber: string
    checkoutRef: string
    invoiceReference?: string
    amount: number
    transactionId?: string
    senderAccountNumber?: string
    senderName?: string
    status: string
    timestamp: string
    metadata?: string
  }
}
