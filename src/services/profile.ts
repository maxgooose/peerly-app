// =====================================================
// PROFILE SERVICE - Settings Page Phase 1
// =====================================================
// Service for managing user profile data
// Handles profile fetching, updates, and account deactivation

import { supabase } from './supabase';
import type { WeeklyAvailability } from './supabase';
import { sanitizeName, sanitizeProfileText, sanitizeSubject } from '../utils/sanitization';

// =====================================================
// Type Definitions
// =====================================================

/**
 * Complete user profile data structure
 * Matches the users table schema from Supabase
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  has_profile_photo: boolean;
  preferred_subjects: string[] | null;
  availability: WeeklyAvailability | null;
  study_style: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null;
  study_goals: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null;
  badge_display_preference: 'show_all' | 'show_primary' | 'hide_all';
  primary_badge_id: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Profile update payload
 * All fields are optional to allow partial updates
 */
export interface ProfileUpdate {
  full_name?: string;
  bio?: string;
  major?: string;
  year?: string;
  preferred_subjects?: string[];
  availability?: WeeklyAvailability;
  study_style?: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null;
  study_goals?: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null;
  badge_display_preference?: 'show_all' | 'show_primary' | 'hide_all';
  primary_badge_id?: string | null;
}

/**
 * Standard service response structure
 */
export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface ProfileUpdateResult extends ServiceResult {
  data?: UserProfile;
}

/**
 * Profile fetch response with data
 */
export interface ProfileResult extends ServiceResult {
  data?: UserProfile;
}

// =====================================================
// Service Functions
// =====================================================

/**
 * Fetch current user's complete profile data
 * @param userId - User's UUID from auth
 * @returns Profile data or error message
 */
export async function getUserProfile(userId: string): Promise<ProfileResult> {
  try {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: 'Invalid user ID provided.',
      };
    }

    // Fetch profile from database
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        university,
        major,
        year,
        bio,
        profile_photo_url,
        has_profile_photo,
        preferred_subjects,
        availability,
        study_style,
        study_goals,
        badge_display_preference,
        primary_badge_id,
        is_active,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: 'Failed to load profile. Please try again.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Profile not found.',
      };
    }

    return {
      success: true,
      data: data as UserProfile,
    };
  } catch (error) {
    console.error('Exception in getUserProfile:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading your profile.',
    };
  }
}

/**
 * Update user profile with validation and sanitization
 * @param userId - User's UUID from auth
 * @param updates - Partial profile updates to apply
 * @returns Success status and error message if applicable
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ProfileUpdateResult> {
  try {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: 'Invalid user ID provided.',
      };
    }

    // Validate that at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: 'No updates provided.',
      };
    }

    // Sanitize and validate inputs
    const sanitizedUpdates: Partial<ProfileUpdate> = {};

    // Full name - required field, must not be empty after sanitization
    if (updates.full_name !== undefined) {
      const sanitizedName = sanitizeName(updates.full_name);
      if (!sanitizedName.trim()) {
        return {
          success: false,
          error: 'Full name cannot be empty.',
        };
      }
      sanitizedUpdates.full_name = sanitizedName;
    }

    // Bio - optional field, max 200 characters
    if (updates.bio !== undefined) {
      sanitizedUpdates.bio = sanitizeProfileText(updates.bio, 200);
    }

    // Major - required field if provided
    if (updates.major !== undefined) {
      const sanitizedMajor = sanitizeName(updates.major, 100);
      if (!sanitizedMajor.trim()) {
        return {
          success: false,
          error: 'Major cannot be empty.',
        };
      }
      sanitizedUpdates.major = sanitizedMajor;
    }

    // Year - required field if provided
    if (updates.year !== undefined) {
      const validYears = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
      if (!validYears.includes(updates.year)) {
        return {
          success: false,
          error: 'Invalid academic year selected.',
        };
      }
      sanitizedUpdates.year = updates.year;
    }

    // Preferred subjects - sanitize each subject
    if (updates.preferred_subjects !== undefined) {
      if (!Array.isArray(updates.preferred_subjects)) {
        return {
          success: false,
          error: 'Preferred subjects must be an array.',
        };
      }
      sanitizedUpdates.preferred_subjects = updates.preferred_subjects
        .map((subject) => sanitizeSubject(subject))
        .filter((subject) => subject.trim().length > 0);
    }

    // Study style - validate enum values
    if (updates.study_style !== undefined) {
      const validStyles = ['quiet', 'with_music', 'group_discussion', 'teach_each_other', null];
      if (!validStyles.includes(updates.study_style)) {
        return {
          success: false,
          error: 'Invalid study style selected.',
        };
      }
      sanitizedUpdates.study_style = updates.study_style;
    }

    // Study goals - validate enum values
    if (updates.study_goals !== undefined) {
      const validGoals = ['ace_exams', 'understand_concepts', 'just_pass', 'make_friends', null];
      if (!validGoals.includes(updates.study_goals)) {
        return {
          success: false,
          error: 'Invalid study goals selected.',
        };
      }
      sanitizedUpdates.study_goals = updates.study_goals;
    }

    // Badge display preference - validate enum values
    if (updates.badge_display_preference !== undefined) {
      const validPreferences = ['show_all', 'show_primary', 'hide_all'];
      if (!validPreferences.includes(updates.badge_display_preference)) {
        return {
          success: false,
          error: 'Invalid badge display preference selected.',
        };
      }
      sanitizedUpdates.badge_display_preference = updates.badge_display_preference;
    }

    // Primary badge ID - no sanitization needed for UUID
    if (updates.primary_badge_id !== undefined) {
      sanitizedUpdates.primary_badge_id = updates.primary_badge_id;
    }

// Availability - no sanitization needed, just pass through
    if (updates.availability !== undefined) {
      sanitizedUpdates.availability = updates.availability;
    }

    // Update profile in database and return the updated row for sync
    const { data, error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        university,
        major,
        year,
        bio,
        profile_photo_url,
        has_profile_photo,
        preferred_subjects,
        availability,
        study_style,
        study_goals,
        badge_display_preference,
        primary_badge_id,
        is_active,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: 'Failed to update profile. Please try again.',
      };
    }

    return {
      success: true,
      data: data as UserProfile,
    };
  } catch (error) {
    console.error('Exception in updateProfile:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating your profile.',
    };
  }
}

/**
 * Soft delete user account by setting is_active to false
 * This preserves user data but prevents login and matching
 * @param userId - User's UUID from auth
 * @returns Success status and error message if applicable
 */
export async function deactivateAccount(userId: string): Promise<ServiceResult> {
  try {
    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: 'Invalid user ID provided.',
      };
    }