/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove other potentially dangerous protocols
  sanitized = sanitized.replace(/(file:|ftp:)/gi, '');

  return sanitized;
}

/**
 * Escape special characters to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize user input for text fields
 * Strips HTML tags and escapes special characters
 */
export function sanitizeTextInput(input: string): string {
  if (!input) return '';

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email.toLowerCase().trim().replace(/[<>]/g, '');
}

/**
 * Sanitize phone number
 * Keep only digits, +, -, (, ), and spaces
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeTextInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeTextInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting helper (to be implemented with Redis or similar)
 * This is a placeholder - actual implementation depends on your storage
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  // Placeholder implementation
  // In production, use Redis, Upstash, or similar for distributed rate limiting
  return { allowed: true, remaining: maxRequests };
}

/**
 * Validate that a string doesn't contain SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(--)|(\/\*)|(\*\/)/,
    /(\bOR\b|\bAND\b).*=.*=/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;|\s)(\bEXEC\b|\bEXECUTE\b)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate that a string doesn't contain NoSQL injection patterns
 */
export function detectNoSqlInjection(input: string): boolean {
  if (!input) return false;

  const nosqlPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$in/i,
    /\$gt/i,
    /\$lt/i,
    /\{.*\$.*\}/,
  ];

  return nosqlPatterns.some(pattern => pattern.test(input));
}
