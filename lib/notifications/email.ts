import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// Initialize Supabase for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EmailTemplate {
  template_key: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: Record<string, any>;
}

export interface SendEmailOptions {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template_key?: string;
  variables?: Record<string, any>;
  from?: string;
  reply_to?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    let html = options.html;
    let text = options.text;
    let subject = options.subject;

    // If template_key is provided, load and render the template
    if (options.template_key) {
      const template = await loadTemplate(options.template_key);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      html = renderTemplate(template.html_content, options.variables || {});
      text = template.text_content ? renderTemplate(template.text_content, options.variables || {}) : undefined;
      subject = subject || renderTemplate(template.subject, options.variables || {});
    }

    if (!html || !subject) {
      return { success: false, error: 'Missing required email content' };
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: options.from || 'Wingside <notifications@wingside.ng>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject,
      html,
      text,
      replyTo: options.reply_to || 'support@wingside.ng',
    });

    // Log the notification
    await logNotification({
      notification_type: 'email',
      template_key: options.template_key,
      status: 'sent',
      metadata: { to: options.to, subject, messageId: result.data?.id },
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error('Email send error:', error);

    // Log the failed notification
    await logNotification({
      notification_type: 'email',
      template_key: options.template_key,
      status: 'failed',
      error_message: error.message,
      metadata: { to: options.to },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
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
  return sendEmail({
    to: userEmail,
    template_key: 'order_confirmation',
    variables: {
      customer_name: userName,
      order_number: orderData.orderNumber,
      total_amount: orderData.totalAmount,
      payment_method: orderData.paymentMethod,
      delivery_address: orderData.deliveryAddress,
      estimated_time: orderData.estimatedTime,
      order_tracking_url: orderData.orderTrackingUrl,
    },
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  userEmail: string,
  userName: string,
  status: 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered',
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
  const templates = {
    ready: 'order_ready',
    picked_up: 'order_ready',
    out_for_delivery: 'order_ready',
    delivered: 'order_delivered',
  };

  const variables = {
    customer_name: userName,
    order_number: orderData.orderNumber,
    delivery_driver: orderData.deliveryDriver,
    estimated_arrival: orderData.estimatedArrival,
    pickup_address: orderData.pickupAddress,
    order_tracking_url: orderData.orderTrackingUrl,
    points_earned: orderData.pointsEarned,
    total_points: orderData.totalPoints,
    review_url: `${process.env.NEXT_PUBLIC_SITE_URL}/review/${orderData.orderNumber}`,
    reorder_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order`,
  };

  return sendEmail({
    to: userEmail,
    template_key: templates[status],
    variables,
  });
}

/**
 * Send promotion email
 */
export async function sendPromotionEmail(
  userEmail: string,
  promoData: {
    promoTitle: string;
    promoMessage: string;
    discountCode?: string;
    expiryDate?: string;
    ctaUrl: string;
    ctaText: string;
  }
) {
  return sendEmail({
    to: userEmail,
    template_key: 'promotion',
    variables: promoData,
  });
}

/**
 * Send reward earned email
 */
export async function sendRewardEmail(
  userEmail: string,
  userName: string,
  rewardData: {
    rewardMessage: string;
    pointsEarned: number;
    totalPoints: number;
    rewardsUrl: string;
  }
) {
  return sendEmail({
    to: userEmail,
    template_key: 'reward_earned',
    variables: {
      customer_name: userName,
      ...rewardData,
    },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string
) {
  return sendEmail({
    to: userEmail,
    template_key: 'password_reset',
    variables: {
      customer_name: userName,
      reset_url: resetUrl,
    },
  });
}

/**
 * Load email template from database
 */
async function loadTemplate(templateKey: string): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Template load error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Template load error:', error);
    return null;
  }
}

/**
 * Render template with variables
 * Simple template engine that replaces {{variable}} placeholders
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Log notification to database
 */
async function logNotification(data: {
  notification_type: string;
  template_key?: string;
  status: string;
  error_message?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from('notification_logs').insert({
      ...data,
      channel: data.template_key,
      metadata: data.metadata || {},
      sent_at: data.status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error('Notification log error:', error);
  }
}

/**
 * Check if user has email notifications enabled for specific type
 */
export async function canSendEmailToUser(
  userId: string,
  type: 'order_confirmations' | 'order_status' | 'promotions' | 'newsletter' | 'rewards' | 'reminders'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Default to enabled if no preferences set
      return true;
    }

    if (!data.email_enabled) {
      return false;
    }

    // Check specific email preference
    const preferenceKey = `email_${type}` as const;
    const { data: specificPref } = await supabase
      .from('notification_preferences')
      .select(preferenceKey)
      .eq('user_id', userId)
      .single();

    return (specificPref as any)?.[preferenceKey] ?? true;
  } catch (error) {
    console.error('Email preference check error:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Batch send emails to multiple users
 */
export async function sendBatchEmails(
  recipients: Array<{ email: string; variables?: Record<string, any> }>,
  templateKey: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient.email,
      template_key: templateKey,
      variables: recipient.variables,
    });

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${recipient.email}: ${result.error}`);
    }
  }

  return results;
}

/**
 * Send newsletter to subscribers
 */
export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: number; failed: number }> {
  try {
    // Get all users who have newsletter enabled
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, notification_preferences(*)')
      .not('email', 'is', null);

    const subscribers = profiles?.filter(
      (p: any) => p.notification_preferences?.email_newsletter !== false
    ) || [];

    let success = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      const result = await sendEmail({
        to: subscriber.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  } catch (error) {
    console.error('Newsletter send error:', error);
    return { success: 0, failed: 0 };
  }
}
