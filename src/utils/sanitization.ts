// =====================================================
// INPUT SANITIZATION UTILITY - PHASE 4
// =====================================================
// Utility functions for sanitizing user inputs
// Prevents XSS attacks and other security vulnerabilities

/**
 * Sanitize text input by removing potentially dangerous content
 * @param text - Raw text input from user
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized text
 */
export function sanitizeMessage(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other potentially dangerous HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize profile text fields (bio, notes, etc.)
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized text
 */
export function sanitizeProfileText(text: string, maxLength: number = 500): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous HTML tags but allow basic formatting
    .replace(/<(?!\/?(b|i|em|strong|br|p)\b)[^>]*>/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize location/venue names
 * @param location - Raw location input
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized location
 */
export function sanitizeLocation(location: string, maxLength: number = 100): string {
  if (!location || typeof location !== 'string') {
    return '';
  }

  return location
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove special characters that could be dangerous
    .replace(/[<>'"&]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize names (first name, last name, etc.)
 * @param name - Raw name input
 * @param maxLength - Maximum allowed length (default: 50)
 * @returns Sanitized name
 */
export function sanitizeName(name: string, maxLength: number = 50): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove special characters except basic punctuation
    .replace(/[<>'"&]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize subject names/course names
 * @param subject - Raw subject input
 * @param maxLength - Maximum allowed length (default: 30)
 * @returns Sanitized subject
 */
export function sanitizeSubject(subject: string, maxLength: number = 30): string {
  if (!subject || typeof subject !== 'string') {
    return '';
  }

  return subject
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove special characters except basic punctuation
    .replace(/[<>'"&]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validate and sanitize email addresses
 * @param email - Raw email input
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Sanitize and validate
  const sanitized = email
    .toLowerCase()
    .trim()
    .slice(0, 254); // RFC 5321 limit

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Validate and sanitize phone numbers
 * @param phone - Raw phone input
 * @returns Sanitized phone or empty string if invalid
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except + at the beginning
  const sanitized = phone
    .replace(/[^\d+]/g, '')
    .slice(0, 15); // ITU-T E.164 limit

  // Basic validation (should start with + and have 10-15 digits)
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  
  return phoneRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize any generic text input
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length
 * @param allowHtml - Whether to allow basic HTML tags (default: false)
 * @returns Sanitized text
 */
export function sanitizeText(
  text: string, 
  maxLength: number = 1000, 
  allowHtml: boolean = false
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  if (!allowHtml) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Remove dangerous HTML tags but allow basic formatting
    sanitized = sanitized.replace(/<(?!\/?(b|i|em|strong|br|p)\b)[^>]*>/gi, '');
  }

  return sanitized
    // Remove javascript: and data: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}
