/**
 * Comprehensive Bot Protection System
 * Combines Honeypot + Time-Based Validation + Rate Limiting
 */

import { NextRequest } from 'next/server';
import { validateHoneypot, detectAutomatedSubmission } from './honeypot';

export interface BotProtectionConfig {
  /**
   * Honeypot field name (should be hidden in form)
   * @default 'website'
   */
  honeypotField?: string;

  /**
   * Minimum time (ms) before form can be submitted
   * @default 2000 (2 seconds)
   */
  minSubmissionTime?: number;

  /**
   * Maximum time (ms) before session expires
   * @default 3600000 (1 hour)
   */
  maxSubmissionTime?: number;

  /**
   * Whether to validate timestamp
   * @default true
   */
  validateTime?: boolean;

  /**
   * Whether to check for automated patterns
   * @default true
   */
  detectAutomation?: boolean;
}

export interface BotProtectionResult {
  isBot: boolean;
  reason?: string;
  details?: string;
}

/**
 * Validate form submission for bot behavior
 * Checks: Honeypot field, submission timing, automated patterns
 */
export function validateBotProtection(
  formData: Record<string, any>,
  config: BotProtectionConfig = {}
): BotProtectionResult {
  const {
    honeypotField = 'website',
    minSubmissionTime = 2000,
    maxSubmissionTime = 3600000,
    validateTime = true,
    detectAutomation = true,
  } = config;

  // 1. Check honeypot field
  const honeypotValue = formData[honeypotField];
  if (honeypotValue && String(honeypotValue).trim() !== '') {
    return {
      isBot: true,
      reason: 'honeypot_triggered',
      details: 'Hidden field was filled',
    };
  }

  // 2. Time-based validation
  if (validateTime) {
    const timestamp = formData._timestamp || formData.timestamp;

    if (!timestamp) {
      return {
        isBot: true,
        reason: 'missing_timestamp',
        details: 'No timestamp found in submission',
      };
    }

    const submittedTime = parseInt(timestamp);
    if (isNaN(submittedTime)) {
      return {
        isBot: true,
        reason: 'invalid_timestamp',
        details: 'Timestamp is not a valid number',
      };
    }

    const now = Date.now();
    const elapsed = now - submittedTime;

    // Too fast (< 2 seconds)
    if (elapsed < minSubmissionTime) {
      return {
        isBot: true,
        reason: 'submitted_too_fast',
        details: `Submitted in ${elapsed}ms (minimum: ${minSubmissionTime}ms)`,
      };
    }

    // Too slow (> 1 hour)
    if (elapsed > maxSubmissionTime) {
      return {
        isBot: true,
        reason: 'session_expired',
        details: `Submitted after ${elapsed}ms (maximum: ${maxSubmissionTime}ms)`,
      };
    }
  }

  // 3. Check for automated submission patterns
  if (detectAutomation) {
    const automationCheck = detectAutomatedSubmission(formData);
    if (automationCheck.isAutomated) {
      return {
        isBot: true,
        reason: 'automated_pattern_detected',
        details: automationCheck.reason,
      };
    }
  }

  return { isBot: false };
}

/**
 * Middleware-friendly bot protection for API routes
 */
export async function protectFromBots(
  request: NextRequest,
  body: any,
  config?: BotProtectionConfig
): Promise<{ valid: boolean; error?: string; status?: number }> {
  // Run bot protection checks
  const result = validateBotProtection(body, config);

  if (result.isBot) {
    // Log bot attempt (but don't expose details to client)
    console.warn('🤖 Bot detected:', {
      reason: result.reason,
      details: result.details,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return {
      valid: false,
      error: 'Invalid submission. Please try again.',
      status: 400,
    };
  }

  return { valid: true };
}

/**
 * Create honeypot and timestamp fields for React forms
 */
export function createBotProtectionFields(fieldName: string = 'website'): {
  honeypot: {
    name: string;
    defaultValue: string;
    style: React.CSSProperties;
    tabIndex: number;
    autoComplete: string;
    'aria-hidden': boolean;
  };
  timestamp: {
    name: string;
    value: string;
    type: string;
  };
} {
  return {
    honeypot: {
      name: fieldName,
      defaultValue: '',
      style: {
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none' as const,
      },
      tabIndex: -1,
      autoComplete: 'off',
      'aria-hidden': true,
    },
    timestamp: {
      name: '_timestamp',
      value: Date.now().toString(),
      type: 'hidden',
    },
  };
}

/**
 * Check if request appears to be from a bot based on headers
 */
export function detectBotFromHeaders(request: NextRequest): {
  isBot: boolean;
  reason?: string;
} {
  const userAgent = request.headers.get('user-agent') || '';

  // Common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /java/i,
    /headless/i,
    /phantomjs/i,
    /selenium/i,
    /playwright/i,
    /puppeteer/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return {
        isBot: true,
        reason: `Bot-like user agent: ${userAgent}`,
      };
    }
  }

  // Check for missing Accept header (but allow */* for API clients)
  const acceptHeader = request.headers.get('accept');
  if (!acceptHeader) {
    // Only reject if Accept header is completely missing
    return {
      isBot: true,
      reason: 'Missing Accept header',
    };
  }

  return { isBot: false };
}

/**
 * Enhanced bot protection that includes header checks
 */
export async function comprehensiveBotProtection(
  request: NextRequest,
  body: any,
  config?: BotProtectionConfig
): Promise<{ valid: boolean; error?: string; status?: number }> {
  // 1. Check headers for bot signatures
  const headerCheck = detectBotFromHeaders(request);
  if (headerCheck.isBot) {
    console.warn('🤖 Bot detected from headers:', headerCheck.reason);
    return {
      valid: false,
      error: 'Invalid request',
      status: 403,
    };
  }

  // 2. Run standard bot protection (honeypot + timing + patterns)
  return protectFromBots(request, body, config);
}
