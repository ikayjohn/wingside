import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Wingside <noreply@wingside.ng>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'reachus@wingside.ng';

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Get Resend client (lazy-loaded)
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send email using Resend
 */
export async function sendEmail({ to, subject, html, replyTo }: EmailParams) {
  const resend = getResendClient();

  if (!resend) {
    console.error('Resend not configured. Please set RESEND_API_KEY environment variable.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch email template from database
 */
async function getEmailTemplate(templateKey: string) {
  const supabase = createAdminClient();

  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single();

  if (error || !template) {
    console.error(`Template ${templateKey} not found:`, error);
    return null;
  }

  return template;
}

/**
 * Replace variables in template
 * Supports {{variable}} and {{#conditional}}...{{/conditional}} syntax
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;

  // Replace conditional blocks {{#variable}}...{{/variable}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // Replace simple variables {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });

  return result;
}

/**
 * Send email using database template
 */
async function sendTemplatedEmail(
  templateKey: string,
  to: string | string[],
  variables: Record<string, any>,
  replyTo?: string
) {
  const template = await getEmailTemplate(templateKey);

  if (!template) {
    console.error(`Template ${templateKey} not found in database`);
    return { success: false, error: `Template ${templateKey} not found` };
  }

  const subject = replaceVariables(template.subject, variables);
  const html = replaceVariables(template.html_content, variables);

  return sendEmail({ to, subject, html, replyTo });
}

/**
 * Send contact form notification to admin
 * Uses database template: contact_notification
 */
export async function sendContactNotification(data: {
  type: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message?: string;
  formData?: any;
}) {
  const typeLabel = data.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return sendTemplatedEmail(
    'contact_notification',
    ADMIN_EMAIL,
    {
      formType: typeLabel,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || '',
      message: data.message || '',
    },
    data.email // replyTo
  );
}

/**
 * Send order confirmation to customer
 * Uses database template: order_confirmation
 */
export async function sendOrderConfirmation(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: string;
  status: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
  const trackingLink = `${baseUrl}/order-tracking?orderNumber=${data.orderNumber}`;

  return sendTemplatedEmail(
    'order_confirmation',
    data.customerEmail,
    {
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      status: data.status.toUpperCase(),
      trackingLink,
    }
  );
}

/**
 * Send payment confirmation to customer
 * Uses database template: payment_confirmation
 */
export async function sendPaymentConfirmation(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
}) {
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return sendTemplatedEmail(
    'payment_confirmation',
    data.customerEmail,
    {
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      amount: formatCurrency(data.amount),
      paymentMethod: data.paymentMethod.toUpperCase(),
      transactionReference: data.transactionReference || '',
    }
  );
}

/**
 * Send order notification to admin
 * Uses database template: order_notification_admin
 */
export async function sendOrderNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: any[];
  total: number;
  deliveryAddress?: string;
  paymentMethod: string;
}) {
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
  const adminLink = `${baseUrl}/admin/orders`;

  return sendTemplatedEmail(
    'order_notification_admin',
    ADMIN_EMAIL,
    {
      orderNumber: data.orderNumber,
      total: formatCurrency(data.total),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      adminLink,
    }
  );
}

/**
 * Send referral invitation email
 * Uses database template: referral_invitation
 */
export async function sendReferralInvitation(data: {
  recipientEmail: string;
  referrerName: string;
  referralCode: string;
  referralLink: string;
  customMessage?: string;
}) {
  return sendTemplatedEmail(
    'referral_invitation',
    data.recipientEmail,
    {
      referrerName: data.referrerName,
      referralCode: data.referralCode,
      referralLink: data.referralLink,
      customMessage: data.customMessage || '',
    }
  );
}
