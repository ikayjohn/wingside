import { sendEmail, canSendEmailToUser } from './email';
import {
  sendPushNotification,
  canSendPushToUser,
  sendOrderConfirmationPush,
  sendOrderStatusPush,
  sendPromotionPush,
  sendRewardPush,
} from './push';
import {
  sendSMS,
  sendOrderConfirmationSMS,
  sendOrderStatusSMS,
  canSendSMSToUser,
  isSMSEnabled,
} from './sms';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * User data structure returned from lookup
 */
export interface UserLookupResult {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
}

/**
 * Look up user information by user ID
 * Uses service client to bypass RLS for server-side notifications
 */
export async function lookupUser(userId: string): Promise<UserLookupResult | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error looking up user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in user lookup:', error);
    return null;
  }
}

/**
 * Look up multiple users by their IDs
 * Returns a map of userId -> user data
 */
export async function lookupUsers(userIds: string[]): Promise<Map<string, UserLookupResult>> {
  const userMap = new Map<string, UserLookupResult>();

  if (userIds.length === 0) return userMap;

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .in('id', userIds);

    if (error) {
      console.error('Error looking up users:', error);
      return userMap;
    }

    if (data) {
      for (const user of data) {
        userMap.set(user.id, user);
      }
    }

    return userMap;
  } catch (error) {
    console.error('Unexpected error in users lookup:', error);
    return userMap;
  }
}

export interface NotificationOptions {
  channels: ('email' | 'push' | 'sms')[];
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  type: 'order_confirmation' | 'order_status' | 'promotion' | 'reward' | 'reminder';
  data: Record<string, any>;
  preferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * Unified notification function that sends to multiple channels
 */
export async function sendNotification(options: NotificationOptions): Promise<{
  email: { sent: boolean; error?: string };
  push: { sent: boolean; failed: number; error?: string };
  sms: { sent: boolean; error?: string };
}> {
  const results = {
    email: { sent: false },
    push: { sent: false, failed: 0 },
    sms: { sent: false },
  };

  // Send email if enabled
  if (options.channels.includes('email') && options.userEmail) {
    const canSend =
      options.preferences?.email !== false &&
      (await checkEmailPreference(options.userId, options.type));

    if (canSend) {
      try {
        let emailResult;

        switch (options.type) {
          case 'order_confirmation':
            emailResult = await sendEmail({
              to: options.userEmail,
              template_key: 'order_confirmation',
              variables: options.data,
            });
            break;

          case 'order_status':
            emailResult = await sendEmail({
              to: options.userEmail,
              template_key: 'order_ready',
              variables: options.data,
            });
            break;

          case 'promotion':
            emailResult = await sendEmail({
              to: options.userEmail,
              template_key: 'promotion',
              variables: options.data,
            });
            break;

          case 'reward':
            emailResult = await sendEmail({
              to: options.userEmail,
              template_key: 'reward_earned',
              variables: {
                customer_name: options.userName,
                ...options.data,
              },
            });
            break;

          default:
            emailResult = { success: false, error: 'Unknown notification type' };
        }

        results.email = {
          sent: emailResult.success,
          ...(emailResult.error ? { error: emailResult.error } : {}),
        };
      } catch (error: any) {
        results.email = { sent: false, ...(error.message ? { error: error.message } : {}) };
      }
    }
  }

  // Send push if enabled
  if (options.channels.includes('push')) {
    const canSend =
      options.preferences?.push !== false &&
      (await checkPushPreference(options.userId, options.type));

    if (canSend) {
      try {
        let pushResult;

        switch (options.type) {
          case 'order_confirmation':
            pushResult = await sendOrderConfirmationPush(options.userId, options.data as any);
            break;

          case 'order_status':
            pushResult = await sendOrderStatusPush(
              options.userId,
              options.data.status || 'ready',
              options.data as any
            );
            break;

          case 'promotion':
            pushResult = await sendPromotionPush(options.userId, options.data as any);
            break;

          case 'reward':
            pushResult = await sendRewardPush(options.userId, options.data as any);
            break;

          default:
            pushResult = await sendPushNotification(options.userId, {
              title: options.data.title || 'Notification',
              body: options.data.body || '',
              ...options.data,
            });
        }

        results.push = {
          sent: pushResult.success,
          failed: pushResult.failed || 0,
          ...(pushResult.error ? { error: pushResult.error } : {}),
        };
      } catch (error: any) {
        results.push = { sent: false, failed: 0, ...(error.message ? { error: error.message } : {}) };
      }
    }
  }

  // Send SMS if enabled
  if (options.channels.includes('sms') && options.userPhone) {
    const canSend =
      options.preferences?.sms !== false &&
      isSMSEnabled() &&
      (await checkSMSPreference(options.userId, options.type));

    if (canSend) {
      try {
        let smsResult;

        switch (options.type) {
          case 'order_confirmation':
            smsResult = await sendOrderConfirmationSMS(options.userPhone, {
              orderNumber: options.data.orderNumber,
              totalAmount: options.data.totalAmount,
              estimatedTime: options.data.estimatedTime || 30,
            });
            break;

          case 'order_status':
            smsResult = await sendOrderStatusSMS(options.userPhone, {
              orderNumber: options.data.orderNumber,
              status: options.data.status || 'ready',
            });
            break;

          case 'promotion':
            smsResult = await sendSMS(options.userPhone, options.data.message || 'New promotion available!');
            break;

          case 'reward':
            smsResult = await sendSMS(
              options.userPhone,
              `🎉 You earned ${options.data.pointsEarned} points! Total: ${options.data.totalPoints} pts. Redeem rewards at wingside.com/my-account/dashboard`
            );
            break;

          default:
            smsResult = await sendSMS(options.userPhone, options.data.body || 'Notification from Wingside');
        }

        results.sms = {
          sent: smsResult.success,
          ...(smsResult.error ? { error: smsResult.error } : {}),
        };
      } catch (error: any) {
        results.sms = { sent: false, ...(error.message ? { error: error.message } : {}) };
      }
    }
  }

  return results;
}

/**
 * Send order confirmation notification
 */
export async function notifyOrderConfirmation(
  userId: string,
  userEmail: string,
  userName: string,
  userPhone?: string,
  orderData?: {
    orderNumber: string;
    totalAmount: string;
    paymentMethod: string;
    deliveryAddress?: string;
    estimatedTime: number;
    orderTrackingUrl: string;
  }
) {
  const channels: ('email' | 'push' | 'sms')[] = ['email', 'push'];
  if (userPhone) channels.push('sms');

  return sendNotification({
    channels,
    userId,
    userEmail,
    userName,
    userPhone,
    type: 'order_confirmation',
    data: {
      customer_name: userName,
      ...orderData,
    },
  });
}

/**
 * Send order status notification
 */
export async function notifyOrderStatus(
  userId: string,
  userEmail: string,
  userName: string,
  status: 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered',
  userPhone?: string,
  orderData?: {
    orderNumber: string;
    deliveryDriver?: string;
    estimatedArrival?: string;
    pickupAddress?: string;
    orderTrackingUrl: string;
    pointsEarned?: number;
    totalPoints?: number;
  }
) {
  const channels: ('email' | 'push' | 'sms')[] = ['email', 'push'];
  if (userPhone) channels.push('sms');

  return sendNotification({
    channels,
    userId,
    userEmail,
    userName,
    userPhone,
    type: 'order_status',
    data: {
      customer_name: userName,
      status,
      ...orderData,
    },
  });
}

/**
 * Send promotion notification
 */
export async function notifyPromotion(
  userIds: string[],
  promoData: {
    promoTitle: string;
    promoMessage: string;
    discountCode?: string;
    expiryDate?: string;
    ctaUrl: string;
    ctaText: string;
  }
) {
  // This is a broadcast, so we'll handle multiple users
  const results: Promise<{
    userId: string;
    email: { sent: boolean; error?: string };
    push: { sent: boolean; failed: number; error?: string };
    sms: { sent: boolean; error?: string };
  }>[] = [];

  // Look up all users in a single query for efficiency
  const userMap = await lookupUsers(userIds);

  for (const userId of userIds) {
    const user = userMap.get(userId);

    if (!user) {
      console.warn(`User ${userId} not found, skipping promotion notification`);
      continue;
    }

    // Determine channels based on available contact info
    const channels: ('email' | 'push' | 'sms')[] = ['push']; // Push always available
    if (user.email) channels.push('email');
    if (user.phone) channels.push('sms');

    results.push(
      sendNotification({
        channels,
        userId,
        userEmail: user.email || undefined,
        userName: user.full_name || undefined,
        userPhone: user.phone || undefined,
        type: 'promotion',
        data: promoData,
      }).then(result => ({
        userId,
        ...result,
      }))
    );
  }

  return Promise.all(results);
}

/**
 * Send reward notification
 */
export async function notifyReward(
  userId: string,
  userEmail: string,
  userName: string,
  rewardData: {
    rewardMessage: string;
    pointsEarned: number;
    totalPoints: number;
    rewardsUrl: string;
  }
) {
  return sendNotification({
    channels: ['email', 'push'],
    userId,
    userEmail,
    userName,
    type: 'reward',
    data: rewardData,
  });
}

/**
 * Check email preference for user and type
 */
async function checkEmailPreference(
  userId: string,
  type: string
): Promise<boolean> {
  const typeMap: Record<string, 'order_confirmations' | 'order_status' | 'promotions' | 'rewards'> = {
    order_confirmation: 'order_confirmations',
    order_status: 'order_status',
    promotion: 'promotions',
    reward: 'rewards',
  };

  const prefType = typeMap[type];
  if (!prefType) return true;

  return canSendEmailToUser(userId, prefType);
}

/**
 * Check push preference for user and type
 */
async function checkPushPreference(
  userId: string,
  type: string
): Promise<boolean> {
  const typeMap: Record<string, 'order_confirmations' | 'order_status' | 'promotions' | 'rewards'> = {
    order_confirmation: 'order_confirmations',
    order_status: 'order_status',
    promotion: 'promotions',
    reward: 'rewards',
  };

  const prefType = typeMap[type];
  if (!prefType) return true;

  return canSendPushToUser(userId, prefType);
}

/**
 * Check SMS preference for user and type
 */
async function checkSMSPreference(
  userId: string,
  type: string
): Promise<boolean> {
  const typeMap: Record<string, 'order_confirmations' | 'order_status' | 'promotions' | 'rewards'> = {
    order_confirmation: 'order_confirmations',
    order_status: 'order_status',
    promotion: 'promotions',
    reward: 'rewards',
  };

  const prefType = typeMap[type];
  if (!prefType) return true;

  return canSendSMSToUser(userId, prefType);
}

// Re-export functions for convenience
export * from './email';
export * from './push';
export * from './sms';
