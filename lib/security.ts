/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize HTML string to prevent XSS attacks while preserving safe formatting
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous event handlers (onclick, onerror, onload, onmouseover, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol from href attributes
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/href\s*=\s*javascript:[^\s>]*/gi, '');

  // Remove javascript: and vbscript: protocols anywhere
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

  // Remove other potentially dangerous protocols
  sanitized = sanitized.replace(/(file:|ftp:|mailto:)/gi, '');

  // Remove iframe, object, embed, form, input tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\/(iframe|object|embed|form|button|textarea|select)>/gi, '');

  // Remove style tags with content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove meta tags
  sanitized = sanitized.replace(/<meta[^>]*>/gi, '');

  // Remove link tags
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');

  // Remove dangerous attributes from any remaining tags
  // Remove src attributes with javascript: or data: (except images)
  sanitized = sanitized.replace(/<(?!img)(\w+)[^>]*src\s*=\s*["']javascript:[^"']*["'][^>]*>/gi, '<$1>');
  sanitized = sanitized.replace(/<(?!img)(\w+)[^>]*src\s*=\s*["']data:[^"']*["'][^>]*>/gi, '<$1>');

  return sanitized;
}

/**
 * Sanitize HTML for blog content - preserves formatting tags
 * Allows safe tags: p, br, strong, b, em, i, u, a, ul, ol, li, h1-h6, blockquote, img, div, span
 */
export function sanitizeBlogHtml(html: string): string {
  if (!html) return '';

  // First use the general HTML sanitizer
  let sanitized = sanitizeHtml(html);

  // Additional blog-specific sanitization
  // Remove any remaining suspicious attributes
  const dangerousAttrs = [
    /\s*(?:on\w+|formaction|formaction|xlink:href|data[\w-]*)\s*=\s*["'][^"']*["']/gi,
    /\s*(?:on\w+|formaction|xlink:href|data[\w-]*)\s*=\s*[^\s>]*/gi
  ];

  dangerousAttrs.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove HTML comments that might contain scripts
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

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
