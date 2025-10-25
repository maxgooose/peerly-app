import { supabase } from './supabase';
import type { User } from './supabase';
import { getOrCreateConversation } from './chat';

// Simplified availability type - just time of day
export type AvailabilitySlot = 'morning' | 'afternoon' | 'evening' | 'none';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CompatibilityScore {
  total: number;
  breakdown: {
    universityMatch: number;
    subjectOverlap: number;
    availabilityOverlap: number;
    studyStyleMatch: number;
    studyGoalsMatch: number;
    yearProximity: number;
  };
  // Success tracking and decay factors
  freshnessBonus?: number;
  successPenalty?: number;
  adjustedTotal?: number;
}

export interface MatchCandidate {
  user: User;
  score: CompatibilityScore;
}

/**
 * Calculate compatibility score between two users
 * Total possible: 100 points
 */
export function calculateCompatibilityScore(user1: User, user2: User): CompatibilityScore {
  const breakdown = {
    universityMatch: scoreUniversityMatch(user1, user2),
    subjectOverlap: scoreSubjectOverlap(user1, user2),
    availabilityOverlap: scoreAvailabilityOverlap(user1, user2),
    studyStyleMatch: scoreStudyStyleMatch(user1, user2),
    studyGoalsMatch: scoreStudyGoalsMatch(user1, user2),
    yearProximity: scoreYearProximity(user1, user2),
  };

  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

  return { total, breakdown };
}

/**
 * University Match: 20 points
 * Must be same university (non-negotiable for auto-match)
 */
function scoreUniversityMatch(user1: User, user2: User): number {
  if (!user1.university || !user2.university) return 0;
  return user1.university.toLowerCase() === user2.university.toLowerCase() ? 20 : 0;
}

/**
 * Subject Overlap: 30 points
 * Most important factor - shared subjects mean they can actually study together
 */
function scoreSubjectOverlap(user1: User, user2: User): number {
  const subjects1 = user1.preferred_subjects || [];
  const subjects2 = user2.preferred_subjects || [];

  if (subjects1.length === 0 || subjects2.length === 0) return 0;

  // Normalize subjects to lowercase for comparison
  const normalized1 = subjects1.map(s => s.toLowerCase().trim());
  const normalized2 = subjects2.map(s => s.toLowerCase().trim());

  // Count shared subjects
  const sharedCount = normalized1.filter(s => normalized2.includes(s)).length;

  if (sharedCount === 0) return 0;

  // Score based on overlap ratio
  const minLength = Math.min(subjects1.length, subjects2.length);
  const overlapRatio = sharedCount / minLength;

  return Math.round(overlapRatio * 30);
}

/**
 * Availability Overlap: 20 points
 * Check if they have overlapping free time
 */
function scoreAvailabilityOverlap(user1: User, user2: User): number {
  const avail1 = user1.availability;
  const avail2 = user2.availability;

  // If either hasn't set availability, give neutral score
  if (!avail1 || !avail2) return 10;

  const days: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let overlappingSlots = 0;
  let totalSlots = 0;

  for (const day of days) {
    const slot1 = (avail1 as any)[day];
    const slot2 = (avail2 as any)[day];

    if (slot1 && slot1 !== 'none') totalSlots++;
    if (slot2 && slot2 !== 'none') totalSlots++;

    // Check if both have same time slot available
    if (slot1 && slot2 && slot1 === slot2 && slot1 !== 'none') {
      overlappingSlots++;
    }
  }

  if (totalSlots === 0) return 10; // Both empty, neutral

  // Score based on overlap
  const overlapRatio = overlappingSlots / (totalSlots / 2);
  return Math.round(Math.min(overlapRatio, 1) * 20);
}

/**
 * Study Style Match: 15 points
 * Preference for how they like to study
 */
function scoreStudyStyleMatch(user1: User, user2: User): number {
  const style1 = user1.study_style;
  const style2 = user2.study_style;

  // If either hasn't set, give neutral score
  if (!style1 || !style2) return 7;

  // Exact match is best
  if (style1 === style2) return 15;

  // Compatible styles
  const compatible = [
    ['quiet', 'with_music'],
    ['group_discussion', 'teach_each_other'],
  ];

  for (const pair of compatible) {
    if (
      (pair.includes(style1) && pair.includes(style2))
    ) {
      return 10;
    }
  }

  // Different but not incompatible
  return 5;
}

/**
 * Study Goals Match: 10 points
 * What they want to achieve
 */
function scoreStudyGoalsMatch(user1: User, user2: User): number {
  const goal1 = user1.study_goals;
  const goal2 = user2.study_goals;

  // If either hasn't set, give neutral score
  if (!goal1 || !goal2) return 5;

  // Exact match
  if (goal1 === goal2) return 10;

  // Compatible goals
  const compatible = [
    ['ace_exams', 'understand_concepts'],
  ];

  for (const pair of compatible) {
    if (pair.includes(goal1) && pair.includes(goal2)) {
      return 8;
    }
  }

  // Incompatible (e.g., ace_exams + just_pass)
  if (
    (goal1 === 'ace_exams' && goal2 === 'just_pass') ||
    (goal1 === 'just_pass' && goal2 === 'ace_exams')
  ) {
    return 2;
  }

  // Different but okay
  return 5;
}

/**
 * Year Proximity: 5 points
 * Prefer students in similar academic stages
 */
function scoreYearProximity(user1: User, user2: User): number {
  const year1 = user1.year?.toLowerCase();
  const year2 = user2.year?.toLowerCase();

  if (!year1 || !year2) return 2;

  const yearOrder = ['freshman', 'sophomore', 'junior', 'senior'];
  const idx1 = yearOrder.indexOf(year1);
  const idx2 = yearOrder.indexOf(year2);

  if (idx1 === -1 || idx2 === -1) return 2;

  const distance = Math.abs(idx1 - idx2);

  if (distance === 0) return 5; // Same year
  if (distance === 1) return 4; // Adjacent year
  if (distance === 2) return 2; // One year apart
  return 1; // Two+ years apart
}

/**
 * Freshness Bonus: Up to +15 points
 * Prioritize users who are new to the platform or haven't been matched recently
 * Decay factor reduces bonus based on number of previous matches
 */
function calculateFreshnessBonus(user: User): number {
  const totalMatches = (user as any).total_matches || 0;

  // New users (0 matches) get full bonus
  if (totalMatches === 0) return 15;

  // Apply exponential decay based on total matches
  // 1 match: 12 points
  // 2 matches: 9 points
  // 3 matches: 7 points
  // 5+ matches: 3 points
  const decayFactor = Math.exp(-totalMatches * 0.3);
  return Math.round(15 * decayFactor);
}

/**
 * Success Penalty: Up to -10 points
 * Penalize users with low success rates in previous matches
 * Helps avoid matching users who don't engage well
 */
function calculateSuccessPenalty(user: User): number {
  const totalMatches = (user as any).total_matches || 0;
  const successfulMatches = (user as any).successful_matches || 0;
  const avgMessages = (user as any).avg_messages_per_match || 0;

  // No penalty for new users
  if (totalMatches === 0) return 0;

  // Calculate success rate
  const successRate = successfulMatches / totalMatches;

  // Penalty based on success rate
  // 80%+ success: No penalty (0 points)
  // 50-80% success: Small penalty (-3 points)
  // 20-50% success: Medium penalty (-6 points)
  // <20% success: Large penalty (-10 points)
  let penalty = 0;

  if (successRate >= 0.8) {
    penalty = 0;
  } else if (successRate >= 0.5) {
    penalty = -3;
  } else if (successRate >= 0.2) {
    penalty = -6;
  } else {
    penalty = -10;
  }

  // Additional penalty if user has very low engagement (< 3 avg messages)
  if (avgMessages < 3 && totalMatches >= 2) {
    penalty -= 5;
  }

  return Math.max(-15, penalty); // Cap penalty at -15
}

/**
 * Calculate adjusted compatibility score with freshness and success factors
 */
export function calculateAdjustedCompatibilityScore(
  user1: User,
  user2: User
): CompatibilityScore {
  // Base compatibility score
  const baseScore = calculateCompatibilityScore(user1, user2);

  // Calculate freshness bonuses (prioritize fresh matches)
  const user1Freshness = calculateFreshnessBonus(user1);
  const user2Freshness = calculateFreshnessBonus(user2);
  const avgFreshness = (user1Freshness + user2Freshness) / 2;

  // Calculate success penalties (avoid users with poor track records)
  const user1Penalty = calculateSuccessPenalty(user1);
  const user2Penalty = calculateSuccessPenalty(user2);
  const avgPenalty = (user1Penalty + user2Penalty) / 2;

  // Adjusted total score
  const adjustedTotal = Math.round(
    baseScore.total + avgFreshness + avgPenalty
  );

  return {
    ...baseScore,
    freshnessBonus: Math.round(avgFreshness),
    successPenalty: Math.round(avgPenalty),
    adjustedTotal: Math.max(0, adjustedTotal), // Ensure non-negative
  };
}

/**
 * Get eligible users for auto-matching
 * Users who have completed onboarding and haven't been auto-matched in 24 hours
 * Includes match statistics for success tracking and decay factors
 */
export async function getEligibleUsers(): Promise<User[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      total_matches,
      successful_matches,
      avg_messages_per_match
    `)
    .eq('onboarding_completed', true)
    .or(`last_auto_match_cycle.is.null,last_auto_match_cycle.lt.${twentyFourHoursAgo}`);

  if (error) {
    console.error('Error fetching eligible users:', error);
    return [];
  }

  return (data || []) as User[];
}

/**
 * Check if two users have already matched
 */
async function haveAlreadyMatched(user1Id: string, user2Id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .limit(1);

  if (error) {
    console.error('Error checking existing match:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Find best auto-match for a user from a pool of candidates
 * Returns null if no suitable match found (adjusted score < 40)
 * Uses adjusted scoring with freshness bonus and success penalty
 */
export async function findBestMatch(
  user: User,
  candidates: User[],
  usedIds: Set<string>
): Promise<MatchCandidate | null> {
  const MINIMUM_SCORE = 40;

  // Filter out invalid candidates
  const validCandidates = candidates.filter(
    (c) =>
      c.id !== user.id && // Not self
      !usedIds.has(c.id) && // Not already matched this cycle
      c.university === user.university // Must be same university
  );

  // Score all candidates with adjusted scoring
  const scored: MatchCandidate[] = [];

  for (const candidate of validCandidates) {
    // Check if already matched before
    const alreadyMatched = await haveAlreadyMatched(user.id, candidate.id);
    if (alreadyMatched) continue;

    // Use adjusted score that includes freshness and success factors
    const score = calculateAdjustedCompatibilityScore(user, candidate);

    // Use adjustedTotal for threshold check (prioritizes fresh matches)
    const finalScore = score.adjustedTotal ?? score.total;

    // Must meet minimum threshold
    if (finalScore >= MINIMUM_SCORE) {
      scored.push({ user: candidate, score });
    }
  }

  // Sort by adjusted score descending (prioritizes fresh, successful users)
  scored.sort((a, b) => {
    const scoreA = a.score.adjustedTotal ?? a.score.total;
    const scoreB = b.score.adjustedTotal ?? b.score.total;
    return scoreB - scoreA;
  });

  // Log top match details for debugging
  if (scored[0]) {
    console.log('Best match found:', {
      candidate: scored[0].user.full_name,
      baseScore: scored[0].score.total,
      freshnessBonus: scored[0].score.freshnessBonus,
      successPenalty: scored[0].score.successPenalty,
      adjustedScore: scored[0].score.adjustedTotal,
    });
  }

  // Return best match or null
  return scored[0] || null;
}

/**
 * Create a match record in the database
 */
export async function createMatch(
  user1Id: string,
  user2Id: string,
  matchType: 'auto' | 'manual',
  compatibilityScore?: CompatibilityScore
): Promise<string | null> {
  // Create match
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      match_type: matchType,
      status: 'active',
    })
    .select()
    .single();

  if (matchError || !matchData) {
    console.error('Error creating match:', matchError);
    return null;
  }

  // Store analytics if score provided
  if (compatibilityScore) {
    await supabase.from('match_analytics').insert({
      match_id: matchData.id,
      compatibility_score: compatibilityScore.total,
      score_breakdown: compatibilityScore.breakdown,
    });
  }

  return matchData.id;
}

/**
 * Update user's last auto-match cycle timestamp
 */
export async function updateLastAutoMatchCycle(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ last_auto_match_cycle: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Update match statistics after a message is sent
 * Increments message count and updates last_message_at
 */
export async function updateMatchMessageStats(matchId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_match_messages', {
    p_match_id: matchId,
  });

  if (error) {
    console.error('Error updating match message stats:', error);
  }
}

/**
 * Mark that a study session was scheduled for this match
 */
export async function markStudySessionScheduled(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ study_session_scheduled: true })
    .eq('id', matchId);

  if (error) {
    console.error('Error marking study session scheduled:', error);
  }
}

/**
 * Update user match statistics
 * Should be called periodically or after significant events
 */
export async function refreshUserMatchStats(userId: string): Promise<void> {
  const { error } = await supabase.rpc('update_user_match_stats', {
    user_id: userId,
  });

  if (error) {
    console.error('Error refreshing user match stats:', error);
  }
}

/**
 * Main auto-matching algorithm
 * Runs daily to create one match per user
 */
export async function runAutoMatching(): Promise<{
  success: boolean;
  matchesCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let matchesCreated = 0;

  try {
    // Get all eligible users
    const eligible = await getEligibleUsers();
    console.log(`Found ${eligible.length} eligible users for auto-matching`);

    if (eligible.length < 2) {
      return { success: true, matchesCreated: 0, errors: ['Not enough eligible users'] };
    }

    // Track which users have been matched this cycle
    const usedIds = new Set<string>();

    // Process each user
    for (const user of eligible) {
      if (usedIds.has(user.id)) continue;

      // Find best match for this user
      const bestMatch = await findBestMatch(user, eligible, usedIds);

      if (!bestMatch) {
        console.log(`No suitable match found for user ${user.id}`);
        continue;
      }

      console.log(
        `Matching ${user.full_name} with ${bestMatch.user.full_name}`,
        `(base: ${bestMatch.score.total}, adjusted: ${bestMatch.score.adjustedTotal})`
      );

      // Create the match
      const matchId = await createMatch(user.id, bestMatch.user.id, 'auto', bestMatch.score);

      if (matchId) {
        // Create conversation for the match
        const conversationId = await getOrCreateConversation(matchId);

        if (!conversationId) {
          errors.push(`Failed to create conversation for match ${matchId}`);
        } else {
          console.log(`Created conversation ${conversationId} for match ${matchId}`);
        }

        // Mark both users as used
        usedIds.add(user.id);
        usedIds.add(bestMatch.user.id);

        // Update last match cycle for both users
        await updateLastAutoMatchCycle(user.id);
        await updateLastAutoMatchCycle(bestMatch.user.id);

        matchesCreated++;
      } else {
        errors.push(`Failed to create match between ${user.id} and ${bestMatch.user.id}`);
      }
    }

    return { success: true, matchesCreated, errors };
  } catch (error) {
    console.error('Auto-matching error:', error);
    return {
      success: false,
      matchesCreated,
      errors: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
