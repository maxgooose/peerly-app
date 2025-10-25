import { supabase } from './supabase';
import type { Database, User, WeeklyAvailability } from './supabase';

// IMPROVED: More specific types for type safety and autocomplete
// Payload structure for submitting onboarding data from the client
export interface OnboardingPayload {
  fullName: string;
  major: string;
  academicYear: string;
  bio?: string;
  preferredSubjects: string[];
  availability?: WeeklyAvailability | null;
  studyStyle?: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null;
  studyGoals?: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null;
}

// Type alias for the user profile returned after onboarding
export type OnboardingProfile = User;

// Result structure returned by onboarding operations
export interface OnboardingResult {
  success: boolean;
  profile?: OnboardingProfile | null;
  error?: string;
}

// Result structure for checking onboarding status
export interface OnboardingStatusResult {
  success: boolean;
  onboardingCompleted: boolean;
  completedAt?: string | null;
  userExists: boolean; // ADDED: Check if user record exists in database
  error?: string;
}

// Default error message for unexpected failures
const DEFAULT_ERROR_MESSAGE = 'We were unable to save your profile information. Please try again.';

// IMPROVED: More comprehensive error mapping
// Converts technical database errors into user-friendly messages
function mapOnboardingError(errorMessage: string): string {
  if (!errorMessage) {
    return DEFAULT_ERROR_MESSAGE;
  }

  // Normalize error message to lowercase for consistent matching
  const normalized = errorMessage.toLowerCase();

  // Specific field errors - match against parameter names from RPC function
  if (normalized.includes('full name') || normalized.includes('p_full_name')) {
    return 'Please add your full name to continue.';
  }

  if (normalized.includes('major') || normalized.includes('p_major')) {
    return 'Let us know your major so we can match you with the right study partners.';
  }

  if (normalized.includes('academic year') || normalized.includes('p_year')) {
    return 'Choose the academic year that best describes you.';
  }

  if (normalized.includes('preferred subject') || normalized.includes('p_preferred_subjects')) {
    return 'Pick at least one subject you want help with or love to study.';
  }

  if (normalized.includes('availability must be a json object')) {
    return 'Availability must be a valid schedule. Please try adjusting it and saving again.';
  }

  // Authorization errors - user trying to update wrong profile
  if (normalized.includes('not authorized')) {
    return 'You are not allowed to update this profile.';
  }

  // Database errors - record doesn't exist
  if (normalized.includes('user not found')) {
    return 'Your profile was not found. Please try signing out and back in.';
  }

  // Function errors - RPC function may not exist in database
  if (normalized.includes('function') && normalized.includes('does not exist')) {
    return 'This feature is not yet available. Please contact support.';
  }

  // Network/connection errors
  if (normalized.includes('network') || normalized.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }

  // If no specific error matched, return generic message
  return DEFAULT_ERROR_MESSAGE;
}

/**
 * NEW: Ensures user record exists in users table
 * This should be called after signup or before onboarding
 * Handles cases where the auth trigger might have failed to create the user record
 */
export async function ensureUserRecordExists(): Promise<{ success: boolean; error?: string }> {
  // Get the currently authenticated user from Supabase Auth
  const { data: userData, error: authError } = await supabase.auth.getUser();

  // User must be authenticated to ensure record
  if (authError || !userData?.user) {
    return {
      success: false,
      error: 'You need to be signed in.'
    };
  }

  // Check if user record already exists in users table
  const { data: existingUser, error: queryError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userData.user.id)
    .maybeSingle(); // Returns null if no record found instead of throwing error

  // Handle query errors
  if (queryError) {
    console.error('Error checking user record:', queryError);
    return {
      success: false,
      error: 'Unable to verify your profile. Please try again.'
    };
  }

  // If user record exists, we're done
  if (existingUser) {
    return { success: true };
  }

  // User record doesn't exist, create it manually
  // Extract university from metadata or email
  const university = userData.user.user_metadata?.university || 
                     extractUniversityFromEmail(userData.user.email || '');

  // Insert new user record with basic information
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: userData.user.id, // Use same ID as auth user for foreign key relationship
      email: userData.user.email!,
      full_name: userData.user.user_metadata?.full_name || null,
      university: university || null,
      onboarding_completed: false // User has not completed onboarding yet
    });

  // Handle insert errors
  if (insertError) {
    console.error('Error creating user record:', insertError);
    return {
      success: false,
      error: 'Unable to create your profile. Please contact support.'
    };
  }

  return { success: true };
}

/**
 * IMPROVED: Complete user onboarding with better validation and error handling
 * Calls the database RPC function to save all onboarding data atomically
 */
export async function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  // 1. Check authentication - user must be logged in to complete onboarding
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return {
      success: false,
      error: 'You need to be signed in to complete onboarding.'
    };
  }

  // 2. Validate and clean input - trim whitespace from all text fields
  const trimmedFullName = payload.fullName.trim();
  const trimmedMajor = payload.major.trim();
  const trimmedYear = payload.academicYear.trim();
  const trimmedBio = payload.bio?.trim() || null;
  // Clean subjects array by trimming each element and filtering empty strings
  const trimmedSubjects = payload.preferredSubjects
    .map((subject) => subject.trim())
    .filter(Boolean); // Remove empty strings

  // Client-side validation before calling database function
  // Provides faster feedback to user without round-trip to database
  if (!trimmedFullName) {
    return {
      success: false,
      error: 'Please add your full name to continue.'
    };
  }

  if (!trimmedMajor) {
    return {
      success: false,
      error: 'Let us know your major so we can match you with the right study partners.'
    };
  }

  if (!trimmedYear) {
    return {
      success: false,
      error: 'Choose the academic year that best describes you.'
    };
  }

  if (trimmedSubjects.length === 0) {
    return {
      success: false,
      error: 'Pick at least one subject to continue.'
    };
  }

  // 3. Ensure user record exists in case trigger didn't fire during signup
  const ensureResult = await ensureUserRecordExists();
  if (!ensureResult.success) {
    return {
      success: false,
      error: ensureResult.error
    };
  }

  // 4. Call the RPC function to complete onboarding
  // This updates the user record and marks onboarding as complete in a single transaction
  const { data, error } = await supabase.rpc('complete_user_onboarding', {
    p_user_id: userData.user.id,
    p_full_name: trimmedFullName,
    p_major: trimmedMajor,
    p_year: trimmedYear,
    p_bio: trimmedBio,
    p_preferred_subjects: trimmedSubjects,
    p_availability: payload.availability ?? null, // Convert undefined to null for database
    p_study_style: payload.studyStyle ?? null,
    p_study_goals: payload.studyGoals ?? null
  });

  // Handle RPC errors
  if (error) {
    console.error('Onboarding RPC error:', error);
    return {
      success: false,
      error: mapOnboardingError(error.message)
    };
  }

  // 5. Fetch the updated profile to ensure we have properly typed data
  // RPC function returns json which may not be properly typed
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .single(); // Expect exactly one record

  if (fetchError) {
    console.error('Error fetching updated profile:', fetchError);
    // Still return success since onboarding completed, just without profile data
    // The profile can be fetched again later
    return {
      success: true,
      profile: data as OnboardingProfile
    };
  }

  return {
    success: true,
    profile: profile as OnboardingProfile
  };
}

/**
 * IMPROVED: Check onboarding status with user existence check
 * Determines whether user needs to complete onboarding flow
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResult> {
  // Get currently authenticated user
  const { data: userData, error: authError } = await supabase.auth.getUser();

  // User must be authenticated to check status
  if (authError || !userData?.user) {
    return {
      success: false,
      onboardingCompleted: false,
      userExists: false,
      error: 'You need to be signed in to check onboarding status.'
    };
  }

  // Query user record for onboarding status
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed, onboarding_completed_at')
    .eq('id', userData.user.id)
    .maybeSingle(); // Returns null if no record found

  // Handle query errors
  if (error) {
    console.error('Error fetching onboarding status:', error);
    return {
      success: false,
      onboardingCompleted: false,
      userExists: false,
      error: DEFAULT_ERROR_MESSAGE
    };
  }

  // User record doesn't exist yet (trigger may not have fired)
  if (!data) {
    return {
      success: true,
      onboardingCompleted: false,
      completedAt: null,
      userExists: false // Signals that user record needs to be created
    };
  }

  // User record exists, return onboarding status
  return {
    success: true,
    onboardingCompleted: Boolean(data.onboarding_completed), // Ensure boolean type
    completedAt: data.onboarding_completed_at ?? null,
    userExists: true
  };
}

/**
 * NEW: Get user profile
 * Fetches the complete user profile from the database
 */
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: User | null;
  error?: string;
}> {
  // Get currently authenticated user
  const { data: userData, error: authError } = await supabase.auth.getUser();

  // User must be authenticated to fetch profile
  if (authError || !userData?.user) {
    return {
      success: false,
      error: 'You need to be signed in.'
    };
  }

  // Fetch complete user profile from database
  const { data, error } = await supabase
    .from('users')
    .select('*') // Select all columns
    .eq('id', userData.user.id)
    .maybeSingle(); // Returns null if no record found

  // Handle query errors
  if (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: 'Unable to load your profile.'
    };
  }

  return {
    success: true,
    profile: data as User
  };
}

/**
 * NEW: Helper to extract university from email
 * Parses university name from email domain
 * Duplicates logic from utils/emailValidation.ts - consider importing instead
 */
function extractUniversityFromEmail(email: string): string {
  // Extract domain portion after @ symbol
  const domain = email.split('@')[1] || '';
  
  // Remove university domain suffixes
  let university = domain
    .replace('.edu', '')
    .replace('.ac.uk', '')
    .replace('.edu.au', '')
    .replace('.ca', '');

  // Capitalize first letter of each word and handle subdomains
  // Example: "stanford.edu" becomes "Stanford"
  // Example: "cs.stanford.edu" becomes "Cs Stanford"
  university = university
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return university;
}