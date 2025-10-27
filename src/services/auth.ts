import { supabase } from './supabase';
import { validateUniversityEmail, EmailValidationResult } from '../utils/emailValidation';
import type { User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User | null;
  error?: string;
  emailValidation?: EmailValidationResult;
}

/**
 * Signs up a new user with university email validation
 */
export async function signUp({ email, password, fullName }: SignUpData): Promise<AuthResult> {
  try {
    // Validate university email first
    const emailValidation = validateUniversityEmail(email);
    
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.errorMessage,
        emailValidation
      };
    }

    // Attempt to sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          university: emailValidation.university
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.message),
        emailValidation
      };
    }

    return {
      success: true,
      user: data.user,
      emailValidation
    };

  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Signs in an existing user
 */
export async function signIn({ email, password }: SignInData): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.message)
      };
    }

    return {
      success: true,
      user: data.user
    };

  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.message)
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Resends email verification
 */
export async function resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email first
    const emailValidation = validateUniversityEmail(email);
    
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.errorMessage
      };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error.message)
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Gets the current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Converts Supabase auth errors to user-friendly messages
 */
function getAuthErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please check your email and click the verification link',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Invalid email': 'Please enter a valid email address',
    'Signup is disabled': 'Account creation is currently disabled',
    'Email rate limit exceeded': 'Too many verification emails sent. Please wait before trying again'
  };

  return errorMap[errorMessage] || 'An error occurred. Please try again.';
}
