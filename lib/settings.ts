// Settings utility for accessing site-wide settings

export interface SiteSettings {
  // General
  site_name: string;
  site_tagline: string;
  site_description: string;

  // Contact
  contact_email: string;
  contact_phone: string;
  support_email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;

  // Social Media
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  social_whatsapp: string;

  // Business Hours
  hours_monday: string;
  hours_tuesday: string;
  hours_wednesday: string;
  hours_thursday: string;
  hours_friday: string;
  hours_saturday: string;
  hours_sunday: string;

  // Delivery
  delivery_radius: string;
  min_order_amount: string;
  free_delivery_threshold: string;
  estimated_delivery_time: string;

  // Payment
  currency: string;
  currency_symbol: string;
  tax_rate: string;
  accept_cash: string;
  accept_card: string;
  accept_wallet: string;
}

export const defaultSettings: SiteSettings = {
  // General
  site_name: 'Wingside®',
  site_tagline: 'Where Flavor Takes Flight',
  site_description: 'Where Flavor Takes Flight',

  // Contact
  contact_email: 'reachus@wingside.ng',
  contact_phone: '08090191999',
  support_email: 'reachus@wingside.ng',
  address_line1: '24 King Perekule Street, GRA',
  address_line2: '',
  city: 'Port Harcourt',
  state: 'Rivers State',
  country: 'Nigeria',

  // Social Media
  social_facebook: 'https://facebook.com/mywingside',
  social_instagram: 'https://instagram.com/mywingside',
  social_twitter: 'https://x.com/mywingside',
  social_linkedin: 'https://www.linkedin.com/company/wingside',
  social_youtube: 'https://www.youtube.com/@mywingside',
  social_whatsapp: '+2348090191999',

  // Business Hours
  hours_monday: '8:00 AM - 10:00 PM',
  hours_tuesday: '8:00 AM - 10:00 PM',
  hours_wednesday: '8:00 AM - 10:00 PM',
  hours_thursday: '8:00 AM - 10:00 PM',
  hours_friday: '8:00 AM - 10:00 PM',
  hours_saturday: '8:00 AM - 10:00 PM',
  hours_sunday: '8:00 AM - 10:00 PM',

  // Delivery
  delivery_radius: '10',
  min_order_amount: '2000',
  free_delivery_threshold: '10000',
  estimated_delivery_time: '30-45',

  // Payment
  currency: 'NGN',
  currency_symbol: '₦',
  tax_rate: '5',
  accept_cash: 'false',
  accept_card: 'true',
  accept_wallet: 'true',
};

// Fetch settings from API
export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const response = await fetch('/api/settings', {
      cache: 'no-store',
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn('[Settings] API returned status:', response.status, '- using defaults');
      return defaultSettings;
    }

    // Handle 304 Not Modified
    if (response.status === 304) {
      return defaultSettings;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn('[Settings] Unexpected content type:', contentType, '- using defaults');
      return defaultSettings;
    }

    const rawText = await response.text();

    // Handle empty response
    if (!rawText?.trim()) {
      console.warn('[Settings] Empty response - using defaults');
      return defaultSettings;
    }

    // Check for HTML error page
    if (rawText.trim().startsWith('<')) {
      console.warn('[Settings] Received HTML instead of JSON - using defaults');
      return defaultSettings;
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.warn('[Settings] JSON parse failed - using defaults');
      return defaultSettings;
    }

    return { ...defaultSettings, ...data.settings };
  } catch (error) {
    // Network errors, timeouts, etc.
    if (error.name === 'AbortError') {
      console.warn('[Settings] API timeout - using defaults');
    } else {
      console.warn('[Settings] Fetch error:', error.message, '- using defaults');
    }
    return defaultSettings;
  }
}

// Helper to get specific setting with fallback
export function getSetting(
  settings: Partial<SiteSettings>,
  key: keyof SiteSettings
): string {
  return settings[key] || defaultSettings[key];
}

// Helper to check boolean settings
export function getBooleanSetting(
  settings: Partial<SiteSettings>,
  key: keyof SiteSettings
): boolean {
  const value = getSetting(settings, key);
  return value === 'true' || value === '1';
}

// Helper to get number settings
export function getNumberSetting(
  settings: Partial<SiteSettings>,
  key: keyof SiteSettings
): number {
  const value = getSetting(settings, key);
  return parseFloat(value) || 0;
}
