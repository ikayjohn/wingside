/**
 * Wallet Helper Functions
 *
 * Helper functions for wallet operations using the wallet_transactions table
 */

import { createClient } from '@/lib/supabase/server';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  order_id?: string;
  referral_reward_id?: string;
  reward_claim_id?: string;
  promo_code_id?: string;
  metadata?: any;
  created_at: string;
}

/**
 * Get current wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('balance_after')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return Number(data.balance_after);
}

/**
 * Credit wallet (add money)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  transactionType: string,
  description: string,
  options: {
    referral_reward_id?: string;
    reward_claim_id?: string;
    promo_code_id?: string;
    metadata?: any;
  } = {}
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const supabase = await createClient();

  // Get current balance
  const currentBalance = await getWalletBalance(userId);
  const newBalance = currentBalance + amount;

  // Insert transaction
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      type: 'credit',
      amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      description,
      referral_reward_id: options.referral_reward_id,
      reward_claim_id: options.reward_claim_id,
      promo_code_id: options.promo_code_id,
      metadata: options.metadata || {},
      status: 'completed',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error crediting wallet:', error);
    return { success: false, error: error.message };
  }

  return { success: true, transactionId: data.id };
}

/**
 * Debit wallet (remove money)
 */
export async function debitWallet(
  userId: string,
  amount: number,
  transactionType: string,
  description: string,
  options: {
    order_id?: string;
    metadata?: any;
  } = {}
): Promise<{ success: boolean; transactionId?: string; error?: string; newBalance?: number }> {
  const supabase = await createClient();

  // Get current balance
  const currentBalance = await getWalletBalance(userId);

  // Check sufficient balance
  if (currentBalance < amount) {
    return {
      success: false,
      error: `Insufficient wallet balance. Current: ₦${currentBalance.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
    };
  }

  const newBalance = currentBalance - amount;

  // Insert transaction
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      type: 'debit',
      amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      description,
      order_id: options.order_id,
      metadata: options.metadata || {},
      status: 'completed',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error debiting wallet:', error);
    return { success: false, error: error.message };
  }

  return { success: true, transactionId: data.id, newBalance };
}

/**
 * Get wallet transaction history
 */
export async function getWalletHistory(
  userId: string,
  limit: number = 50
): Promise<{ transactions: WalletTransaction[]; balance: number }> {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching wallet history:', error);
    return { transactions: [], balance: 0 };
  }

  const balance = transactions && transactions.length > 0
    ? Number(transactions[0].balance_after)
    : 0;

  return {
    transactions: (transactions || []) as WalletTransaction[],
    balance
  };
}

/**
 * Record a referral reward to wallet
 */
export async function creditReferralReward(
  userId: string,
  amount: number,
  rewardId: string,
  description: string
): Promise<boolean> {
  const result = await creditWallet(userId, amount, 'referral_reward', description, {
    referral_reward_id: rewardId,
    metadata: { reward_id: rewardId }
  });

  return result.success;
}

/**
 * Record purchase points as wallet credit
 */
export async function creditPurchasePoints(
  userId: string,
  amountSpent: number,
  pointsEarned: number,
  orderId: string
): Promise<boolean> {
  const result = await creditWallet(userId, pointsEarned, 'purchase_points', `Points earned from order #${orderId}`, {
    metadata: { amount_spent: amountSpent, order_id: orderId }
  });

  return result.success;
}

/**
 * Record first order bonus
 */
export async function creditFirstOrderBonus(
  userId: string,
  orderId: string,
  orderNumber: string
): Promise<boolean> {
  const result = await creditWallet(userId, 15, 'first_order_bonus', `First order bonus - ${orderNumber}`, {
    metadata: { order_id: orderId, order_number: orderNumber }
  });

  return result.success;
}

/**
 * Pay for order using wallet balance
 */
export async function payWithWallet(
  userId: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const result = await debitWallet(userId, amount, 'order_payment', `Order Payment - ${orderId}`, {
    order_id: orderId,
    metadata: { order_payment: true }
  });

  return result;
}
