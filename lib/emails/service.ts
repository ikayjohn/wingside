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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F7C400; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; color: #552627; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #552627; }
          .value { margin-top: 5px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .badge { display: inline-block; background: #552627; color: #F7C400; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Type</div>
              <div class="value"><span class="badge">${typeLabel}</span></div>
            </div>
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${data.name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${data.email}</div>
            </div>
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${data.phone}</div>
            </div>
            ${data.company ? `
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${data.company}</div>
            </div>
            ` : ''}
            ${data.message ? `
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${data.message}</div>
            </div>
            ` : ''}
            ${data.formData && Object.keys(data.formData).length > 0 ? `
            <div class="field">
              <div class="label">Additional Information</div>
              <div class="value">
                <pre style="white-space: pre-wrap; font-size: 13px; background: #fff; padding: 10px; border-radius: 4px;">${JSON.stringify(data.formData, null, 2)}</pre>
              </div>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This email was sent from the Wingside website contact form.</p>
            <p>Received at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `${typeLabel} - Contact from ${data.name}`,
    html,
    replyTo: data.email,
  });
}

/**
 * Send order confirmation to customer
 */
export async function sendOrderConfirmation(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    product_name: string;
    product_size?: string;
    flavors?: string[];
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryAddress?: string;
  status: string;
}) {
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; color: #552627; font-size: 28px; }
          .header p { margin: 10px 0 0; color: #552627; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .order-number { background: #552627; color: #F7C400; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; color: #552627; margin-bottom: 10px; border-bottom: 2px solid #F7C400; padding-bottom: 5px; }
          .item { background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e0e0e0; }
          .item-name { font-weight: bold; color: #552627; }
          .item-details { font-size: 13px; color: #666; margin: 5px 0; }
          .item-price { text-align: right; font-weight: bold; color: #552627; }
          .totals { margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .total-row.final { font-size: 18px; font-weight: bold; color: #552627; border-bottom: none; border-top: 2px solid #F7C400; padding-top: 15px; margin-top: 10px; }
          .badge { display: inline-block; background: #F7C400; color: #552627; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #F7C400; color: #552627; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍗 Order Confirmed!</h1>
            <p>Thank you for your order, ${data.customerName}!</p>
          </div>
          <div class="content">
            <div class="order-number">
              Order #${data.orderNumber}
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge">Status: ${data.status.toUpperCase()}</span>
            </div>

            <div class="section-title">Order Items</div>
            ${data.items.map(item => `
              <div class="item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div class="item-name">${item.product_name}</div>
                    ${item.product_size ? `<div class="item-details">Size: ${item.product_size}</div>` : ''}
                    ${item.flavors && item.flavors.length > 0 ? `<div class="item-details">Flavors: ${item.flavors.join(', ')}</div>` : ''}
                    <div class="item-details">Qty: ${item.quantity} × ₦${item.unit_price.toLocaleString()}</div>
                  </div>
                  <div class="item-price">${formatCurrency(item.total_price)}</div>
                </div>
              </div>
            `).join('')}

            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${formatCurrency(data.subtotal)}</span>
              </div>
              <div class="total-row">
                <span>Delivery Fee</span>
                <span>${formatCurrency(data.deliveryFee)}</span>
              </div>
              <div class="total-row">
                <span>Tax</span>
                <span>${formatCurrency(data.tax)}</span>
              </div>
              <div class="total-row final">
                <span>Total</span>
                <span>${formatCurrency(data.total)}</span>
              </div>
            </div>

            ${data.deliveryAddress ? `
            <div class="section-title" style="margin-top: 20px;">Delivery Address</div>
            <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
              ${data.deliveryAddress}
            </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wingside.ng'}/order-tracking?orderNumber=${data.orderNumber}" class="button">
                Track Your Order
              </a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at reachus@wingside.ng</p>
            <p>Order placed at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmation #${data.orderNumber}`,
    html,
  });
}

/**
 * Send payment confirmation to customer
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; color: #552627; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .success-icon { text-align: center; font-size: 64px; margin: 20px 0; }
          .order-number { background: #552627; color: #F7C400; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
          .details { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #552627; }
          .amount { font-size: 24px; font-weight: bold; color: #F7C400; text-align: center; margin: 20px 0; }
          .badge { display: inline-block; background: #28a745; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Thank you, ${data.customerName}!</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">Payment Complete</span>
            </div>

            <div class="order-number">
              Order #${data.orderNumber}
            </div>

            <div class="amount">
              ${formatCurrency(data.amount)}
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="label">Payment Method</span>
                <span>${data.paymentMethod.toUpperCase()}</span>
              </div>
              ${data.transactionReference ? `
              <div class="detail-row">
                <span class="label">Transaction Reference</span>
                <span>${data.transactionReference}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Date</span>
                <span>${new Date().toLocaleString()}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">Your order is being prepared and will be delivered soon!</p>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact us at reachus@wingside.ng</p>
            <p>Payment confirmed at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `Payment Confirmation #${data.orderNumber}`,
    html,
  });
}

/**
 * Send order notification to admin
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #552627; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; color: #F7C400; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
          .order-number { background: #F7C400; color: #552627; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; color: #552627; margin-bottom: 10px; border-bottom: 2px solid #F7C400; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-box { background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; }
          .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .info-value { font-weight: bold; color: #552627; }
          .total-amount { font-size: 32px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍗 New Order Received!</h1>
          </div>
          <div class="content">
            <div class="order-number">
              Order #${data.orderNumber}
            </div>

            <div class="total-amount">
              ${formatCurrency(data.total)}
            </div>

            <div class="section-title">Customer Information</div>
            <div class="info-grid">
              <div class="info-box">
                <div class="info-label">Name</div>
                <div class="info-value">${data.customerName}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Email</div>
                <div class="info-value">${data.customerEmail}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Phone</div>
                <div class="info-value">${data.customerPhone}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${data.paymentMethod.toUpperCase()}</div>
              </div>
            </div>

            ${data.deliveryAddress ? `
            <div class="section-title">Delivery Address</div>
            <div class="info-box" style="margin-bottom: 20px;">
              ${data.deliveryAddress}
            </div>
            ` : ''}

            <div class="section-title">Order Items (${data.items.length})</div>
            <div class="info-box">
              ${data.items.map((item, index) => `
                <div style="padding: 10px 0; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e0e0e0;' : ''}">
                  <div style="font-weight: bold; color: #552627;">${item.product_name}</div>
                  <div style="font-size: 13px; color: #666; margin-top: 5px;">
                    Qty: ${item.quantity} × ₦${item.unit_price?.toLocaleString() || item.price?.toLocaleString() || 'N/A'}
                  </div>
                  ${item.flavors ? `<div style="font-size: 12px; color: #999;">Flavors: ${Array.isArray(item.flavors) ? item.flavors.join(', ') : item.flavors}</div>` : ''}
                </div>
              `).join('')}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wingside.ng'}/admin/orders" style="display: inline-block; background: #552627; color: #F7C400; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order in Admin
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Order received at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🍗 New Order #${data.orderNumber} - ${formatCurrency(data.total)}`,
    html,
  });
}

/**
 * Send referral invitation email
 */
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
