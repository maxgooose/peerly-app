// Supabase Edge Function for Auto-Matching
// Runs on a schedule to match compatible users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function jsonResponse(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper function to send push notification
async function sendPushNotification(params: {
  expoPushToken: string;
  title: string;
  body: string;
  data?: any;
}): Promise<boolean> {
  try {
    const message = {
      to: params.expoPushToken,
      sound: 'default',
      title: params.title,
      body: params.body,
      data: params.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Types
interface User {
  id: string;
  email: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  year: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  preferred_subjects: string[] | null;
  availability: any | null;
  study_style: string | null;
  study_goals: string | null;
  push_token: string | null;
  last_auto_match_cycle: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
}

interface CompatibilityScore {
  total: number;
  breakdown: {
    universityMatch: number;
    subjectOverlap: number;
    availabilityOverlap: number;
    studyStyleMatch: number;
    studyGoalsMatch: number;
    yearProximity: number;
  };
}

// Scoring functions (same as matching.ts)
function scoreUniversityMatch(user1: User, user2: User): number {
  if (!user1.university || !user2.university) return 0;
  return user1.university.toLowerCase() === user2.university.toLowerCase() ? 20 : 0;
}

function scoreSubjectOverlap(user1: User, user2: User): number {
  const subjects1 = user1.preferred_subjects || [];
  const subjects2 = user2.preferred_subjects || [];

  if (subjects1.length === 0 || subjects2.length === 0) return 0;

  const normalized1 = subjects1.map(s => s.toLowerCase().trim());
  const normalized2 = subjects2.map(s => s.toLowerCase().trim());

  const sharedCount = normalized1.filter(s => normalized2.includes(s)).length;
  if (sharedCount === 0) return 0;

  const minLength = Math.min(subjects1.length, subjects2.length);
  const overlapRatio = sharedCount / minLength;

  return Math.round(overlapRatio * 30);
}

function scoreAvailabilityOverlap(user1: User, user2: User): number {
  const avail1 = user1.availability;
  const avail2 = user2.availability;

  if (!avail1 || !avail2) return 10;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let overlappingSlots = 0;
  let totalSlots = 0;

  for (const day of days) {
    const slot1 = avail1[day];
    const slot2 = avail2[day];

    if (slot1 && slot1 !== 'none') totalSlots++;
    if (slot2 && slot2 !== 'none') totalSlots++;

    if (slot1 && slot2 && slot1 === slot2 && slot1 !== 'none') {
      overlappingSlots++;
    }
  }

  if (totalSlots === 0) return 10;

  const overlapRatio = overlappingSlots / (totalSlots / 2);
  return Math.round(Math.min(overlapRatio, 1) * 20);
}

function scoreStudyStyleMatch(user1: User, user2: User): number {
  const style1 = user1.study_style;
  const style2 = user2.study_style;

  if (!style1 || !style2) return 7;
  if (style1 === style2) return 15;

  const compatible = [
    ['quiet', 'with_music'],
    ['group_discussion', 'teach_each_other'],
  ];

  for (const pair of compatible) {
    if (pair.includes(style1) && pair.includes(style2)) {
      return 10;
    }
  }

  return 5;
}

function scoreStudyGoalsMatch(user1: User, user2: User): number {
  const goal1 = user1.study_goals;
  const goal2 = user2.study_goals;

  if (!goal1 || !goal2) return 5;
  if (goal1 === goal2) return 10;

  const compatible = [['ace_exams', 'understand_concepts']];

  for (const pair of compatible) {
    if (pair.includes(goal1) && pair.includes(goal2)) {
      return 8;
    }
  }

  if (
    (goal1 === 'ace_exams' && goal2 === 'just_pass') ||
    (goal1 === 'just_pass' && goal2 === 'ace_exams')
  ) {
    return 2;
  }

  return 5;
}

function scoreYearProximity(user1: User, user2: User): number {
  const year1 = user1.year?.toLowerCase();
  const year2 = user2.year?.toLowerCase();

  if (!year1 || !year2) return 2;

  const yearOrder = ['freshman', 'sophomore', 'junior', 'senior'];
  const idx1 = yearOrder.indexOf(year1);
  const idx2 = yearOrder.indexOf(year2);

  if (idx1 === -1 || idx2 === -1) return 2;

  const distance = Math.abs(idx1 - idx2);

  if (distance === 0) return 5;
  if (distance === 1) return 4;
  if (distance === 2) return 2;
  return 1;
}

function calculateCompatibilityScore(user1: User, user2: User): CompatibilityScore {
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

// Main handler
Deno.serve(async (req) => {
  try {
    // Verify this is a cron request (optional - add authorization header check)
    const authHeader = req.headers.get('Authorization');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting auto-match cycle...');

    // Get eligible users (onboarding complete, not matched in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: eligibleUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('onboarding_completed', true)
      .or(`last_auto_match_cycle.is.null,last_auto_match_cycle.lt.${twentyFourHoursAgo}`);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const eligible = (eligibleUsers || []) as User[];
    console.log(`Found ${eligible.length} eligible users`);

    if (eligible.length < 2) {
      return jsonResponse({ success: true, matchesCreated: 0, message: 'Not enough eligible users' });
    }

    const usedIds = new Set<string>();
    let matchesCreated = 0;
    const errors: string[] = [];

    // Match users
    for (const user of eligible) {
      if (usedIds.has(user.id)) continue;

      // Find candidates (same university, not already matched)
      const candidates = eligible.filter(
        (c) =>
          c.id !== user.id &&
          !usedIds.has(c.id) &&
          c.university === user.university
      );

      if (candidates.length === 0) continue;

      // Score all candidates
      const scored = [];
      for (const candidate of candidates) {
        // Check if already matched
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${candidate.id}),and(user1_id.eq.${candidate.id},user2_id.eq.${user.id})`
          )
          .limit(1);

        if (existingMatch && existingMatch.length > 0) continue;

        const score = calculateCompatibilityScore(user, candidate);
        if (score.total >= 40) {
          scored.push({ candidate, score });
        }
      }

      if (scored.length === 0) continue;

      // Sort by score and get best match
      scored.sort((a, b) => b.score.total - a.score.total);
      const bestMatch = scored[0];

      console.log(
        `Matching ${user.full_name} with ${bestMatch.candidate.full_name} (score: ${bestMatch.score.total})`
      );

      // Create match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          user1_id: user.id,
          user2_id: bestMatch.candidate.id,
          match_type: 'auto',
          status: 'active',
        })
        .select()
        .single();

      if (matchError || !matchData) {
        errors.push(`Failed to create match: ${matchError?.message}`);
        continue;
      }

      // Create analytics
      await supabase.from('match_analytics').insert({
        match_id: matchData.id,
        compatibility_score: bestMatch.score.total,
        score_breakdown: bestMatch.score.breakdown,
      });

      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({ match_id: matchData.id })
        .select()
        .single();

      if (convError) {
        errors.push(`Failed to create conversation: ${convError.message}`);
      } else {
        console.log(`Created conversation ${convData.id}`);

        // Attempt to generate and send an AI first message (fallback if no Gemini key)
        try {
          if (!matchData.ai_message_sent) {
            const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

            // Fetch user profiles for prompt context
            const { data: senderProfile, error: senderProfileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', matchData.user1_id)
              .single();
            const { data: recipientProfile, error: recipientProfileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', matchData.user2_id)
              .single();

            if (!senderProfileError && !recipientProfileError && senderProfile && recipientProfile) {
              // For now ignore Gemini: build a personalized fallback message locally
              const aiText = generateFallbackFirstMessage(senderProfile, recipientProfile);

              // Store the suggestion for analytics/caching (best-effort)
              const { data: suggestion } = await supabase
                .from('suggested_messages')
                .insert({
                  sender_id: matchData.user1_id,
                  recipient_id: matchData.user2_id,
                  message: aiText,
                })
                .select()
                .single();

              // Insert the actual AI message into the conversation
              const { error: insertMessageError } = await supabase
                .from('messages')
                .insert({
                  conversation_id: convData.id,
                  sender_id: matchData.user1_id,
                  content: aiText,
                  message_type: 'text',
                  status: 'sent',
                  is_ai_generated: true,
                  suggested_message_id: suggestion?.id || null,
                });

              if (!insertMessageError) {
                await supabase
                  .from('matches')
                  .update({ ai_message_sent: true })
                  .eq('id', matchData.id);
                console.log(`AI first message sent for match ${matchData.id}`);
              } else {
                console.error('Failed to insert AI message:', insertMessageError);
              }
            } else {
              console.error('Failed to fetch profiles for AI message', senderProfileError || recipientProfileError);
            }
          }
        } catch (e) {
          console.error('AI message generation step failed:', e);
        }
      }

      // Send push notifications to both users
      if (user.push_token) {
        await sendPushNotification({
          expoPushToken: user.push_token,
          title: 'New Study Match! 🎓',
          body: `You matched with ${bestMatch.candidate.full_name || 'a study buddy'}`,
          data: {
            type: 'new_match',
            matchId: matchData.id,
          },
        });
        console.log(`Sent notification to ${bestMatch.candidate.full_name}`);
      }

      // Update last match cycle
      await supabase
        .from('users')
        .update({ last_auto_match_cycle: new Date().toISOString() })
        .eq('id', user.id);

      await supabase
        .from('users')
        .update({ last_auto_match_cycle: new Date().toISOString() })
        .eq('id', bestMatch.candidate.id);

      // Mark both as used
      usedIds.add(user.id);
      usedIds.add(bestMatch.candidate.id);
      matchesCreated++;
    }

    console.log(`Auto-match cycle complete. Created ${matchesCreated} matches.`);

    return jsonResponse({
      success: true,
      matchesCreated,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Auto-match error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// -----------------------------------------------------------------------------
// Helper: Fallback first message generator (no external API required)
// Brief, under 10 words, first-text style
// -----------------------------------------------------------------------------
function generateFallbackFirstMessage(sender: any, recipient: any): string {
  // Handle both 'preferred_subjects' (users table) and 'courses' (profiles table)
  const senderCourses: string[] = Array.isArray(sender?.preferred_subjects) 
    ? sender.preferred_subjects 
    : (Array.isArray(sender?.courses) ? sender.courses : []);
  const recipientCourses: string[] = Array.isArray(recipient?.preferred_subjects)
    ? recipient.preferred_subjects
    : (Array.isArray(recipient?.courses) ? recipient.courses : []);

  const commonCourses = senderCourses.filter((c) => recipientCourses.includes(c));

  // Generate brief message (under 10 words)
  if (commonCourses.length > 0) {
    // Use first shared course
    return `Study ${commonCourses[0]} together?`;
  }

  // Fallback if no shared courses