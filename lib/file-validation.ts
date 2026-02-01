/**
 * Secure file validation with magic number (file signature) verification
 * Prevents file type spoofing by checking actual file content, not just MIME type
 *
 * @example
 * ```typescript
 * import { validateImageFile } from '@/lib/file-validation';
 *
 * const file = formData.get('avatar') as File;
 * const validation = await validateImageFile(file, { maxSize: 5 * 1024 * 1024 });
 *
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 });
 * }
 * ```
 */

import { safeConsole } from './logger';

/**
 * File magic numbers (file signatures) for supported image types
 * These are the first bytes of a file that identify its actual type
 */
const IMAGE_SIGNATURES = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG/JPG
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
  bmp: [
    [0x42, 0x4d], // BM
  ],
  ico: [
    [0x00, 0x00, 0x01, 0x00], // ICO
  ],
} as const;

/**
 * PDF file signature (for document uploads)
 */
const PDF_SIGNATURES = [
  [0x25, 0x50, 0x44, 0x46], // %PDF
] as const;

export interface FileValidationOptions {
  /**
   * Maximum file size in bytes
   * Default: 5MB
   */
  maxSize?: number;

  /**
   * Allowed MIME types
   * If not specified, only magic number validation is used
   */
  allowedTypes?: string[];

  /**
   * Whether to perform strict MIME type validation in addition to magic number check
   * Default: true
   */
  strictMimeType?: boolean;
}

export interface FileValidationResult {
  /**
   * Whether the file passed validation
   */
  valid: boolean;

  /**
   * Error message if validation failed
   */
  error?: string;

  /**
   * Detected file type from magic number
   */
  detectedType?: string;
}

/**
 * Check if buffer matches a file signature
 */
function matchesSignature(buffer: Uint8Array, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect actual file type from magic number
 */
function detectFileType(buffer: Uint8Array): string | null {
  // Check image signatures
  for (const [type, signatures] of Object.entries(IMAGE_SIGNATURES)) {
    for (const signature of signatures) {
      if (matchesSignature(buffer, signature)) {
        return `image/${type}`;
      }
    }
  }

  // Special handling for WebP (needs additional check)
  if (matchesSignature(buffer, IMAGE_SIGNATURES.webp[0])) {
    // WebP has "WEBP" at offset 8-11
    if (buffer.length >= 12 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 &&
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }

  // Check PDF signature
  for (const signature of PDF_SIGNATURES) {
    if (matchesSignature(buffer, signature)) {
      return 'application/pdf';
    }
  }

  return null;
}

/**
 * Validate image file with magic number verification
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export async function validateImageFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    strictMimeType = true,
  } = options;

  // Validate file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Validate MIME type (basic check)
  if (strictMimeType && !file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Read first 12 bytes for magic number verification
  const arrayBuffer = await file.slice(0, 12).arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Detect actual file type from magic number
  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    safeConsole.warn('File validation failed: unknown file signature', {
      fileName: file.name,
      mimeType: file.type,
      firstBytes: Array.from(buffer.slice(0, 4)).map(b => `0x${b.toString(16).padStart(2, '0')}`),
    });
    return {
      valid: false,
      error: 'Invalid or unsupported file type',
    };
  }

  // Verify detected type matches allowed types
  if (!allowedTypes.includes(detectedType)) {
    safeConsole.warn('File validation failed: type not allowed', {
      fileName: file.name,
      mimeType: file.type,
      detectedType,
      allowedTypes,
    });
    return {
      valid: false,
      error: `File type ${detectedType} is not allowed`,
    };
  }

  // SECURITY: Verify declared MIME type matches detected type
  // Prevents attackers from renaming malicious files with image extensions
  if (strictMimeType) {
    const normalizedMimeType = file.type.replace('image/jpg', 'image/jpeg');
    const normalizedDetectedType = detectedType.replace('image/jpg', 'image/jpeg');

    if (normalizedMimeType !== normalizedDetectedType) {
      safeConsole.warn('File validation failed: MIME type mismatch', {
        fileName: file.name,
        declaredType: file.type,
        detectedType,
      });
      return {
        valid: false,
        error: 'File type mismatch - file may be corrupted or tampered with',
      };
    }
  }

  return { valid: true, detectedType };
}

/**
 * Validate PDF file with magic number verification
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export async function validatePdfFile(
  file: File,
  options: Omit<FileValidationOptions, 'allowedTypes'> = {}
): Promise<FileValidationResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default for PDFs
    strictMimeType = true,
  } = options;

  // Validate file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Validate MIME type
  if (strictMimeType && file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Read first 4 bytes for magic number verification
  const arrayBuffer = await file.slice(0, 4).arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Check PDF signature
  if (!matchesSignature(buffer, PDF_SIGNATURES[0])) {
    safeConsole.warn('PDF validation failed: invalid signature', {
      fileName: file.name,
      mimeType: file.type,
      firstBytes: Array.from(buffer).map(b => `0x${b.toString(16).padStart(2, '0')}`),
    });
    return {
      valid: false,
      error: 'Invalid PDF file',
    };
  }

  return { valid: true, detectedType: 'application/pdf' };
}

/**
 * Get safe file extension from detected file type
 * Prevents using user-controlled extensions that could be dangerous
 */
export function getSafeExtension(detectedType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/ico': 'ico',
    'application/pdf': 'pdf',
  };

  return typeMap[detectedType] || 'bin';
}

/**
 * Generate safe filename with timestamp and detected extension
 * Prevents path traversal and ensures correct extension
 *
 * @param prefix - Filename prefix (e.g., user ID)
 * @param detectedType - Detected MIME type from magic number
 * @returns Safe filename
 */
export function generateSafeFilename(prefix: string, detectedType: string): string {
  // Sanitize prefix (remove any path separators or special chars)
  const safePrefix = prefix.replace(/[^a-zA-Z0-9-_]/g, '');
  const timestamp = Date.now();
  const ext = getSafeExtension(detectedType);

  return `${safePrefix}-${timestamp}.${ext}`;
}

/**
 * Validate document file (PDF only - Word docs require complex validation)
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export async function validateDocumentFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default for documents
    allowedTypes = ['application/pdf'],
    strictMimeType = true,
  } = options;

  // Validate file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // For PDF files, perform magic number verification
  if (file.type === 'application/pdf' || allowedTypes.includes('application/pdf')) {
    // Read first 4 bytes for magic number verification
    const arrayBuffer = await file.slice(0, 4).arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Check PDF signature
    if (matchesSignature(buffer, PDF_SIGNATURES[0])) {
      return { valid: true, detectedType: 'application/pdf' };
    }

    // If declared as PDF but doesn't match signature
    if (file.type === 'application/pdf') {
      safeConsole.warn('PDF validation failed: invalid signature', {
        fileName: file.name,
        mimeType: file.type,
        firstBytes: Array.from(buffer).map(b => `0x${b.toString(16).padStart(2, '0')}`),
      });
      return {
        valid: false,
        error: 'Invalid PDF file - file may be corrupted or tampered with',
      };
    }
  }

  // For Word documents (.doc, .docx), we only do basic MIME type validation
  // TODO: Add magic number verification for Word documents
  // .doc files start with 0xD0 0xCF 0x11 0xE0 (OLE2 compound file)
  // .docx files start with 0x50 0x4B 0x03 0x04 (ZIP file)
  const wordTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (wordTypes.includes(file.type) && allowedTypes.some(t => wordTypes.includes(t))) {
    // Basic validation only for now
    safeConsole.warn('Word document validation is basic (MIME type only)', {
      fileName: file.name,
      mimeType: file.type,
    });
    return { valid: true, detectedType: file.type };
  }

  // Validate MIME type
  if (strictMimeType && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: false, error: 'Unsupported file type' };
}
