import { createClient } from '@supabase/supabase-js';
import {
  notifyOrderConfirmation,
  notifyOrderStatus,
  notifyPromotion,
  notifyReward,
} from './index';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Trigger notification when order is created
 */
export async function onOrderCreated(orderId: string) {
  try {
    // Get order details with user info
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        profiles:user_id (email, full_name)
        `
      )
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order for notification:', error);
      return;
    }

    const user = order.profiles;
    if (!user) {
      console.error('No user associated with order');
      return;
    }

    // Send order confirmation notification
    await notifyOrderConfirmation(
      order.user_id,
      user.email,
      user.full_name || 'Customer',
      {
        orderNumber: order.order_number,
        totalAmount: `₦${order.total_amount.toLocaleString()}`,
        paymentMethod: order.payment_method || 'Card',
        deliveryAddress: order.delivery_address,
        estimatedTime: 30, // You can calculate this based on items
        orderTrackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/my-account/orders?order=${order.order_number}`,
      }
    );

    console.log(`Order confirmation notification sent for order ${order.order_number}`);
  } catch (error) {
    console.error('Error sending order confirmation notification:', error);
  }
}

/**
 * Trigger notification when order status changes
 */
export async function onOrderStatusChanged(
  orderId: string,
  newStatus: 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered'
) {
  try {
    // Get order details with user info
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        profiles:user_id (email, full_name)
        `
      )
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order for notification:', error);
      return;
    }

    const user = order.profiles;
    if (!user) {
      console.error('No user associated with order');
      return;
    }

    // Prepare notification data
    const notificationData: any = {
      orderNumber: order.order_number,
      orderTrackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/my-account/orders?order=${order.order_number}`,
    };

    // Add status-specific data
    if (newStatus === 'out_for_delivery') {
      notificationData.deliveryDriver = order.delivery_driver_name;
      notificationData.estimatedArrival = order.estimated_arrival;
    } else if (newStatus === 'ready' && !order.delivery_address) {
      notificationData.pickupAddress = '123 Wingside Street, Lagos, Nigeria'; // Your pickup address
    } else if (newStatus === 'delivered') {
      // Get user's reward points
      const { data: profile } = await supabase
        .from('profiles')
        .select('reward_points')
        .eq('id', order.user_id)
        .single();

      const pointsEarned = Math.floor(order.total_amount * 0.01); // 1% rewards
      notificationData.pointsEarned = pointsEarned;
      notificationData.totalPoints = (profile?.reward_points || 0) + pointsEarn;
    }

    // Send order status notification
    await notifyOrderStatus(
      order.user_id,
      user.email,
      user.full_name || 'Customer',
      newStatus,
      notificationData
    );

    // If order is delivered, also send reward notification
    if (newStatus === 'delivered') {
      await notifyReward(
        order.user_id,
        user.email,
        user.full_name || 'Customer',
        {
          rewardMessage: `You earned ${notificationData.pointsEarned} points from your recent order!`,
          pointsEarned: notificationData.pointsEarned,
          totalPoints: notificationData.totalPoints,
          rewardsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/my-account/dashboard`,
        }
      );
    }

    console.log(
      `Order status notification sent for order ${order.order_number} - status: ${newStatus}`
    );
  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
}

/**
 * Send promotion to multiple users
 */
export async function sendPromotionToUsers(
  promoData: {
    promoTitle: string;
    promoMessage: string;
    discountCode?: string;
    expiryDate?: string;
    ctaUrl: string;
    ctaText: string;
  },
  options?: {
    sendToAll?: boolean;
    userSegment?: 'all' | 'active' | 'vip' | 'new';
    excludeUsers?: string[];
    includeUsers?: string[];
  }
) {
  try {
    let userIds: string[] = [];

    if (options?.includeUsers && options.includeUsers.length > 0) {
      userIds = options.includeUsers;
    } else {
      // Get users based on segment
      let query = supabase.from('profiles').select('id');

      if (options?.userSegment === 'active') {
        // Users who have ordered in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: activeUsers } = await supabase
          .from('orders')
          .select('user_id')
          .gte('created_at', thirtyDaysAgo.toISOString());

        userIds = [...new Set(activeUsers?.map((o) => o.user_id) || [])];
      } else if (options?.userSegment === 'vip') {
        // Users with high reward points
        const { data: vipUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('reward_points', 500); // VIP threshold

        userIds = vipUsers?.map((u) => u.id) || [];
      } else if (options?.userSegment === 'new') {
        // Users who joined in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: newUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', sevenDaysAgo.toISOString());

        userIds = newUsers?.map((u) => u.id) || [];
      } else if (options?.sendToAll || options?.userSegment === 'all') {
        // All users with notification preferences enabled for promotions
        const { data: allUsers } = await supabase
          .from('notification_preferences')
          .select('user_id')
          .or('email_promotions.eq.true,push_promotions.eq.true');

        userIds = allUsers?.map((u) => u.user_id) || [];
      }
    }

    // Exclude specific users if provided
    if (options?.excludeUsers && options.excludeUsers.length > 0) {
      userIds = userIds.filter((id) => !options.excludeUsers!.includes(id));
    }

    // Send promotion to all selected users
    const results = await notifyPromotion(userIds, promoData);

    console.log(`Promotion sent to ${userIds.length} users`);
    return { success: true, sentTo: userIds.length };
  } catch (error) {
    console.error('Error sending promotion to users:', error);
    return { success: false, error };
  }
}

/**
 * Check and send reward milestone notifications
 */
export async function checkRewardMilestones(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('reward_points, full_name, email')
      .eq('id', userId)
      .single();

    if (!profile) {
      return;
    }

    const points = profile.reward_points || 0;

    // Define reward milestones
    const milestones = [
      { points: 100, message: "You've reached 100 points! Keep ordering to unlock more rewards!" },
      { points: 500, message: "You've reached 500 points! You're now a Wing Leader!" },
      { points: 1000, message: "You've reached 1000 points! You're now a Wing Master!" },
      { points: 5000, message: "You've reached 5000 points! You're now a Wing Legend!" },
    ];

    for (const milestone of milestones) {
      if (points === milestone.points) {
        await notifyReward(userId, profile.email, profile.full_name || 'Customer', {
          rewardMessage: milestone.message,
          pointsEarned: 0,
          totalPoints: points,
          rewardsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/my-account/dashboard`,
        });
        break; // Only send one notification per milestone
      }
    }
  } catch (error) {
    console.error('Error checking reward milestones:', error);
  }
}

/**
 * Helper function to be used in order creation/update API routes
 */
export function setupOrderNotifications() {
  // This function should be called when setting up order webhooks or database triggers
  // It will set up listeners for order events

  console.log('Order notifications system initialized');

  return {
    onOrderCreated,
    onOrderStatusChanged,
    sendPromotionToUsers,
    checkRewardMilestones,
  };
}
