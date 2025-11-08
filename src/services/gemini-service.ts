/**
 * Gemini AI Service for Peerly
 * 
 * Core service for generating personalized first messages between matched study buddies
 * using Google Gemini 1.5 Flash model for profile analysis and message generation.
 * 
 * @module gemini-service
 */

// ==============================================================================
// DEPENDENCIES
// ==============================================================================
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==============================================================================
// API INITIALIZATION
// ==============================================================================

// Initialize Gemini API client 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configure Gemini 1.5 Flash model for faster, cost-effective responses
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

/**
 * User profile structure matching Supabase profiles table
 * Contains academic info, study preferences, and optional personal details
 */
export interface UserProfile {
  id: string;
  name: string;
  major: string;
  year: number;                          // 1=Freshman, 2=Sophomore, 3=Junior, 4=Senior, 5+=Graduate
  courses: string[];
  interests: string[];
  studyPreferences: {
    location: string;                    // "library", "coffee shop", "online", "dorm"
    timeOfDay: string;                   // "morning", "afternoon", "evening", "night"
    groupSize: string;                   // "one-on-one", "small group", "large group"
  };
  bio?: string;
  goals?: string[];
}

/**
 * Result object returned by message generation functions
 * Includes success status, message content, and optional metadata
 */
export interface MessageGenerationResult {
  success: boolean;
  message?: string;
  error?: string;
  metadata?: {
    commonInterests: string[];
    suggestedTopics: string[];
    matchScore?: number;
  };
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Extracts commonalities and complementary aspects between two user profiles
 * Identifies shared courses, interests, and compatible study preferences
 * 
 * @param user1 - First user profile
 * @param user2 - Second user profile
 * @returns Object containing common courses, interests, and complementary aspects
 */
function extractMatchingPoints(user1: UserProfile, user2: UserProfile): {
  commonCourses: string[];
  commonInterests: string[];
  complementaryAspects: string[];
} {
  // Find courses present in both user profiles
  const commonCourses = user1.courses.filter(course => 
    user2.courses.includes(course)
  );

  // Find interests present in both user profiles
  const commonInterests = user1.interests.filter(interest => 
    user2.interests.includes(interest)
  );

  const complementaryAspects: string[] = [];
  
  // Check for matching study location preference
  if (user1.studyPreferences.location === user2.studyPreferences.location) {
    complementaryAspects.push(`Both prefer studying at ${user1.studyPreferences.location}`);
  }
  
  // Check for matching time preference
  if (user1.studyPreferences.timeOfDay === user2.studyPreferences.timeOfDay) {
    complementaryAspects.push(`Both prefer ${user1.studyPreferences.timeOfDay} study sessions`);
  }
  
  // Check for matching group size preference
  if (user1.studyPreferences.groupSize === user2.studyPreferences.groupSize) {
    complementaryAspects.push(`Both prefer ${user1.studyPreferences.groupSize} study format`);
  }

  // Check for mentorship opportunity based on year difference
  const yearDifference = Math.abs(user1.year - user2.year);
  if (yearDifference >= 2) {
    const mentor = user1.year > user2.year ? user1.name : user2.name;
    const mentee = user1.year > user2.year ? user2.name : user1.name;
    complementaryAspects.push(`${mentor} can mentor ${mentee} as a ${yearDifference}-year senior student`);
  }

  return { commonCourses, commonInterests, complementaryAspects };
}

/**
 * Constructs AI prompt for generating personalized first message
 * Includes user profiles, matching points, and generation guidelines
 * 
 * @param sender - User who will send the message
 * @param recipient - User who will receive the message
 * @param matchingPoints - Extracted commonalities and complementary aspects
 * @returns Formatted prompt string for Gemini API
 */
function constructPrompt(
  sender: UserProfile,
  recipient: UserProfile,
  matchingPoints: {
    commonCourses: string[];
    commonInterests: string[];
    complementaryAspects: string[];
  }
): string {
  return `You are helping a college student named ${sender.name} write a friendly first message to a potential study buddy named ${recipient.name}.

SENDER PROFILE:
- Name: ${sender.name}
- Major: ${sender.major}
- Year: ${sender.year}
- Courses: ${sender.courses.join(', ')}
- Interests: ${sender.interests.join(', ')}
- Study Preferences: ${sender.studyPreferences.location}, ${sender.studyPreferences.timeOfDay}, ${sender.studyPreferences.groupSize}
${sender.bio ? `- Bio: ${sender.bio}` : ''}
${sender.goals ? `- Goals: ${sender.goals.join(', ')}` : ''}

RECIPIENT PROFILE:
- Name: ${recipient.name}
- Major: ${recipient.major}
- Year: ${recipient.year}
- Courses: ${recipient.courses.join(', ')}
- Interests: ${recipient.interests.join(', ')}
- Study Preferences: ${recipient.studyPreferences.location}, ${recipient.studyPreferences.timeOfDay}, ${recipient.studyPreferences.groupSize}
${recipient.bio ? `- Bio: ${recipient.bio}` : ''}
${recipient.goals ? `- Goals: ${recipient.goals.join(', ')}` : ''}

WHAT THEY HAVE IN COMMON:
${matchingPoints.commonCourses.length > 0 ? `- Common Courses: ${matchingPoints.commonCourses.join(', ')}` : ''}
${matchingPoints.commonInterests.length > 0 ? `- Common Interests: ${matchingPoints.commonInterests.join(', ')}` : ''}
${matchingPoints.complementaryAspects.length > 0 ? `- Complementary Aspects: ${matchingPoints.complementaryAspects.join('; ')}` : ''}

INSTRUCTIONS:
Write a warm, friendly first message from ${sender.name} to ${recipient.name} that:

1. Naturally mentions 2-3 specific things they have in common
2. Sounds authentic and conversational (not robotic)
3. Shows genuine interest in connecting as study partners
4. Suggests a specific way to collaborate (study session, sharing notes, etc.)
5. Is 3-5 sentences long
6. Ends with a clear, friendly question or call to action
7. Uses casual college student language

IMPORTANT: 
- Write ONLY the message text
- Do NOT include greetings like "Subject:" or "Message:" headers
- Make it sound like a real message between college students
- Be specific about courses or interests they share
- Keep it warm but professional`;
}

// ==============================================================================
// CORE MESSAGE GENERATION
// ==============================================================================

/**
 * Generates personalized first message between two matched users
 * Uses Gemini AI to analyze profiles and create natural conversation starter
 * 
 * @param sender - User who will send the message
 * @param recipient - User who will receive the message
 * @returns Promise resolving to MessageGenerationResult with success status and message
 */
export async function generateFirstMessage(
  sender: UserProfile,
  recipient: UserProfile
): Promise<MessageGenerationResult> {
  try {
    // Extract matching points for prompt context
    const matchingPoints = extractMatchingPoints(sender, recipient);
    
    // Construct detailed prompt with profiles and matching points
    const prompt = constructPrompt(sender, recipient, matchingPoints);
    
    // Send request to Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const messageText = response.text();

    // Validate response contains actual content
    if (!messageText || messageText.trim().length === 0) {
      return {
        success: false,
        error: 'Generated message was empty',
      };
    }

    // Calculate compatibility score for metadata
    const matchScore = calculateCompatibilityScore(sender, recipient);
    
    // Combine common courses and interests for suggested topics
    const suggestedTopics = [
      ...matchingPoints.commonCourses,
      ...matchingPoints.commonInterests,
    ];

    // Return successful result with message and metadata
    return {
      success: true,
      message: messageText.trim(),
      metadata: {
        commonInterests: matchingPoints.commonInterests,
        suggestedTopics,
        matchScore,
      },
    };
  } catch (error) {
    // Handle API errors with descriptive message
    console.error('Error generating first message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// ==============================================================================
// BATCH PROCESSING
// ==============================================================================

/**
 * Generates first messages for multiple matches sequentially
 * Processes one recipient at a time with delays to avoid rate limiting
 * 
 * @param sender - User who will send messages
 * @param recipients - Array of matched users to generate messages for
 * @returns Promise resolving to Map of recipient ID to generation result
 */
export async function generateMultipleFirstMessages(
  sender: UserProfile,
  recipients: UserProfile[]
): Promise<Map<string, MessageGenerationResult>> {
  // Use Map for O(1) lookups by recipient ID
  const results = new Map<string, MessageGenerationResult>();

  // Process each recipient sequentially to avoid rate limits
  for (const recipient of recipients) {
    // Generate message for current recipient
    const result = await generateFirstMessage(sender, recipient);
    
    // Store result keyed by recipient ID
    results.set(recipient.id, result);
    
    // Delay between requests to respect rate limits (adjust based on API tier)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// ==============================================================================
// COMPATIBILITY SCORING
// ==============================================================================

/**
 * Calculates compatibility score (0-100) based on profile overlap
 * 
 * Scoring breakdown:
 * - Common courses: 20 points each, max 40 points (most important)
 * - Common interests: 15 points each, max 30 points
 * - Study preferences: 7 points (location), 7 points (time), 6 points (group size)
 * - Same major: 10 points bonus
 * 
 * @param user1 - First user profile
 * @param user2 - Second user profile
 * @returns Compatibility score from 0 to 100
 */
export function calculateCompatibilityScore(
  user1: UserProfile,
  user2: UserProfile
): number {
  let score = 0;
  const maxScore = 100;

  // Award points for common courses (20 points each, capped at 40)
  const commonCourses = user1.courses.filter(c => user2.courses.includes(c)).length;
  score += Math.min(commonCourses * 20, 40);

  // Award points for common interests (15 points each, capped at 30)
  const commonInterests = user1.interests.filter(i => user2.interests.includes(i)).length;
  score += Math.min(commonInterests * 15, 30);

  // Award 7 points for matching study location
  if (user1.studyPreferences.location === user2.studyPreferences.location) {
    score += 7;
  }
  
  // Award 7 points for matching time preference
  if (user1.studyPreferences.timeOfDay === user2.studyPreferences.timeOfDay) {
    score += 7;
  }
  
  // Award 6 points for matching group size preference
  if (user1.studyPreferences.groupSize === user2.studyPreferences.groupSize) {
    score += 6;
  }

  // Award 10 bonus points for same major
  if (user1.major === user2.major) {
    score += 10;
  }

  // Cap at maximum score
  return Math.min(score, maxScore);
}