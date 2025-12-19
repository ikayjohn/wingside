// Zoho CRM API Integration
// Docs: https://www.zoho.com/crm/developer/docs/api/v6/

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

// Get access token using refresh token
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho CRM credentials not configured');
  }

  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Zoho token refresh failed:', error);
    throw new Error('Failed to refresh Zoho access token');
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Token expires in 1 hour, refresh 5 minutes early
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken!;
}

// Make authenticated API request
async function zohoRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const token = await getAccessToken();

  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v6${endpoint}`, {
    method,
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Zoho API error (${endpoint}):`, error);
    throw new Error(`Zoho API request failed: ${response.status}`);
  }

  return response.json();
}

// ============ Contact Operations ============

export interface ZohoContact {
  id?: string;
  Email: string;
  First_Name: string;
  Last_Name: string;
  Phone?: string;
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_State?: string;
  Description?: string;
}

// Create or update contact
export async function upsertContact(contact: ZohoContact): Promise<{ id: string; action: 'created' | 'updated' }> {
  // First, search for existing contact by email
  const searchResult = await zohoRequest(
    `/Contacts/search?email=${encodeURIComponent(contact.Email)}`
  ).catch(() => null);

  if (searchResult?.data?.[0]) {
    // Update existing contact
    const existingId = searchResult.data[0].id;
    await zohoRequest(`/Contacts/${existingId}`, 'PUT', {
      data: [contact],
    });
    return { id: existingId, action: 'updated' };
  } else {
    // Create new contact
    const result = await zohoRequest('/Contacts', 'POST', {
      data: [contact],
    });
    return { id: result.data[0].details.id, action: 'created' };
  }
}

// Get contact by email
export async function getContactByEmail(email: string): Promise<ZohoContact | null> {
  try {
    const result = await zohoRequest(
      `/Contacts/search?email=${encodeURIComponent(email)}`
    );
    return result.data?.[0] || null;
  } catch {
    return null;
  }
}

// Get contact by ID
export async function getContactById(id: string): Promise<ZohoContact | null> {
  try {
    const result = await zohoRequest(`/Contacts/${id}`);
    return result.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============ Deal/Order Operations ============

export interface ZohoDeal {
  id?: string;
  Deal_Name: string;
  Stage: string;
  Amount: number;
  Contact_Name?: { id: string };
  Description?: string;
  Closing_Date?: string;
}

// Create deal (order)
export async function createDeal(deal: ZohoDeal): Promise<string> {
  const result = await zohoRequest('/Deals', 'POST', {
    data: [deal],
  });
  return result.data[0].details.id;
}

// ============ Note Operations ============

export async function addNoteToContact(contactId: string, title: string, content: string): Promise<void> {
  await zohoRequest('/Notes', 'POST', {
    data: [{
      Parent_Id: { id: contactId, module: 'Contacts' },
      Note_Title: title,
      Note_Content: content,
    }],
  });
}

// ============ Helper Functions ============

export function isZohoConfigured(): boolean {
  return !!(ZOHO_CLIENT_ID && ZOHO_CLIENT_SECRET && ZOHO_REFRESH_TOKEN);
}

// Sync customer to Zoho CRM
export async function syncCustomerToZoho(customer: {
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}): Promise<{ zoho_contact_id: string; action: 'created' | 'updated' } | null> {
  if (!isZohoConfigured()) {
    console.warn('Zoho CRM not configured, skipping sync');
    return null;
  }

  try {
    const nameParts = customer.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const result = await upsertContact({
      Email: customer.email,
      First_Name: firstName,
      Last_Name: lastName,
      Phone: customer.phone,
      Mailing_Street: customer.address,
      Mailing_City: customer.city,
      Mailing_State: customer.state,
    });

    console.log(`Zoho CRM: Contact ${result.action} - ${customer.email}`);
    return { zoho_contact_id: result.id, action: result.action };
  } catch (error) {
    console.error('Zoho CRM sync error:', error);
    return null;
  }
}

// Sync order to Zoho CRM as Deal
export async function syncOrderToZoho(order: {
  order_number: string;
  customer_email: string;
  total: number;
  status: string;
}): Promise<string | null> {
  if (!isZohoConfigured()) {
    console.warn('Zoho CRM not configured, skipping order sync');
    return null;
  }

  try {
    // Get contact ID
    const contact = await getContactByEmail(order.customer_email);

    const dealId = await createDeal({
      Deal_Name: `Order ${order.order_number}`,
      Stage: order.status === 'completed' ? 'Closed Won' : 'Qualification',
      Amount: order.total,
      Contact_Name: contact?.id ? { id: contact.id } : undefined,
      Description: `Online order from Wingside`,
      Closing_Date: new Date().toISOString().split('T')[0],
    });

    console.log(`Zoho CRM: Deal created - ${order.order_number}`);
    return dealId;
  } catch (error) {
    console.error('Zoho CRM order sync error:', error);
    return null;
  }
}
