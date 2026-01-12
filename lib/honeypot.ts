/**
 * Honeypot utilities for detecting and blocking bots
 * Honeypots are hidden fields that humans don't see but bots fill out
 */

export interface HoneypotConfig {
  /**
   * Name of the honeypot field
   * Should sound legitimate to bots but be hidden from humans
   * @default 'website'
   */
  fieldName?: string;

  /**
   * Whether to use timestamp validation
   * Checks if form was submitted too quickly (less than minTime)
   */
  validateTimestamp?: boolean;

  /**
   * Minimum time (ms) required before form submission
   * Prevents automated bots from submitting instantly
   * @default 2000 (2 seconds)
   */
  minTime?: number;

  /**
   * Maximum time (ms) allowed before form submission
   * Prevents session timeouts
   * @default 3600000 (1 hour)
   */
  maxTime?: number;
}

export interface HoneypotResult {
  success: boolean;
  reason?: string;
}

/**
 * Generate a random honeypot field name
 */
export function generateHoneypotFieldName(): string {
  const fieldNames = [
    'website',
    'url',
    'company_website',
    'fax',
    'phone2',
    'secondary_email',
    'address_line_3',
    'comments_check',
    'verify_email',
    'user_confirm',
  ];

  return fieldNames[Math.floor(Math.random() * fieldNames.length)];
}

/**
 * Validate honeypot field
 *
 * @param formData - Form data to check
 * @param config - Honeypot configuration
 * @returns Validation result
 */
export function validateHoneypot(
  formData: Record<string, any>,
  config: HoneypotConfig = {}
): HoneypotResult {
  const {
    fieldName = 'website',
    validateTimestamp = true,
    minTime = 2000,
    maxTime = 3600000,
  } = config;

  // Check honeypot field
  const honeypotValue = formData[fieldName];

  // If honeypot field has any value, it's likely a bot
  if (honeypotValue && honeypotValue.trim() !== '') {
    return {
      success: false,
      reason: 'honeypot_field_filled',
    };
  }

  // Validate timestamp if enabled
  if (validateTimestamp) {
    const timestamp = formData._timestamp || formData.timestamp;

    if (timestamp) {
      const now = Date.now();
      const elapsed = now - parseInt(timestamp);

      // Submitted too quickly (bot behavior)
      if (elapsed < minTime) {
        return {
          success: false,
          reason: 'submitted_too_quickly',
        };
      }

      // Submitted too slowly (possible session timeout)
      if (elapsed > maxTime) {
        return {
          success: false,
          reason: 'session_expired',
        };
      }
    } else {
      // Missing timestamp
      return {
        success: false,
        reason: 'missing_timestamp',
      };
    }
  }

  return { success: true };
}

/**
 * Create honeypot field props for React components
 */
export function createHoneypotField(config: HoneypotConfig = {}): {
  name: string;
  defaultValue: string;
  style: React.CSSProperties;
  tabIndex: number;
  autoComplete: string;
  'aria-hidden': boolean;
  timestamp: number;
} {
  const fieldName = config.fieldName || generateHoneypotFieldName();

  return {
    name: fieldName,
    defaultValue: '',
    style: {
      position: 'absolute',
      left: '-5000px',
      width: '0',
      height: '0',
      opacity: '0',
      pointerEvents: 'none',
    },
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true,
    timestamp: Date.now(),
  };
}

/**
 * Hidden field names that should never be present in legitimate form submissions
 */
export const SUSPICIOUS_FIELD_NAMES = [
  'seo_field',
  'seo-check',
  'b_check',
  'b-check',
  'ak_hp_text',
  'adroll_checkbox',
  'g-recaptcha-response',
  'h-captcha-response',
  'cf-turnstile-response',
];

/**
 * Check if form contains suspicious automated submission patterns
 */
export function detectAutomatedSubmission(
  formData: Record<string, any>
): { isAutomated: boolean; reason?: string } {
  // Check for common bot field names
  for (const suspicious of SUSPICIOUS_FIELD_NAMES) {
    if (formData[suspicious]) {
      return {
        isAutomated: true,
        reason: `Suspicious field detected: ${suspicious}`,
      };
    }
  }

  // Check for user agent patterns (if present in form data)
  const userAgent = formData.user_agent || formData.userAgent;
  if (userAgent) {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
    ];

    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        return {
          isAutomated: true,
          reason: 'Bot-like user agent detected',
        };
      }
    }
  }

  // Check for rapid fire submissions (multiple fields filled identically)
  const values = Object.values(formData).filter(v => typeof v === 'string' && v.length > 0);
  const uniqueValues = new Set(values);

  if (values.length > 5 && uniqueValues.size / values.length < 0.3) {
    return {
      isAutomated: true,
      reason: 'Suspicious form data pattern detected',
    };
  }

  return { isAutomated: false };
}

/**
 * Server-side honeypot validation for API routes
 */
export function validateRequestHoneypot(
  body: any,
  config?: HoneypotConfig
): { valid: boolean; error?: string } {
  // Validate honeypot field
  const honeypotResult = validateHoneypot(body, config);
  if (!honeypotResult.success) {
    return {
      valid: false,
      error: `Honeypot validation failed: ${honeypotResult.reason}`,
    };
  }

  // Check for automated submission patterns
  const automatedCheck = detectAutomatedSubmission(body);
  if (automatedCheck.isAutomated) {
    return {
      valid: false,
      error: automatedCheck.reason,
    };
  }

  return { valid: true };
}
