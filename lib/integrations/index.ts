// Combined integration service for Zoho CRM and Embedly.ng
// This module provides a unified API for syncing customer and order data

import { syncCustomerToZoho, syncOrderToZoho, isZohoConfigured, addNoteToContact, getContactByEmail } from './zoho';
import { setupCustomerWithWallet, creditLoyaltyPoints, isEmbedlyConfigured, getWalletBalance } from './embedly';
import { createAdminClient } from '@/lib/supabase/admin';

export interface SyncResult {
  zoho?: { contact_id: string; action: 'created' | 'updated' };
  embedly?: { customer_id: string; wallet_id: string; isNewCustomer: boolean; bank_account?: string; bank_name?: string; bank_code?: string };
  error?: string;
}

// Sync new customer to all integrations
export async function syncNewCustomer(customer: {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  dateOfBirth?: string; // DD-MM-YYYY from profiles.date_of_birth
  address?: string;
  city?: string;
  state?: string;
}): Promise<SyncResult> {
  const result: SyncResult = {};

  // Sync to Zoho CRM
  if (isZohoConfigured()) {
    const zohoResult = await syncCustomerToZoho({
      email: customer.email,
      full_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
    });

    if (zohoResult) {
      result.zoho = {
        contact_id: zohoResult.zoho_contact_id,
        action: zohoResult.action,
      };
    }
  }

  // Setup Embedly customer and wallet
  if (isEmbedlyConfigured()) {
    try {
      const embedlyResult = await setupCustomerWithWallet({
        email: customer.email,
        full_name: customer.full_name,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
      });

      if (embedlyResult) {
        result.embedly = {
          customer_id: embedlyResult.customerId,
          wallet_id: embedlyResult.walletId,
          isNewCustomer: embedlyResult.isNewCustomer,
          bank_account: embedlyResult.bankAccount,
          bank_name: embedlyResult.bankName,
          bank_code: embedlyResult.bankCode,
        };
      } else {
        // setupCustomerWithWallet returns null on failure (error already logged inside)
        result.error = result.error
          ? `${result.error}; Embedly: setup returned null — check server logs`
          : 'Embedly: setup returned null — check server logs for the specific API error';
      }
    } catch (embedlyError: unknown) {
      const msg = embedlyError instanceof Error ? embedlyError.message : String(embedlyError);
      result.error = result.error ? `${result.error}; Embedly: ${msg}` : `Embedly: ${msg}`;
    }
  }

  // Update profile with integration IDs
  if (result.zoho || result.embedly) {
    const admin = createAdminClient();
    const updateData: any = {
      zoho_contact_id: result.zoho?.contact_id,
      embedly_customer_id: result.embedly?.customer_id,
      updated_at: new Date().toISOString(),
    };

    if (result.embedly?.wallet_id) {
      updateData.embedly_wallet_id = result.embedly.wallet_id;
      // Save virtual account details so the user can see their TAP card number immediately
      if (result.embedly.bank_account) updateData.bank_account = result.embedly.bank_account;
      if (result.embedly.bank_name) updateData.bank_name = result.embedly.bank_name;
      if (result.embedly.bank_code) updateData.bank_code = result.embedly.bank_code;
      updateData.is_wallet_active = true;
      updateData.last_wallet_sync = new Date().toISOString();
    }

    await admin
      .from('profiles')
      .update(updateData)
      .eq('id', customer.id);
  }

  return result;
}

// Sync order completion to all integrations
export async function syncOrderCompletion(order: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total: number;
  status: string;
}): Promise<{
  zoho_deal_id?: string;
  points_earned?: number;
  new_balance?: number;
}> {
  const result: any = {};

  // Get customer profile for integration IDs
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, embedly_wallet_id, zoho_contact_id')
    .eq('email', order.customer_email)
    .single();

  // Sync to Zoho CRM as Deal
  if (isZohoConfigured()) {
    const dealId = await syncOrderToZoho({
      order_number: order.order_number,
      customer_email: order.customer_email,
      total: order.total,
      status: order.status,
    });

    if (dealId) {
      result.zoho_deal_id = dealId;

      // Add note to contact
      if (profile?.zoho_contact_id) {
        await addNoteToContact(
          profile.zoho_contact_id,
          `Order ${order.order_number}`,
          `Order completed. Total: ₦${order.total.toLocaleString()}`
        );
      }
    }
  }

  // Credit loyalty points in Embedly
  if (isEmbedlyConfigured() && profile?.embedly_wallet_id) {
    const pointsResult = await creditLoyaltyPoints(
      profile.embedly_wallet_id,
      order.total,
      order.order_number
    );

    if (pointsResult) {
      result.points_earned = pointsResult.pointsEarned;
      result.new_balance = pointsResult.newBalance;

      // Update wallet balance in local profile
      await admin
        .from('profiles')
        .update({
          wallet_balance: pointsResult.newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
    }
  }

  return result;
}

// Get customer's current points balance
export async function getCustomerPointsBalance(email: string): Promise<number> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('wallet_balance, embedly_wallet_id')
    .eq('email', email)
    .single();

  // If Embedly is configured and we have a wallet ID, get live balance
  if (isEmbedlyConfigured() && profile?.embedly_wallet_id) {
    try {
      const balance = await getWalletBalance(profile.embedly_wallet_id);
      return balance;
    } catch {
      // Fall back to cached balance
      return profile?.wallet_balance || 0;
    }
  }

  return profile?.wallet_balance || 0;
}

// Check integration status
export function getIntegrationStatus(): {
  zoho: boolean;
  embedly: boolean;
} {
  return {
    zoho: isZohoConfigured(),
    embedly: isEmbedlyConfigured(),
  };
}
