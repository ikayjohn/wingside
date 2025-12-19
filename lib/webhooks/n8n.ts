// n8n webhook trigger utility
// Sends events from Wingside to n8n for processing

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export async function triggerN8nWebhook(event: string, data: any): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL not configured, skipping webhook');
    return false;
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-source': 'wingside',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`n8n webhook triggered: ${event}`);
    return true;
  } catch (error) {
    console.error('n8n webhook error:', error);
    return false;
  }
}

// Event types for documentation
export const N8N_EVENTS = {
  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_COMPLETED: 'order.completed',

  // Checkout events
  CHECKOUT_ACCOUNT_CREATED: 'checkout.account_created',
} as const;

// Helper functions for common events
export async function notifyCustomerCreated(customer: {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
}) {
  return triggerN8nWebhook(N8N_EVENTS.CUSTOMER_CREATED, customer);
}

export async function notifyOrderPaid(order: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  total: number;
  items: any[];
}) {
  return triggerN8nWebhook(N8N_EVENTS.ORDER_PAID, order);
}

export async function notifyOrderCompleted(order: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total: number;
}) {
  return triggerN8nWebhook(N8N_EVENTS.ORDER_COMPLETED, order);
}
