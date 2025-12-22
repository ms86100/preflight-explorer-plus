/**
 * @fileoverview Security utilities for input validation and sanitization.
 * @module lib/security
 * 
 * @description
 * Provides comprehensive security utilities for:
 * - Input validation with Zod schemas
 * - XSS prevention through sanitization
 * - URL validation and encoding
 * - Sensitive data masking for logs
 * 
 * @example
 * ```typescript
 * import { sanitizeInput, validateEmail, maskSensitiveData } from '@/lib/security';
 * 
 * const cleanInput = sanitizeInput(userInput);
 * const isValid = validateEmail(email);
 * const safeLog = maskSensitiveData({ email: 'user@test.com', password: 'secret' });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum allowed input lengths for various field types.
 * Prevents memory exhaustion and database overflow attacks.
 */
export const INPUT_LIMITS = {
  /** Short text fields like names, titles */
  SHORT_TEXT: 100,
  /** Medium text fields like descriptions */
  MEDIUM_TEXT: 500,
  /** Long text fields like comments, body content */
  LONG_TEXT: 10000,
  /** Email addresses */
  EMAIL: 255,
  /** URLs */
  URL: 2048,
  /** Search queries */
  SEARCH: 200,
  /** Issue keys like PROJ-123 */
  ISSUE_KEY: 20,
  /** Project keys like PROJ */
  PROJECT_KEY: 10,
  /** Passwords (max, Supabase enforces min) */
  PASSWORD: 128,
} as const;

/**
 * Patterns for dangerous content that should be stripped.
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
] as const;

/**
 * Fields that should be masked in logs.
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurity',
] as const;

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Email validation schema with proper format and length checks.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(INPUT_LIMITS.EMAIL, `Email must be less than ${INPUT_LIMITS.EMAIL} characters`)
  .email('Invalid email format')
  .transform((email) => email.toLowerCase());

/**
 * Password validation schema with security requirements.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(INPUT_LIMITS.PASSWORD, `Password must be less than ${INPUT_LIMITS.PASSWORD} characters`);

/**
 * Display name validation schema.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(INPUT_LIMITS.SHORT_TEXT, `Display name must be less than ${INPUT_LIMITS.SHORT_TEXT} characters`)
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Display name contains invalid characters');

/**
 * Issue summary validation schema.
 */
export const issueSummarySchema = z
  .string()
  .trim()
  .min(1, 'Summary is required')
  .max(INPUT_LIMITS.MEDIUM_TEXT, `Summary must be less than ${INPUT_LIMITS.MEDIUM_TEXT} characters`);

/**
 * Issue description validation schema (allows longer content).
 */
export const issueDescriptionSchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.LONG_TEXT, `Description must be less than ${INPUT_LIMITS.LONG_TEXT} characters`)
  .optional();

/**
 * Search query validation schema.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.SEARCH, `Search query must be less than ${INPUT_LIMITS.SEARCH} characters`);

/**
 * Project key validation schema (uppercase letters only).
 */
export const projectKeySchema = z
  .string()
  .trim()
  .min(2, 'Project key must be at least 2 characters')
  .max(INPUT_LIMITS.PROJECT_KEY, `Project key must be less than ${INPUT_LIMITS.PROJECT_KEY} characters`)
  .regex(/^[A-Z][A-Z0-9]*$/, 'Project key must be uppercase letters and numbers, starting with a letter')
  .transform((key) => key.toUpperCase());

/**
 * URL validation schema.
 */
export const urlSchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.URL, `URL must be less than ${INPUT_LIMITS.URL} characters`)
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  );

/**
 * UUID validation schema.
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitizes user input by removing potentially dangerous content.
 * Does NOT escape HTML entities - use for content that won't be rendered as HTML.
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string with dangerous patterns removed
 * 
 * @example
 * ```typescript
 * const clean = sanitizeInput('<script>alert("xss")</script>Hello');
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim whitespace
  return sanitized.trim();
}

/**
 * Escapes HTML entities to prevent XSS when rendering user content.
 * Use this when you need to display user input in HTML context.
 * 
 * @param input - The string to escape
 * @returns String with HTML entities escaped
 * 
 * @example
 * ```typescript
 * const safe = escapeHtml('<b>Hello</b> & "world"');
 * // Returns: '&lt;b&gt;Hello&lt;/b&gt; &amp; &quot;world&quot;'
 * ```
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Safely encodes a value for use in URL parameters.
 * 
 * @param value - The value to encode
 * @returns URL-encoded string
 * 
 * @example
 * ```typescript
 * const encoded = encodeUrlParam('hello world & more');
 * // Returns: 'hello%20world%20%26%20more'
 * ```
 */
export function encodeUrlParam(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return encodeURIComponent(value);
}

/**
 * Validates and sanitizes a URL, ensuring it uses safe protocols.
 * 
 * @param url - The URL to validate
 * @returns The validated URL or null if invalid
 * 
 * @example
 * ```typescript
 * const safe = validateUrl('https://example.com');
 * // Returns: 'https://example.com'
 * 
 * const invalid = validateUrl('javascript:alert(1)');
 * // Returns: null
 * ```
 */
export function validateUrl(url: string): string | null {
  if (typeof url !== 'string' || url.length > INPUT_LIMITS.URL) {
    return null;
  }

  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

// ============================================================================
// Logging Security
// ============================================================================

/**
 * Masks sensitive data in objects for safe logging.
 * Replaces sensitive field values with '[REDACTED]'.
 * 
 * @param data - The object to mask
 * @returns A new object with sensitive fields masked
 * 
 * @example
 * ```typescript
 * const log = maskSensitiveData({
 *   email: 'user@test.com',
 *   password: 'secret123',
 *   token: 'abc123'
 * });
 * // Returns: { email: 'user@test.com', password: '[REDACTED]', token: '[REDACTED]' }
 * ```
 */
export function maskSensitiveData<T extends Record<string, unknown>>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field name indicates sensitive data
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      masked[key as keyof T] = '[REDACTED]' as T[keyof T];
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      // Recursively mask nested objects
      masked[key as keyof T] = maskSensitiveData(
        masked[key] as Record<string, unknown>
      ) as T[keyof T];
    }
  }

  return masked;
}

/**
 * Creates a safe log message by masking sensitive data.
 * 
 * @param message - Log message prefix
 * @param data - Data to log (will be masked)
 * @returns Formatted log string
 */
export function createSafeLog(message: string, data?: Record<string, unknown>): string {
  if (!data) {
    return message;
  }

  const maskedData = maskSensitiveData(data);
  return `${message} ${JSON.stringify(maskedData)}`;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates an email address format.
 * 
 * @param email - The email to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const result = emailSchema.safeParse(email);
  return result.success;
}

/**
 * Validates a UUID format.
 * 
 * @param id - The ID to validate
 * @returns True if ID is a valid UUID
 */
export function validateUuid(id: string): boolean {
  const result = uuidSchema.safeParse(id);
  return result.success;
}

/**
 * Validates that a string doesn't exceed a maximum length.
 * 
 * @param value - The value to check
 * @param maxLength - Maximum allowed length
 * @returns True if value is within limit
 */
export function validateLength(value: string, maxLength: number): boolean {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * Validates and normalizes a search query.
 * Removes dangerous characters and enforces length limits.
 * 
 * @param query - The search query to validate
 * @returns Sanitized search query or empty string if invalid
 */
export function validateSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }

  // Sanitize and limit length
  const sanitized = sanitizeInput(query).slice(0, INPUT_LIMITS.SEARCH);

  // Remove SQL injection attempts
  return sanitized
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .trim();
}

// ============================================================================
// Form Validation Schemas
// ============================================================================

/**
 * Login form validation schema.
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration form validation schema.
 */
export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

/**
 * Create issue form validation schema.
 */
export const createIssueFormSchema = z.object({
  summary: issueSummarySchema,
  description: issueDescriptionSchema,
  project_id: uuidSchema,
  issue_type_id: uuidSchema,
  status_id: uuidSchema,
  priority_id: uuidSchema.optional(),
  assignee_id: uuidSchema.optional(),
});

/**
 * Create project form validation schema.
 */
export const createProjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(INPUT_LIMITS.SHORT_TEXT, `Name must be less than ${INPUT_LIMITS.SHORT_TEXT} characters`),
  pkey: projectKeySchema,
  description: z
    .string()
    .max(INPUT_LIMITS.MEDIUM_TEXT, `Description must be less than ${INPUT_LIMITS.MEDIUM_TEXT} characters`)
    .optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type CreateIssueFormData = z.infer<typeof createIssueFormSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;
