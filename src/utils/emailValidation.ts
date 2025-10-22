// Email validation utilities for university domains
// Supports .edu, .ac.uk, .edu.au, .ca domains

export interface EmailValidationResult {
  isValid: boolean;
  domain: string | null;
  university: string | null;
  errorMessage?: string;
}

// Supported university email domains
const UNIVERSITY_DOMAINS = [
  '.edu',      // US universities
  '.ac.uk',    // UK universities  
  '.edu.au',   // Australian universities
  '.ca'        // Canadian universities
];

// Email validation regex pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.uk|edu\.au|ca)$/;

/**
 * Validates if an email address is from a supported university domain
 */
export function validateUniversityEmail(email: string): EmailValidationResult {
  // Basic email format check
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      domain: null,
      university: null,
      errorMessage: 'Please enter a valid email address'
    };
  }

  // Trim and lowercase email
  const cleanEmail = email.trim().toLowerCase();

  // Check if email matches university domain pattern
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return {
      isValid: false,
      domain: null,
      university: null,
      errorMessage: 'Please use your university email address (.edu, .ac.uk, .edu.au, .ca)'
    };
  }

  // Extract domain and university name
  const domain = extractDomain(cleanEmail);
  const university = extractUniversityName(domain);

  return {
    isValid: true,
    domain,
    university,
    errorMessage: undefined
  };
}

/**
 * Extracts domain from email address
 */
function extractDomain(email: string): string {
  return email.split('@')[1] || '';
}

/**
 * Extracts university name from domain
 */
function extractUniversityName(domain: string): string {
  // Remove university domain suffixes
  let university = domain
    .replace('.edu', '')
    .replace('.ac.uk', '')
    .replace('.edu.au', '')
    .replace('.ca', '');

  // Capitalize first letter of each word and handle subdomains
  university = university
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return university;
}

/**
 * Checks if a domain is supported
 */
export function isSupportedUniversityDomain(domain: string): boolean {
  return UNIVERSITY_DOMAINS.some(supportedDomain => 
    domain.toLowerCase().endsWith(supportedDomain)
  );
}

/**
 * Gets user-friendly error message for email validation
 */
export function getEmailValidationMessage(email: string): string {
  const result = validateUniversityEmail(email);
  return result.errorMessage || '';
}
