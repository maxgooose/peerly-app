import { supabase } from './supabase';

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  priority: number;
}

export interface UserBadge extends Badge {
  verified: boolean;
  verified_at: string;
}

export interface BadgeAssignment {
  user_id: string;
  badge_id: string;
  verified_by?: string;
  notes?: string;
}

/**
 * Get all available badge types
 */
export async function getAllBadges(): Promise<{
  success: boolean;
  badges?: Badge[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching badges:', error);
    return {
      success: false,
      error: 'Failed to load badges',
    };
  }

  return {
    success: true,
    badges: data as Badge[],
  };
}

/**
 * Get badges for a specific user
 */
export async function getUserBadges(userId: string): Promise<{
  success: boolean;
  badges?: UserBadge[];
  error?: string;
}> {
  const { data, error } = await supabase.rpc('get_user_badges', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user badges:', error);
    return {
      success: false,
      error: 'Failed to load user badges',
    };
  }

  return {
    success: true,
    badges: data?.map((item: any) => ({
      id: item.badge_id,
      name: item.badge_name,
      icon: item.badge_icon,
      color: item.badge_color,
      priority: item.badge_priority,
      verified: item.verified,
      verified_at: item.verified_at,
    })) || [],
  };
}

/**
 * Assign a badge to a user (admin only)
 */
export async function assignBadge(
  assignment: BadgeAssignment
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('assign_badge', {
    p_user_id: assignment.user_id,
    p_badge_id: assignment.badge_id,
    p_verified_by: assignment.verified_by || null,
    p_notes: assignment.notes || null,
  });

  if (error || !data) {
    console.error('Error assigning badge:', error);
    return {
      success: false,
      error: 'Failed to assign badge',
    };
  }

  return { success: true };
}

/**
 * Remove a badge from a user (admin only)
 */
export async function removeBadge(
  userId: string,
  badgeId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('remove_badge', {
    p_user_id: userId,
    p_badge_id: badgeId,
  });

  if (error || !data) {
    console.error('Error removing badge:', error);
    return {
      success: false,
      error: 'Failed to remove badge',
    };
  }

  return { success: true };
}

/**
 * Update user's badge display preference
 */
export async function updateBadgeDisplayPreference(
  userId: string,
  preference: 'show_all' | 'show_primary' | 'hide_all'
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { error } = await supabase
    .from('users')
    .update({ badge_display_preference: preference })
    .eq('id', userId);

  if (error) {
    console.error('Error updating badge preference:', error);
    return {
      success: false,
      error: 'Failed to update badge display preference',
    };
  }

  return { success: true };
}

/**
 * Set user's primary badge
 */
export async function setPrimaryBadge(
  userId: string,
  badgeId: string | null
): Promise<{
  success: boolean;
  error?: string;
}> {
  const { error } = await supabase
    .from('users')
    .update({ primary_badge_id: badgeId })
    .eq('id', userId);

  if (error) {
    console.error('Error setting primary badge:', error);
    return {
      success: false,
      error: 'Failed to set primary badge',
    };
  }

  return { success: true };
}

/**
 * Helper to get display badges based on user preference
 */
export function getDisplayBadges(
  userBadges: UserBadge[],
  preference: 'show_all' | 'show_primary' | 'hide_all',
  primaryBadgeId?: string | null
): UserBadge[] {
  if (preference === 'hide_all') {
    return [];
  }

  if (preference === 'show_primary' && primaryBadgeId) {
    const primaryBadge = userBadges.find(b => b.id === primaryBadgeId);
    return primaryBadge ? [primaryBadge] : [];
  }

  // show_all (default)
  return userBadges;
}

/**
 * Helper to check if user has a specific badge
 */
export function hasBadge(userBadges: UserBadge[], badgeId: string): boolean {
  return userBadges.some(b => b.id === badgeId);
}
