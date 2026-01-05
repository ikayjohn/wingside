import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure Web Push
webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@wingside.ng',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  url?: string;
  requireInteraction?: boolean;
  ttl?: number;
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPush(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          user_id: userId,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: userAgent,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new subscription
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent,
        is_active: true,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
  userId: string,
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Push unsubscribe error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; failed: number; error?: string }> {
  try {
    // Get user's active push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, failed: 0 }; // No subscriptions, not an error
    }

    let failed = 0;

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        // Log success
        await logNotification({
          user_id: userId,
          notification_type: 'push',
          channel: payload.title,
          status: 'sent',
          metadata: { endpoint: sub.endpoint, payload },
        });
      } catch (error: any) {
        failed++;
        console.error('Push send error:', error);

        // Deactivate invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }

        // Log failure
        await logNotification({
          user_id: userId,
          notification_type: 'push',
          channel: payload.title,
          status: 'failed',
          error_message: error.message,
          metadata: { endpoint: sub.endpoint },
        });
      }
    }

    return { success: true, failed };
  } catch (error: any) {
    console.error('Push notification error:', error);
    return { success: false, failed: 0, error: error.message };
  }
}

/**
 * Send order confirmation push notification
 */
export async function sendOrderConfirmationPush(
  userId: string,
  orderData: {
    orderNumber: string;
    totalAmount: string;
    estimatedTime: number;
  }
) {
  return sendPushNotification(userId, {
    title: 'Order Confirmed! 🎉',
    body: `Your order #${orderData.orderNumber} has been confirmed. Estimated time: ${orderData.estimatedTime} minutes.`,
    icon: '/logo.png',
    badge: '/badge-icon.png',
    url: `/my-account/orders?order=${orderData.orderNumber}`,
    requireInteraction: true,
    data: { orderNumber: orderData.orderNumber },
  });
}

/**
 * Send order status update push notification
 */
export async function sendOrderStatusPush(
  userId: string,
  status: string,
  orderData: {
    orderNumber: string;
    estimatedArrival?: string;
    driverName?: string;
  }
) {
  const messages: Record<string, string> = {
    preparing: `Your order #${orderData.orderNumber} is being prepared!`,
    ready: `Your order #${orderData.orderNumber} is ready!`,
    out_for_delivery: `Your order is on the way!${orderData.driverName ? ` Driver: ${orderData.driverName}` : ''}`,
    delivered: `Your order #${orderData.orderNumber} has been delivered! Enjoy! 🍗`,
  };

  return sendPushNotification(userId, {
    title: status === 'delivered' ? 'Delivered! 🎉' : 'Order Update',
    body: messages[status] || `Your order status has been updated to: ${status}`,
    icon: '/logo.png',
    badge: '/badge-icon.png',
    url: `/my-account/orders?order=${orderData.orderNumber}`,
    requireInteraction: status === 'out_for_delivery' || status === 'delivered',
    data: { orderNumber: orderData.orderNumber, status },
  });
}

/**
 * Send promotion push notification
 */
export async function sendPromotionPush(
  userId: string,
  promoData: {
    title: string;
    message: string;
    discountCode?: string;
    url: string;
  }
) {
  return sendPushNotification(userId, {
    title: promoData.title,
    body: promoData.discountCode
      ? `${promoData.message} Use code: ${promoData.discountCode}`
      : promoData.message,
    icon: '/logo.png',
    badge: '/badge-icon.png',
    url: promoData.url,
    requireInteraction: false,
    actions: promoData.discountCode
      ? [
          {
            action: 'copy',
            title: 'Copy Code',
          },
        ]
      : undefined,
  });
}

/**
 * Send reward push notification
 */
export async function sendRewardPush(
  userId: string,
  rewardData: {
    pointsEarned: number;
    totalPoints: number;
    rewardMessage?: string;
  }
) {
  return sendPushNotification(userId, {
    title: 'Rewards Earned! 🎁',
    body: rewardData.rewardMessage || `You earned ${rewardData.pointsEarned} points! Total: ${rewardData.totalPoints}`,
    icon: '/logo.png',
    badge: '/badge-icon.png',
    url: '/my-account/dashboard',
    requireInteraction: false,
    data: {
      pointsEarned: rewardData.pointsEarned,
      totalPoints: rewardData.totalPoints,
    },
  });
}

/**
 * Send broadcast push notification to all users
 */
export async function sendBroadcastPush(
  payload: PushNotificationPayload,
  options?: {
    excludeUsers?: string[];
    includeUsers?: string[];
  }
): Promise<{ success: number; failed: number }> {
  try {
    let query = supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh_key, auth_key')
      .eq('is_active', true);

    // Filter by users if specified
    if (options?.includeUsers && options.includeUsers.length > 0) {
      query = query.in('user_id', options.includeUsers);
    } else if (options?.excludeUsers && options.excludeUsers.length > 0) {
      query = query.not('user_id', 'in', `(${options.excludeUsers.join(',')})`);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    // Group by user to avoid duplicates
    const userSubscriptions = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.user_id]) {
        acc[sub.user_id] = [];
      }
      acc[sub.user_id].push(sub);
      return acc;
    }, {} as Record<string, any[]>);

    // Send to each user
    for (const [userId, subs] of Object.entries(userSubscriptions)) {
      const result = await sendPushNotification(userId, payload);
      if (result.success) {
        success += subs.length - result.failed;
        failed += result.failed;
      } else {
        failed += subs.length;
      }
    }

    return { success, failed };
  } catch (error) {
    console.error('Broadcast push error:', error);
    return { success: 0, failed: 0 };
  }
}

/**
 * Check if user has push notifications enabled for specific type
 */
export async function canSendPushToUser(
  userId: string,
  type: 'order_confirmations' | 'order_status' | 'promotions' | 'rewards'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('push_enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    if (!data.push_enabled) {
      return false;
    }

    // Check specific push preference
    const preferenceKey = `push_${type}` as const;
    const { data: specificPref } = await supabase
      .from('notification_preferences')
      .select(preferenceKey)
      .eq('user_id', userId)
      .single();

    return (specificPref as any)?.[preferenceKey] ?? true;
  } catch (error) {
    console.error('Push preference check error:', error);
    return false;
  }
}

/**
 * Log notification to database
 */
async function logNotification(data: {
  user_id?: string;
  notification_type: string;
  channel: string;
  status: string;
  error_message?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from('notification_logs').insert({
      ...data,
      sent_at: data.status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error('Notification log error:', error);
  }
}

/**
 * Get VAPID public key for client-side registration
 */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

/**
 * Generate VAPID keys (run once during setup)
 */
export async function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
