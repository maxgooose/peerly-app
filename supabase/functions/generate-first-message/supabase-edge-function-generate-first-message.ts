/// <reference path="../types/external.d.ts" />

/**
 * Supabase Edge Function: generate-first-message
 * 
 * Purpose: Generates personalized AI-powered first messages between matched study buddies
 * Trigger: Called when users match or when a conversation starter is requested
 * 
 * Flow:
 * 1. Receive sender and recipient IDs from mobile app
 * 2. Fetch both user profiles from Supabase database
 * 3. Build contextual prompt with profile information
 * 4. Call Gemini AI to generate personalized message
 * 5. Store message in database for analytics
 * 6. Return message to mobile app for display
 * 
 * Deploy to: supabase/functions/generate-first-message/index.ts
 * Deploy command: supabase functions deploy generate-first-message
 */

// Deno standard library for HTTP server (Edge Functions use Deno runtime)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Supabase client for database operations (ESM import for Deno compatibility)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * UserProfile interface - matches the database schema
 * Adjust these fields based on your actual profiles table structure
 */
interface UserProfile {
  id: string;           // UUID from auth.users
  name: string;         // Display name
  major: string;        // Academic major/program
  year: number;         // 1-4 for undergrad, 5+ for grad
  courses: string[];    // Current enrolled courses
  interests: string[];  // Academic/study interests
  study_preferences: {  // Stored as JSONB in database
    location: string;      // e.g., "library", "coffee shop", "online"
    time_of_day: string;   // e.g., "morning", "afternoon", "evening"
    group_size: string;    // e.g., "one-on-one", "small group"
  };
  bio?: string;         // Optional personal bio
  goals?: string[];     // Optional study/academic goals
}

/**
 * Environment variables - set these in Supabase dashboard or CLI
 * Command to set: supabase secrets set GEMINI_API_KEY=your_key_here
 */
// Gemini API key - must be set in Supabase Edge Function environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

/**
 * Gemini API endpoint - using Flash model for speed and cost efficiency
 * Flash model: ~1-2s response time, $0.00015 per request (as of 2024)
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Main Edge Function handler
 * Deno.serve automatically handles HTTP requests in the Edge Functions environment
 */
serve(async (req) => {
  // ============================================================================
  // CORS Preflight Handling
  // ============================================================================
  // Browsers send OPTIONS request before actual POST to check CORS permissions
  // Must respond with proper headers to allow cross-origin requests from mobile app
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',  // Allow all origins (restrict in production if needed)
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // ============================================================================
    // Request Validation
    // ============================================================================
    // Extract and validate required parameters from request body
    const { senderId, recipientId } = await req.json();

    // Both IDs are required - return 400 Bad Request if missing
    if (!senderId || !recipientId) {
      return new Response(
        JSON.stringify({ error: 'senderId and recipientId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================================
    // Supabase Client Initialization
    // ============================================================================
    /**
     * Create Supabase client with user's auth token
     * - Uses environment variables for project URL and anon key
     * - Forwards user's Authorization header for RLS (Row Level Security)
     * - This ensures user can only access data they're permitted to see
     */
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',      // Project URL from environment
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Public anon key from environment
      {
        global: {
          // Forward the Authorization header from the original request
          // This allows RLS policies to check auth.uid()
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // ============================================================================
    // Fetch User Profiles from Database
    // ============================================================================
    /**
     * Fetch sender's profile
     * - .select('*') gets all columns from profiles table
     * - .eq() filters by ID (equivalent to WHERE id = senderId)
     * - .single() expects exactly one row, throws error if 0 or multiple
     * - RLS policies ensure user can only see permitted profiles
     */
    const { data: senderData, error: senderError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', senderId)
      .single();

    /**
     * Fetch recipient's profile
     * Using same pattern as sender fetch above
     */
    const { data: recipientData, error: recipientError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', recipientId)
      .single();

    // Handle database errors - return 500 if either fetch failed
    if (senderError || recipientError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================================
    // Transform Database Data to UserProfile Format
    // ============================================================================
    /**
     * Convert database rows to TypeScript interfaces
     * This ensures type safety and consistent structure for message generation
     * Database column names (snake_case) map to camelCase interface properties
     */
    const sender: UserProfile = {
      id: senderData.id,
      name: senderData.name,
      major: senderData.major,
      year: senderData.year,
      courses: senderData.courses || [],            // Default to empty array if null
      interests: senderData.interests || [],        // Default to empty array if null
      study_preferences: senderData.study_preferences || {},  // Default to empty object
      bio: senderData.bio,
      goals: senderData.goals || [],                // Default to empty array if null
    };

    const recipient: UserProfile = {
      id: recipientData.id,
      name: recipientData.name,
      major: recipientData.major,
      year: recipientData.year,
      courses: recipientData.courses || [],
      interests: recipientData.interests || [],
      study_preferences: recipientData.study_preferences || {},
      bio: recipientData.bio,
      goals: recipientData.goals || [],
    };

    // ============================================================================
    // Generate First Message using Gemini AI
    // ============================================================================
    /**
     * Call the generateFirstMessage helper function
     * This handles prompt construction and API communication with Gemini
     */
    const message = await generateFirstMessage(sender, recipient);

    // ============================================================================
    // Store Generated Message in Database (Optional but Recommended)
    // ============================================================================
    /**
     * Store message for analytics and caching purposes
     * Benefits:
     * - Analytics: Track which messages get used vs modified
     * - Caching: Avoid regenerating same message within short timeframe
     * - Audit trail: Debug issues with message quality
     * 
     * Note: We don't fail the request if storage fails - message still usable
     */
    const { error: insertError } = await supabaseClient
      .from('suggested_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        message: message,
        created_at: new Date().toISOString(),  // Explicit timestamp for consistency
      });

    // Log error but don't fail the request - message generation succeeded
    if (insertError) {
      console.error('Failed to store suggested message:', insertError);
      // Continue anyway - this is not critical to user experience
    }

    // ============================================================================
    // Return Success Response
    // ============================================================================
    /**
     * Return the generated message with metadata
     * - success: true indicates operation completed
     * - message: the AI-generated text
     * - sender/recipient names: useful for UI display
     * - CORS headers: allow mobile app to receive response
     */
    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        sender: sender.name,
        recipient: recipient.name,
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*'  // Allow cross-origin response
        },
      }
    );
  } catch (error) {
    // ============================================================================
    // Global Error Handler
    // ============================================================================
    /**
     * Catches any uncaught errors in the function
     * - Log to Supabase Edge Function logs (viewable in dashboard)
     * - Return 500 with error details for debugging
     * - In production, consider sanitizing error messages for security
     */
    console.error('Error in generate-first-message function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message  // Include details for debugging (remove in production)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ==============================================================================
// Helper Function: generateFirstMessage
// ==============================================================================
/**
 * Generates a personalized first message using Gemini AI
 * 
 * Process:
 * 1. Extract common ground between users (courses, interests)
 * 2. Build a detailed prompt with context
 * 3. Call Gemini API with optimized parameters
 * 4. Clean and validate the response
 * 5. Return the message text
 * 
 * @param sender - The user sending the message
 * @param recipient - The user receiving the message
 * @returns Promise<string> - The generated message text
 * @throws Error if API call fails
 */
async function generateFirstMessage(
  sender: UserProfile,
  recipient: UserProfile
): Promise<string> {
  // ============================================================================
  // Step 1: Extract Common Ground
  // ============================================================================
  /**
   * Find shared interests between users
   * Using filter + includes for array intersection
   * This common ground is crucial for personalized messages
   */
  const commonCourses = sender.courses.filter(c => recipient.courses.includes(c));
  const commonInterests = sender.interests.filter(i => recipient.interests.includes(i));

  // ============================================================================
  // Step 2: Build the Prompt
  // ============================================================================
  /**
   * Construct a detailed, structured prompt for Gemini
   * 
   * Prompt engineering best practices applied:
   * - Clear role definition ("You are a helpful AI assistant...")
   * - Structured context with clear sections
   * - Explicit instructions with numbered guidelines
   * - Concrete examples of good output
   * - Constraints on length and format
   * 
   * The quality of the prompt directly impacts message quality
   */
  const prompt = `Generate a brief first text message for a study buddy app.

**USER 1 (SENDER):**
- Name: ${sender.name}
- Major: ${sender.major}, ${getYearLabel(sender.year)}
- Courses: ${sender.courses.join(', ')}

**USER 2 (RECIPIENT):**
- Name: ${recipient.name}
- Major: ${recipient.major}, ${getYearLabel(recipient.year)}
- Courses: ${recipient.courses.join(', ')}

**SHARED COURSES:** ${commonCourses.length > 0 ? commonCourses.join(', ') : 'None'}

**TASK:**
Create a brief first message FROM ${sender.name} TO ${recipient.name}.

**REQUIREMENTS:**
1. Maximum 10 words total
2. Reference a shared course if available
3. Casual, friendly tone (like texting)
4. NO greetings like "Hey" or "Hi"
5. NO sender's name
6. Just the message text, nothing else

**EXAMPLES:**
- "Study Algorithms together?"
- "Data Structures study partner?"
- "Want to prep for the exam?"

Generate ONLY the message (under 10 words):`;

  // ============================================================================
  // Step 3: Call Gemini API
  // ============================================================================
  /**
   * Make HTTP request to Gemini API
   * 
   * Generation Config Parameters:
   * - temperature (0.9): High creativity for varied, natural messages
   * - topK (40): Consider top 40 tokens for diversity
   * - topP (0.95): Cumulative probability threshold
   * - maxOutputTokens (200): Limit response length (~150-200 words max)
   * 
   * API Key passed as URL parameter per Gemini API requirements
   */
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt,  // Our carefully crafted prompt
        }],
      }],
      generationConfig: {
        temperature: 0.9,        // Higher = more creative/varied responses
        topK: 40,                // Diversity of token selection
        topP: 0.95,              // Nucleus sampling threshold
        maxOutputTokens: 200,    // Max length of generated text
      },
    }),
  });

  // Check if API request was successful
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  // ============================================================================
  // Step 4: Parse and Extract Response
  // ============================================================================
  /**
   * Parse JSON response from Gemini
   * Response structure: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
   * We extract the text from the first candidate's first part
   */
  const data = await response.json();
  const message = data.candidates[0].content.parts[0].text;

  // ============================================================================
  // Step 5: Clean and Return Message
  // ============================================================================
  /**
   * Clean up the generated message
   * - trim(): Remove leading/trailing whitespace
   * - Remove surrounding quotes if Gemini added them
   * - Replace multiple newlines with single space (for consistency)
   * - Final trim for good measure
   */
  return message
    .trim()
    .replace(/^["']|["']$/g, '')  // Remove quotes: "text" -> text
    .replace(/\n+/g, ' ')          // Newlines to spaces: "line1\n\nline2" -> "line1 line2"
    .trim();
}

// ==============================================================================
// Helper Function: getYearLabel
// ==============================================================================
/**
 * Converts numeric year to readable label
 * Used in prompts to provide context about academic standing
 * 
 * @param year - Student's year (1-8)
 * @returns Human-readable year label
 */
function getYearLabel(year: number): string {
  const labels: { [key: number]: string } = {
    1: 'Freshman',
    2: 'Sophomore',
    3: 'Junior',
    4: 'Senior',
  };
  // Return specific label for 1-4, otherwise assume graduate student
  return labels[year] || 'Graduate Student';
}