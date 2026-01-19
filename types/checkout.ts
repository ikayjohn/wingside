/**
 * Checkout-related type definitions
 */

export interface Address {
  id: string;
  user_id: string;
  street_address: string;
  street_address2?: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount?: number;
}

export interface PromoCodeValidationResponse {
  valid: boolean;
  promoCode: PromoCode;
  discountAmount: number;
  message: string;
}

export interface OrderAddon {
  rice?: string | string[];
  drink?: string | string[];
  milkshake?: string;
}

export interface OrderItem {
  product_id: string | null;
  quantity: number;
  price: number;
  flavors: string[];
  addons: OrderAddon;
  special_instructions?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  walletBalance: number;
  availableBalance: number;
  currency: string;
}

export interface ReferralInfo {
  referrer_id: string;
  rewards?: {
    referredReward: number;
    referrerReward: number;
  };
}
