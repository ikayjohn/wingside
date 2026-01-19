/**
 * SMS Notification Service
 * Supports multiple SMS providers: Twilio, Africas Talking, Termii
 */

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  sendSMS(to: string, message: string): Promise<SMSResult>;
}

/**
 * Twilio SMS Provider
 * Environment variables needed:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */
class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('Twilio not configured: Missing credentials');
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return {
        success: false,
        error: 'Twilio not configured',
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: to,
          Body: message,
        }),
      });

      const data = await response.json();

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
        };
      } else {
        console.error('Twilio API error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }
    } catch (error: any) {
      console.error('Twilio send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }
}

/**
 * Africas Talking SMS Provider
 * Environment variables needed:
 * - AFRICASTALKING_USERNAME
 * - AFRICASTALKING_API_KEY
 */
class AfricasTalkingProvider implements SMSProvider {
  private username: string;
  private apiKey: string;

  constructor() {
    this.username = process.env.AFRICASTALKING_USERNAME || '';
    this.apiKey = process.env.AFRICASTALKING_API_KEY || '';

    if (!this.username || !this.apiKey) {
      console.warn('Africas Talking not configured: Missing credentials');
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    if (!this.username || !this.apiKey) {
      return {
        success: false,
        error: 'Africas Talking not configured',
      };
    }

    try {
      const url = 'https://api.africastalking.com/version1/messaging';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: this.username,
          to: to,
          message: message,
          from: 'Wingside', // Sender ID
        }),
      });

      const data = await response.json();

      if (response.ok && (data.SMSMessageData?.Recipients?.length > 0)) {
        const recipient = data.SMSMessageData.Recipients[0];
        return {
          success: recipient.status === 'Success',
          messageId: recipient.messageId,
          error: recipient.status !== 'Success' ? recipient.statusText : undefined,
        };
      } else {
        console.error('Africas Talking API error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }
    } catch (error: any) {
      console.error('Africas Talking send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }
}

/**
 * Termii SMS Provider (Nigeria-focused)
 * Environment variables needed:
 * - TERMII_API_KEY
 * - TERMII_SENDER_ID
 */
class TermiiProvider implements SMSProvider {
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || '';
    this.senderId = process.env.TERMII_SENDER_ID || 'Wingside';

    if (!this.apiKey) {
      console.warn('Termii not configured: Missing API key');
    }
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Termii not configured',
      };
    }

    try {
      const url = 'https://v3.api.termii.com/api/sms/send';

      // Termii expects phone numbers in international format WITHOUT the + prefix
      // e.g., 23490126727, not +23490126727
      const cleanedTo = to.replace(/^\+/, '');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          to: cleanedTo,
          from: this.senderId,
          sms: message,
          type: 'plain',
          channel: 'dnd', // DND (Do Not Disturb) compliant
        }),
      });

      const data = await response.json();

      // Termii returns { code: "ok", message_id: "...", message: "Successfully Sent" }
      if (response.ok && (data.code === 'ok' || data.message_id)) {
        return {
          success: true,
          messageId: data.message_id || data.message_id_str,
        };
      } else {
        console.error('Termii API error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }
    } catch (error: any) {
      console.error('Termii send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }
}

/**
 * Get SMS provider based on environment configuration
 * Priority: Termii > Africas Talking > Twilio
 */
function getSMSProvider(): SMSProvider | null {
  const provider = process.env.SMS_PROVIDER?.toLowerCase();

  switch (provider) {
    case 'twilio':
      return new TwilioProvider();
    case 'africastalking':
      return new AfricasTalkingProvider();
    case 'termii':
      return new TermiiProvider();
    default:
      // Auto-detect based on available credentials
      if (process.env.TERMII_API_KEY) {
        console.log('SMS: Using Termii provider');
        return new TermiiProvider();
      }
      if (process.env.AFRICASTALKING_API_KEY) {
        console.log('SMS: Using Africas Talking provider');
        return new AfricasTalkingProvider();
      }
      if (process.env.TWILIO_ACCOUNT_SID) {
        console.log('SMS: Using Twilio provider');
        return new TwilioProvider();
      }
      console.warn('SMS: No provider configured');
      return null;
  }
}

/**
 * Check if SMS is enabled and configured
 */
export function isSMSEnabled(): boolean {
  return getSMSProvider() !== null;
}

/**
 * Send SMS notification
 * @param to - Phone number (format: +234XXXXXXXXXX for Nigeria)
 * @param message - SMS message content
 * @returns SMS result with success status and message ID
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const provider = getSMSProvider();

  if (!provider) {
    return {
      success: false,
      error: 'No SMS provider configured. Set SMS_PROVIDER and corresponding credentials.',
    };
  }

  // Validate phone number format
  if (!to || to.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number',
    };
  }

  // Validate message length (SMS limit is typically 160 chars for GSM-7, but we'll be more lenient)
  if (!message || message.length === 0) {
    return {
      success: false,
      error: 'Message cannot be empty',
    };
  }

  if (message.length > 918) { // 6 concatenated SMS messages
    console.warn('SMS message too long, truncating');
    message = message.substring(0, 915) + '...';
  }

  return provider.sendSMS(to, message);
}

/**
 * Format phone number to international format
 * Converts Nigerian numbers like 08031234567 to +2348031234567
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If starting with 0, replace with +234 (Nigeria country code)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+234' + cleaned.substring(1);
  }

  // If already has country code but no +
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return '+' + cleaned;
  }

  // If already has +
  if (phone.startsWith('+')) {
    return phone;
  }

  // Default: assume Nigerian number
  if (cleaned.length === 11) {
    return '+234' + cleaned;
  }

  return phone;
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSMS(
  phoneNumber: string,
  orderData: {
    orderNumber: string;
    totalAmount: string;
    estimatedTime: number;
  }
): Promise<SMSResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const message = `Wingside: Order #${orderData.orderNumber} confirmed! Total: ₦${orderData.totalAmount}. Ready in ~${orderData.estimatedTime} mins. Track your order at wingside.com/my-account/dashboard`;

  return sendSMS(formattedPhone, message);
}

/**
 * Send order status update SMS
 */
export async function sendOrderStatusSMS(
  phoneNumber: string,
  orderData: {
    orderNumber: string;
    status: string;
  }
): Promise<SMSResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const statusMessages: Record<string, string> = {
    preparing: `Wingside: Order #${orderData.orderNumber} is being prepared. We'll notify you when it's ready!`,
    ready: `Wingside: Order #${orderData.orderNumber} is READY for pickup! Track at wingside.com/my-account/dashboard`,
    picked_up: `Wingside: Order #${orderData.orderNumber} has been picked up. Enjoy your wings! 🍗`,
    out_for_delivery: `Wingside: Order #${orderData.orderNumber} is out for delivery! Track at wingside.com/my-account/dashboard`,
    delivered: `Wingside: Order #${orderData.orderNumber} has been delivered. Enjoy your wings! 🍗`,
  };

  const message = statusMessages[orderData.status] ||
    `Wingside: Order #${orderData.orderNumber} status updated to: ${orderData.status}. Track at wingside.com/my-account/dashboard`;

  return sendSMS(formattedPhone, message);
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSMS(
  phoneNumber: string,
  orderData: {
    orderNumber: string;
    amount: string;
  }
): Promise<SMSResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const message = `Wingside: Payment of ₦${orderData.amount} received for Order #${orderData.orderNumber}. We'll start preparing your order shortly! 🍗`;

  return sendSMS(formattedPhone, message);
}

/**
 * Check if user can receive SMS based on preferences
 */
export async function canSendSMSToUser(
  userId: string,
  notificationType: 'order_confirmations' | 'order_status' | 'promotions' | 'rewards'
): Promise<boolean> {
  try {
    // Import here to avoid circular dependency
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('sms')
      .eq('user_id', userId)
      .maybeSingle();

    // If no preferences exist, default to enabled
    if (!preferences) {
      return true;
    }

    // Check if SMS is enabled for this type
    return preferences.sms?.[notificationType] !== false;
  } catch (error) {
    console.error('Error checking SMS preferences:', error);
    return true; // Default to enabled on error
  }
}
