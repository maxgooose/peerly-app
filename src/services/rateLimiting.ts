// =====================================================
// RATE LIMITING SERVICE - PHASE 4
// =====================================================
// Service for checking and enforcing rate limits
// Prevents spam and abuse by limiting user actions

import { supabase } from './supabase';

export interface RateLimitConfig {
  action: string;
  limit: number;
  window: string; // PostgreSQL interval format (e.g., '1 hour', '1 day')
}

// Predefined rate limits for different actions
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  SEND_MESSAGE: {
    action: 'message_sent',
    limit: 50, // 50 messages per hour
    window: '1 hour'
  },
  CREATE_MATCH: {
    action: 'match_created',
    limit: 10, // 10 matches per day
    window: '1 day'
  },
  SWIPE_ACTION: {
    action: 'swipe_action',
    limit: 100, // 100 swipes per hour
    window: '1 hour'
  },
  UPLOAD_IMAGE: {
    action: 'image_uploaded',
    limit: 20, // 20 images per hour
    window: '1 hour'
  },
  UPDATE_PROFILE: {
    action: 'profile_updated',
    limit: 5, // 5 profile updates per day
    window: '1 day'
  }
};

/**
 * Check if user is within rate limit for a specific action
 * @param userId - User ID to check
 * @param config - Rate limit configuration
 * @returns Promise<boolean> - true if within limit, false if exceeded
 */
export async function checkRateLimit(
  userId: string, 
  config: RateLimitConfig
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_action: config.action,
      p_limit: config.limit,
      p_window: config.window
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the action (fail open for better UX)
      return true;
    }

    return data === true;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // On exception, allow the action (fail open for better UX)
    return true;
  }
}

/**
 * Check rate limit using predefined configuration
 * @param userId - User ID to check
 * @param actionKey - Key from RATE_LIMITS object
 * @returns Promise<boolean> - true if within limit, false if exceeded
 */
export async function checkRateLimitByKey(
  userId: string,
  actionKey: keyof typeof RATE_LIMITS
): Promise<boolean> {
  const config = RATE_LIMITS[actionKey];
  if (!config) {
    console.error(`Unknown rate limit key: ${actionKey}`);
    return true; // Allow action if config not found
  }

  return checkRateLimit(userId, config);
}

/**
 * Record an action in analytics for rate limiting
 * This should be called after successful actions
 * @param userId - User ID
 * @param action - Action type
 * @param metadata - Optional metadata
 */
export async function recordAction(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: action,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('Error recording action:', error);
    // Don't throw - analytics failures shouldn't break user actions
  }
}
