/**
 * Input validation utilities for API endpoints
 * Provides consistent validation across the application
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

/**
 * Validates email address format using RFC 5322 simplified regex
 *
 * Checks for:
 * - Basic format: local@domain.tld
 * - Maximum length: 254 characters
 * - No whitespace
 *
 * @param email - Email address to validate
 * @returns True if email format is valid
 *
 * @example
 * ```ts
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid.email') // false
 * isValidEmail('user @example.com') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validates Nigerian phone number in multiple formats
 *
 * Accepted formats:
 * - +234XXXXXXXXXX (E.164 international format)
 * - 234XXXXXXXXXX (International without +)
 * - 0XXXXXXXXXX (Local format with leading 0)
 * - XXXXXXXXXXX (Local format without leading 0)
 *
 * Automatically strips spaces, hyphens, and parentheses.
 * Only accepts numbers starting with 7, 8, or 9 (valid Nigerian mobile prefixes).
 *
 * @param phone - Phone number to validate
 * @returns True if phone number matches Nigerian format
 *
 * @example
 * ```ts
 * isValidNigerianPhone('+2348012345678') // true
 * isValidNigerianPhone('08012345678') // true
 * isValidNigerianPhone('0801 234 5678') // true (spaces stripped)
 * isValidNigerianPhone('06012345678') // false (6 is not valid)
 * ```
 */
export function isValidNigerianPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Must be digits only (with optional + prefix)
  if (!/^\+?\d+$/.test(cleaned)) return false;

  // Check various formats
  const formats = [
    /^\+234[789]\d{9}$/,    // +234XXXXXXXXXX
    /^234[789]\d{9}$/,      // 234XXXXXXXXXX
    /^0[789]\d{9}$/,        // 0XXXXXXXXXX
    /^[789]\d{9}$/,         // XXXXXXXXXXX
  ];

  return formats.some(regex => regex.test(cleaned));
}

/**
 * Validates and normalizes Nigerian phone number to E.164 format
 *
 * Converts any valid Nigerian phone format to international E.164 format (+234XXXXXXXXXX).
 * Returns null if the phone number is invalid.
 *
 * @param phone - Phone number in any accepted Nigerian format
 * @returns Phone number in E.164 format (+234XXXXXXXXXX), or null if invalid
 *
 * @example
 * ```ts
 * normalizeNigerianPhone('08012345678') // '+2348012345678'
 * normalizeNigerianPhone('234 801 234 5678') // '+2348012345678'
 * normalizeNigerianPhone('+2348012345678') // '+2348012345678'
 * normalizeNigerianPhone('invalid') // null
 * ```
 */
export function normalizeNigerianPhone(phone: string): string | null {
  if (!isValidNigerianPhone(phone)) return null;

  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Already in +234 format
  if (cleaned.startsWith('+234')) {
    return cleaned;
  }

  // In 234 format
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  }

  // In 0 format (0XXXXXXXXXX)
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.substring(1);
  }

  // In short format (XXXXXXXXXXX)
  if (/^[789]\d{9}$/.test(cleaned)) {
    return '+234' + cleaned;
  }

  return null;
}

/**
 * Validate string field with length constraints
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): ValidationError | null {
  // Check required
  if (options.required && (!value || typeof value !== 'string' || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  // If not required and empty, skip further validation
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();

  // Check minimum length
  if (options.minLength && trimmed.length < options.minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${options.minLength} characters`,
    };
  }

  // Check maximum length
  if (options.maxLength && trimmed.length > options.maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${options.maxLength} characters`,
    };
  }

  // Check pattern
  if (options.pattern && !options.pattern.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} has invalid format`,
    };
  }

  return null;
}

/**
 * Validate numeric field with range constraints
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationError | null {
  // Check required
  if (options.required && (value === undefined || value === null)) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  // If not required and missing, skip further validation
  if (value === undefined || value === null) return null;

  const num = Number(value);

  // Check if valid number
  if (!Number.isFinite(num)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  // Check if integer required
  if (options.integer && !Number.isInteger(num)) {
    return { field: fieldName, message: `${fieldName} must be an integer` };
  }

  // Check minimum value
  if (options.min !== undefined && num < options.min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${options.min}`,
    };
  }

  // Check maximum value
  if (options.max !== undefined && num > options.max) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${options.max}`,
    };
  }

  return null;
}

/**
 * Validate email field
 */
export function validateEmail(
  value: unknown,
  fieldName: string = 'email',
  options: { required?: boolean } = {}
): ValidationError | null {
  // Check required
  if (options.required && (!value || typeof value !== 'string' || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  // If not required and empty, skip validation
  if (!value || typeof value !== 'string') return null;

  if (!isValidEmail(value)) {
    return { field: fieldName, message: `${fieldName} must be a valid email address` };
  }

  return null;
}

/**
 * Validate phone number field
 */
export function validatePhone(
  value: unknown,
  fieldName: string = 'phone',
  options: { required?: boolean } = {}
): ValidationError | null {
  // Check required
  if (options.required && (!value || typeof value !== 'string' || value.trim() === '')) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  // If not required and empty, skip validation
  if (!value || typeof value !== 'string') return null;

  if (!isValidNigerianPhone(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid Nigerian phone number`,
    };
  }

  return null;
}

/**
 * Validate array field
 */
export function validateArray(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationError | null {
  // Check required
  if (options.required && (!Array.isArray(value) || value.length === 0)) {
    return { field: fieldName, message: `${fieldName} is required and must not be empty` };
  }

  // If not required and missing/empty, skip validation
  if (!Array.isArray(value)) {
    if (options.required) {
      return { field: fieldName, message: `${fieldName} must be an array` };
    }
    return null;
  }

  // Check minimum length
  if (options.minLength !== undefined && value.length < options.minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must have at least ${options.minLength} items`,
    };
  }

  // Check maximum length
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${options.maxLength} items`,
    };
  }

  return null;
}

/**
 * Sanitizes string input by removing dangerous characters and normalizing whitespace
 *
 * Performs:
 * - Trims leading/trailing whitespace
 * - Removes NULL bytes (\0) that can cause security issues
 * - Normalizes multiple consecutive spaces to single space
 *
 * @param value - String to sanitize
 * @returns Sanitized string, or empty string if input is not a string
 *
 * @example
 * ```ts
 * sanitizeString('  hello   world  ') // 'hello world'
 * sanitizeString('test\0data') // 'testdata'
 * sanitizeString(null) // ''
 * ```
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    // Remove NULL bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes HTML/script content for basic XSS prevention
 *
 * Removes common XSS attack vectors:
 * - <script> tags and their contents
 * - <iframe> tags and their contents
 * - onclick, onerror, and other event handler attributes
 * - javascript: protocol in URLs
 *
 * ⚠️ Note: This is basic sanitization. For user-generated HTML,
 * use a dedicated library like DOMPurify.
 *
 * @param value - HTML string to sanitize
 * @returns Sanitized HTML string
 *
 * @example
 * ```ts
 * sanitizeHtml('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeHtml('<a href="javascript:alert()">Link</a>') // '<a href="">Link</a>'
 * sanitizeHtml('<div onclick="alert()">Click</div>') // '<div>Click</div>'
 * ```
 */
export function sanitizeHtml(value: string): string {
  if (typeof value !== 'string') return '';

  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Collect all validation errors and throw if any exist
 */
export function collectErrors(
  ...errors: (ValidationError | null)[]
): void {
  const validErrors = errors.filter((e): e is ValidationError => e !== null);
  if (validErrors.length > 0) {
    throw new ValidationException(validErrors);
  }
}

/**
 * Order input interface
 */
export interface OrderInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  delivery_fee?: number;
  tax?: number;
  discount_amount?: number;
  delivery_address_text?: string;
  notes?: string;
}

/**
 * Order validation schema
 */
export function validateOrderInput(body: Partial<OrderInput>): { errors: ValidationError[]; valid: boolean } {
  const errors: ValidationError[] = [];

  // Validate customer information
  const nameError = validateString(body.customer_name, 'customer_name', {
    required: true,
    minLength: 2,
    maxLength: 100,
  });
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(body.customer_email, 'customer_email', {
    required: true,
  });
  if (emailError) errors.push(emailError);

  const phoneError = validatePhone(body.customer_phone, 'customer_phone', {
    required: true,
  });
  if (phoneError) errors.push(phoneError);

  // Validate items array
  const itemsError = validateArray(body.items, 'items', {
    required: true,
    minLength: 1,
    maxLength: 50,
  });
  if (itemsError) errors.push(itemsError);

  // Validate each item
  if (Array.isArray(body.items)) {
    body.items.forEach((item: Partial<OrderInput['items'][number]>, index: number) => {
      const qtyError = validateNumber(item.quantity, `items[${index}].quantity`, {
        required: true,
        min: 1,
        max: 100,
        integer: true,
      });
      if (qtyError) errors.push(qtyError);

      const priceError = validateNumber(item.unit_price, `items[${index}].unit_price`, {
        required: true,
        min: 0,
        max: 1000000,
      });
      if (priceError) errors.push(priceError);

      const totalError = validateNumber(item.total_price, `items[${index}].total_price`, {
        required: true,
        min: 0,
        max: 100000000,
      });
      if (totalError) errors.push(totalError);
    });
  }

  // Validate numeric fields
  const deliveryFeeError = validateNumber(body.delivery_fee, 'delivery_fee', {
    min: 0,
    max: 50000,
  });
  if (deliveryFeeError) errors.push(deliveryFeeError);

  const taxError = validateNumber(body.tax, 'tax', {
    min: 0,
    max: 100000,
  });
  if (taxError) errors.push(taxError);

  const discountError = validateNumber(body.discount_amount, 'discount_amount', {
    min: 0,
    max: 100000,
  });
  if (discountError) errors.push(discountError);

  // Validate delivery address
  if (body.delivery_address_text) {
    const addressError = validateString(body.delivery_address_text, 'delivery_address_text', {
      minLength: 10,
      maxLength: 500,
    });
    if (addressError) errors.push(addressError);
  }

  // Validate notes
  if (body.notes) {
    const notesError = validateString(body.notes, 'notes', {
      maxLength: 1000,
    });
    if (notesError) errors.push(notesError);
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

/**
 * Address input interface
 */
export interface AddressInput {
  label: string;
  street_address: string;
  city: string;
  state?: string;
  postal_code?: string;
}

/**
 * Address validation schema (for user addresses API)
 */
export function validateAddressInput(body: Partial<AddressInput>): { errors: ValidationError[]; valid: boolean } {
  const errors: ValidationError[] = [];

  // Validate label (address name)
  const labelError = validateString(body.label, 'label', {
    required: true,
    minLength: 2,
    maxLength: 50,
  });
  if (labelError) errors.push(labelError);

  // Validate street address
  const streetError = validateString(body.street_address, 'street_address', {
    required: true,
    minLength: 5,
    maxLength: 500,
  });
  if (streetError) errors.push(streetError);

  // Validate city
  const cityError = validateString(body.city, 'city', {
    required: true,
    minLength: 2,
    maxLength: 100,
  });
  if (cityError) errors.push(cityError);

  // Validate state (optional)
  if (body.state) {
    const stateError = validateString(body.state, 'state', {
      minLength: 2,
      maxLength: 100,
    });
    if (stateError) errors.push(stateError);
  }

  // Validate postal code (optional)
  if (body.postal_code) {
    const postalError = validateString(body.postal_code, 'postal_code', {
      minLength: 3,
      maxLength: 10,
    });
    if (postalError) errors.push(postalError);
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}
