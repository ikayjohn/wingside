import { sendEmail, canSendEmailToUser } from './email';
import {
  sendPushNotification,
  canSendPushToUser,
  sendOrderConfirmationPush,
  sendOrderStatusPush,
  sendPromotionPush,
  sendRewardPush,
} from './push';

export interface NotificationOptions {
  channels: ('email' | 'push' | 'sms')[];
  userId: string;
  userEmail?: string;
  userName?: string;
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
          error: emailResult.error,
        };
      } catch (error: any) {
        results.email = { sent: false, error: error.message };
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
            pushResult = await sendOrderConfirmationPush(options.userId, options.data);
            break;

          case 'order_status':
            pushResult = await sendOrderStatusPush(
              options.userId,
              options.data.status || 'ready',
              options.data
            );
            break;

          case 'promotion':
            pushResult = await sendPromotionPush(options.userId, options.data);
            break;

          case 'reward':
            pushResult = await sendRewardPush(options.userId, options.data);
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
          error: pushResult.error,
        };
      } catch (error: any) {
        results.push = { sent: false, failed: 0, error: error.message };
      }
    }
  }

  // SMS (placeholder for future implementation)
  if (options.channels.includes('sms')) {
    // TODO: Implement SMS notifications
    results.sms = { sent: false, error: 'SMS not implemented yet' };
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
  orderData: {
    orderNumber: string;
    totalAmount: string;
    paymentMethod: string;
    deliveryAddress?: string;
    estimatedTime: number;
    orderTrackingUrl: string;
  }
) {
  return sendNotification({
    channels: ['email', 'push'],
    userId,
    userEmail,
    userName,
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
  orderData: {
    orderNumber: string;
    deliveryDriver?: string;
    estimatedArrival?: string;
    pickupAddress?: string;
    orderTrackingUrl: string;
    pointsEarned?: number;
    totalPoints?: number;
  }
) {
  return sendNotification({
    channels: ['email', 'push'],
    userId,
    userEmail,
    userName,
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
  const results = [];

  for (const userId of userIds) {
    // Get user email
    // TODO: Implement user lookup
    results.push(
      sendNotification({
        channels: ['email', 'push'],
        userId,
        type: 'promotion',
        data: promoData,
      })
    );
  }

  return results;
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

// Re-export functions for convenience
export * from './email';
export * from './push';
