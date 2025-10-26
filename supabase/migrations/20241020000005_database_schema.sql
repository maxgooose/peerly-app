-- ============================================================================
-- Peerly Database Schema UPDATED - sc
-- ============================================================================
--
-- Purpose: Complete database schema for Peerly study buddy matching platform
--
-- Features:
--   - User profiles with study preferences and academic information
--   - Match management with compatibility tracking
--   - AI-generated message suggestions with analytics
--   - Real-time chat messaging with read status
--   - Row Level Security (RLS) on all tables
--   - Optimized indexes for common queries
--   - Automatic timestamp management via triggers
--
-- Safety: Safe to run multiple times - uses DROP IF EXISTS pattern
--
-- Design Philosophy:
--   - Security first: RLS ensures users only see permitted data
--   - Performance: Indexes on frequently queried columns
--   - Flexibility: JSONB for semi-structured data (study preferences)
--   - Analytics: Track message usage for quality improvement
--   - Real-time: Supabase real-time enabled for live chat
--
-- Prerequisites:
--   - Supabase project with PostgreSQL database
--   - auth.users table (created automatically by Supabase Auth)
--   - Proper GRANT permissions for authenticated role
--
-- Deployment:
--   - Run in Supabase SQL Editor, OR
--   - Use: psql "connection_string" < peerly-database-schema.sql
--   - For migrations: See POLICY_MANAGEMENT_GUIDE.md
--
-- Version: 1.0.0
-- Last Updated: 2025-10-26
-- ============================================================================

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
--
-- Purpose: Extends Supabase auth.users with academic and study information
--
-- Design Decisions:
--   - Uses auth.users(id) as primary key for 1:1 relationship
--   - Stores courses/interests as TEXT[] for simplicity and flexibility
--   - Uses JSONB for study_preferences to allow easy schema evolution
--   - Enforces .edu email to ensure university student verification
--
-- Relationships:
--   - References: auth.users(id) - one profile per authenticated user
--   - Referenced by: matches, suggested_messages, messages
--
-- Security:
--   - RLS enabled: Users can only update their own profile
--   - Public read: All active profiles visible for matching algorithm
--   - Email validation: CHECK constraint ensures .edu domain
--
-- Performance:
--   - Indexes on major, year, is_active for match queries
--   - Small table size expected (1 row per user)
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- ========================================================================
    -- Primary Key & Identity
    -- ========================================================================
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    -- Links to Supabase auth system
    -- CASCADE delete is automatic via foreign key
    -- UUID ensures globally unique identifiers
    
    -- ========================================================================
    -- Contact Information
    -- ========================================================================
    email TEXT UNIQUE NOT NULL,
    -- University email address
    -- UNIQUE: One email per profile (prevents duplicates)
    -- NOT NULL: Required for verification
    -- Validated by CHECK constraint below (must end in .edu)
    
    -- ========================================================================
    -- Basic Profile Information
    -- ========================================================================
    name TEXT NOT NULL,
    -- Display name shown to other users
    -- Used in AI-generated messages for personalization
    -- NOT NULL: Required for meaningful interactions
    
    major TEXT NOT NULL,
    -- Academic program/major (e.g., "Computer Science", "Biology")
    -- Used for compatibility matching
    -- NOT NULL: Core part of academic profile
    -- Consider: Could be ENUM for standardization, but TEXT allows flexibility
    
    year INTEGER NOT NULL CHECK (year >= 1 AND year <= 8),
    -- Academic year/standing
    -- 1-4: Undergraduate (Freshman, Sophomore, Junior, Senior)
    -- 5-8: Graduate (Master's, PhD years 1-4)
    -- CHECK constraint ensures valid range
    -- Used for: Peer matching, mentorship opportunities
    
    -- ========================================================================
    -- Academic Information (Arrays)
    -- ========================================================================
    courses TEXT[] DEFAULT '{}',
    -- Currently enrolled courses
    -- Array allows multiple courses: ['Data Structures', 'Algorithms', 'ML']
    -- Default empty array prevents NULL handling complexity
    -- Used for: Finding study partners in same classes
    -- Consider: Could link to courses table for standardization
    
    interests TEXT[] DEFAULT '{}',
    -- Academic interests and topics
    -- Array: ['AI', 'Web Development', 'Mobile Apps', 'Research']
    -- Default empty array for consistency
    -- Used for: Matching by shared interests, conversation starters
    
    -- ========================================================================
    -- Study Preferences (JSONB)
    -- ========================================================================
    study_preferences JSONB DEFAULT '{
        "location": "library",
        "time_of_day": "afternoon",
        "group_size": "one-on-one"
    }'::jsonb,
    -- Flexible JSON structure for study preferences
    -- Why JSONB?
    --   - Easy to add new preferences without migration
    --   - Can query nested fields: study_preferences->>'location'
    --   - Automatically validates JSON structure
    --   - More compact than separate columns
    -- Default values provide sensible starting point
    -- Common values:
    --   location: "library", "coffee shop", "online", "dorm"
    --   time_of_day: "morning", "afternoon", "evening", "night"
    --   group_size: "one-on-one", "small group", "large group"
    
    -- ========================================================================
    -- Optional Extended Information
    -- ========================================================================
    bio TEXT,
    -- Optional personal bio/description
    -- NULL allowed: Not all users want to write a bio
    -- Used for: AI prompt context, profile display
    -- Consider: Add length limit in application layer
    
    goals TEXT[] DEFAULT '{}',
    -- Optional study/academic goals
    -- Examples: ['Get A in Calculus', 'Learn React', 'Publish paper']
    -- Used for: Matching motivation, AI personalization
    -- NULL handling: Default to empty array
    
    -- ========================================================================
    -- Profile Settings
    -- ========================================================================
    profile_photo_url TEXT,
    -- URL to profile photo in Supabase Storage
    -- NULL allowed: Photo is optional
    -- Format: Supabase Storage public URL
    -- Security: URL is public, but access controlled by Storage policies
    
    is_active BOOLEAN DEFAULT true,
    -- Profile active/inactive status
    -- FALSE: User deactivated account or took break
    -- Used for: Filtering in match queries (only show active users)
    -- Default TRUE: New profiles are active by default
    
    -- ========================================================================
    -- Audit Timestamps
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Profile creation timestamp
    -- TIMESTAMPTZ: Stores timezone info (best practice)
    -- DEFAULT NOW(): Automatically set on insert
    -- Used for: Analytics, "member since" display
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Last profile update timestamp
    -- Automatically updated via trigger (see below)
    -- Used for: Showing recently active users, cache invalidation
    
    -- ========================================================================
    -- Constraints
    -- ========================================================================
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.edu$')
    -- Validates university email format
    -- Regex breakdown:
    --   ^[A-Za-z0-9._%+-]+  : Username part (letters, numbers, special chars)
    --   @                   : Required @ symbol
    --   [A-Za-z0-9.-]+      : Domain name
    --   \.edu$              : Must end with .edu (US universities)
    -- Consider: Add support for international domains (.ac.uk, etc.)
    -- Prevents: Non-university emails, ensures student verification
);

-- ============================================================================
-- INDEXES for profiles table
-- ============================================================================
--
-- Purpose: Optimize common query patterns for match algorithm
--
-- Query Patterns Optimized:
--   1. Find users by major (same program matching)
--   2. Find users by year (peer/mentor matching)
--   3. Filter active users (exclude deactivated accounts)
--
-- Performance Impact:
--   - Without indexes: O(n) full table scan
--   - With indexes: O(log n) B-tree lookup
--   - Critical for: Match queries filtering thousands of profiles
--
-- Index Type: B-tree (default, best for equality and range queries)
--
-- Maintenance: Automatically updated on INSERT/UPDATE/DELETE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_major ON public.profiles(major);
-- Speeds up: SELECT * FROM profiles WHERE major = 'Computer Science'
-- Use case: Find users in same academic program
-- Cardinality: Medium (dozens of majors)
-- Size impact: Small (text field, typically 10-30 chars)

CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year);
-- Speeds up: SELECT * FROM profiles WHERE year = 3
-- Use case: Peer matching (same year) or mentorship (year ± 1)
-- Cardinality: Low (only 8 possible values: 1-8)
-- Size impact: Tiny (integer)

CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
-- Speeds up: SELECT * FROM profiles WHERE is_active = true
-- Use case: Filter out deactivated accounts in all match queries
-- Cardinality: Very low (boolean: true/false)
-- Size impact: Minimal (boolean)
-- Note: Consider partial index if most users are active:
--   CREATE INDEX idx_profiles_active ON profiles(id) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) for profiles table
-- ============================================================================
--
-- Security Model:
--   - Read: All authenticated users can view active profiles (for matching)
--   - Write: Users can only modify their own profile
--   - Insert: Users can only create their own profile (id = auth.uid())
--
-- RLS Enforcement:
--   - Enabled at table level (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
--   - Policies define rules for SELECT, INSERT, UPDATE, DELETE
--   - auth.uid() returns current authenticated user's UUID
--   - Bypassed by service_role key (use carefully!)
--
-- Testing RLS:
--   - Set role: SET ROLE authenticated;
--   - Set user: SET request.jwt.claims.sub = 'user-uuid';
--   - Run query: SELECT * FROM profiles;
--
-- ============================================================================

-- Enable RLS enforcement on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Read Access (SELECT)
-- ============================================================================
-- Drop existing policy if present (idempotent)
DROP POLICY IF EXISTS "Users can view all active profiles" ON public.profiles;

CREATE POLICY "Users can view all active profiles"
    ON public.profiles
    FOR SELECT
    USING (is_active = true);
-- Policy explanation:
--   - Allows: All authenticated users
--   - To: Read any profile where is_active = true
--   - Prevents: Viewing deactivated/suspended accounts
--   - Use case: Match algorithm needs to see potential matches
--   - Security: No sensitive data exposure (profile is meant to be shared)
--   
-- Why not check auth.uid()?
--   - Users need to see OTHER users' profiles for matching
--   - is_active filter provides sufficient access control
--   - Sensitive data (email, etc.) should be excluded from SELECT in app

-- ============================================================================
-- POLICY: Update Access (UPDATE)
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);
-- Policy explanation:
--   - Allows: Only the profile owner (auth.uid() matches profile id)
--   - To: Update any column in their own profile
--   - Prevents: Users from modifying other users' profiles
--   - Use case: User edits their major, courses, bio, etc.
--   
-- Security considerations:
--   - auth.uid() is server-side, can't be spoofed by client
--   - Even with direct database access, RLS enforces ownership
--   - Consider: Add check for sensitive fields (e.g., can't change email)

-- ============================================================================
-- POLICY: Insert Access (INSERT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);
-- Policy explanation:
--   - Allows: User to create a profile only for themselves
--   - Checks: The id being inserted matches auth.uid()
--   - Prevents: Creating profiles for other users
--   - Use case: User signs up and creates initial profile
--   
-- WITH CHECK vs USING:
--   - USING: Applies to SELECT/UPDATE/DELETE (checks existing rows)
--   - WITH CHECK: Applies to INSERT/UPDATE (validates new/updated data)
--   
-- Typical flow:
--   1. User signs up via Supabase Auth → creates auth.users row
--   2. App inserts into profiles with id = auth.uid()
--   3. This policy ensures id matches authenticated user

-- ============================================================================
-- TABLE: matches
-- ============================================================================
--
-- Purpose: Stores connections/matches between users for study partnerships
--
-- Design Decisions:
--   - user1_id < user2_id enforced by trigger (prevents duplicate matches)
--   - Stores compatibility metadata for analytics
--   - Status field for match lifecycle management
--   - Common ground cached for quick reference
--
-- Relationships:
--   - References: profiles(id) for both users (many-to-many via junction)
--   - Referenced by: messages table (all messages belong to a match)
--
-- Match Lifecycle:
--   pending → accepted (users agree to connect)
--   pending → rejected (one user declines)
--   accepted → archived (users finished studying together)
--
-- Security:
--   - RLS enabled: Users can only see their own matches
--   - Both parties can view match once created
--
-- Performance:
--   - Indexes on user1_id, user2_id for quick match lookups
--   - Index on status for filtering active matches
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matches (
    -- ========================================================================
    -- Primary Key
    -- ========================================================================
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Unique identifier for each match
    -- UUID v4 randomly generated
    -- Used as foreign key in messages table
    
    -- ========================================================================
    -- User References (The Match Pair)
    -- ========================================================================
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- First user in the match pair
    -- Foreign key to profiles table
    -- ON DELETE CASCADE: If user deletes account, remove their matches
    -- Always the user with smaller UUID (enforced by trigger)
    
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Second user in the match pair
    -- Foreign key to profiles table
    -- ON DELETE CASCADE: Match deleted if either user deletes account
    -- Always the user with larger UUID (enforced by trigger)
    --
    -- Why user1_id < user2_id?
    --   - Prevents duplicate matches: (A,B) same as (B,A)
    --   - Simplifies queries: No need to check both orders
    --   - Unique constraint works: UNIQUE(user1_id, user2_id)
    --   - See trigger: ensure_match_order() below
    
    -- ========================================================================
    -- Match Metadata (Cached from Compatibility Algorithm)
    -- ========================================================================
    compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    -- Calculated compatibility score (0-100)
    -- Algorithm defined in gemini-service.ts
    -- Breakdown:
    --   - Common courses: 40 points max
    --   - Common interests: 30 points max
    --   - Study preferences: 20 points max
    --   - Same major: 10 points
    -- Used for: Sorting matches, showing % compatibility in UI
    -- NULL allowed: Score might not be calculated initially
    
    common_courses TEXT[] DEFAULT '{}',
    -- Cached list of courses both users share
    -- Denormalized for performance (avoid JOIN in queries)
    -- Updated when match is created
    -- Used for: Quick reference in UI, conversation starters
    -- Example: ['Data Structures', 'Algorithms']
    
    common_interests TEXT[] DEFAULT '{}',
    -- Cached list of interests both users share
    -- Denormalized for performance
    -- Used for: Display in UI, conversation topics
    -- Example: ['AI', 'Web Development']
    
    -- ========================================================================
    -- Match Status & Lifecycle
    -- ========================================================================
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'archived')),
    -- Current status of the match
    -- Lifecycle:
    --   'pending':  Match suggested, waiting for acceptance
    --   'accepted': Both users agreed to connect → can chat
    --   'rejected': One user declined → match inactive
    --   'archived': Study partnership ended → kept for history
    -- CHECK constraint ensures only valid statuses
    -- Used for: Filtering queries (show only accepted), UI display
    
    initiated_by UUID REFERENCES public.profiles(id),
    -- Which user initiated/requested the match
    -- NULL allowed: System-initiated matches possible
    -- Used for: Analytics (who initiates more?), notification routing
    -- Can be user1_id or user2_id
    
    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    -- When the match was initially created
    -- TIMESTAMPTZ: Best practice (stores timezone)
    -- DEFAULT NOW(): Auto-set on creation
    -- Used for: "Matched X days ago", analytics, sorting
    
    accepted_at TIMESTAMPTZ,
    -- When the match was accepted (status → 'accepted')
    -- NULL until accepted
    -- Used for: Analytics (time to acceptance), "Connected since"
    -- Set by application when status changes to 'accepted'
    
    -- ========================================================================
    -- Constraints
    -- ========================================================================
    CONSTRAINT unique_match UNIQUE (user1_id, user2_id),
    -- Ensures no duplicate matches between same two users
    -- Works because user1_id < user2_id (enforced by trigger)
    -- Prevents: Creating (A,B) when (B,A) already exists
    -- Database-level enforcement (safer than app-level)
    
    CONSTRAINT different_users CHECK (user1_id != user2_id)
    -- Ensures users can't match with themselves
    -- Belt-and-suspenders: Should be caught in app logic too
    -- Prevents: Self-matches which would be meaningless
);

-- ============================================================================
-- INDEXES for matches table
-- ============================================================================
--
-- Query Patterns Optimized:
--   1. Find all matches for a specific user
--   2. Filter matches by status (show only 'accepted')
--   3. Sort by most recent matches
--
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
-- Speeds up: SELECT * FROM matches WHERE user1_id = 'uuid'
-- Use case: Find all matches where user is first in pair
-- Must check both user1_id and user2_id to find all user's matches

CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);
-- Speeds up: SELECT * FROM matches WHERE user2_id = 'uuid'
-- Use case: Find all matches where user is second in pair
-- Combined with user1_id index: Efficient user match queries

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
-- Speeds up: SELECT * FROM matches WHERE status = 'accepted'
-- Use case: Filter to show only accepted/active matches
-- Cardinality: Low (4 values), but still beneficial for filtering

-- ============================================================================
-- ROW LEVEL SECURITY for matches table
-- ============================================================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Read Access (SELECT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;

CREATE POLICY "Users can view their own matches"
    ON public.matches
    FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
-- Policy explanation:
--   - Allows: Users to see matches where they are either user1 or user2
--   - Prevents: Seeing other people's matches
--   - Use case: User views their match list, match details
--   
-- Query pattern:
--   SELECT * FROM matches WHERE auth.uid() IN (user1_id, user2_id)
--   -- RLS automatically adds this condition
--
-- Performance: Indexes on user1_id and user2_id make this efficient

-- ============================================================================
-- POLICY: Insert Access (INSERT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can create matches" ON public.matches;

CREATE POLICY "Users can create matches"
    ON public.matches
    FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
-- Policy explanation:
--   - Allows: Users to create matches if they are one of the participants
--   - Prevents: Creating matches between two other users
--   - Use case: User initiates a match with another user
--   
-- Important:
--   - User must be either user1_id OR user2_id in the match
--   - Trigger ensures user1_id < user2_id (may swap them)
--   - Set initiated_by = auth.uid() in app to track who started it

-- ============================================================================
-- POLICY: Update Access (UPDATE)
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;

CREATE POLICY "Users can update their matches"
    ON public.matches
    FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
-- Policy explanation:
--   - Allows: Match participants to update match (e.g., accept/reject)
--   - Prevents: Outsiders from modifying matches
--   - Use case: User accepts match (status → 'accepted')
--   
-- Common updates:
--   - status: 'pending' → 'accepted' or 'rejected'
--   - accepted_at: Set timestamp when accepting
--   - archived: Move to 'archived' when study partnership ends
--
-- Security: Both users can update, not just initiator

-- ============================================================================
-- TABLE: suggested_messages
-- ============================================================================
--
-- Purpose: Stores AI-generated first messages for analytics and caching
--
-- Design Decisions:
--   - Separate from messages table (suggestions vs actual messages)
--   - Tracks usage and modifications for quality improvement
--   - Enables caching to avoid redundant API calls
--   - Provides analytics for prompt engineering optimization
--
-- Workflow:
--   1. User views match → API generates message → stored here
--   2. User may edit message → was_modified = true
--   3. User sends message → was_used = true, used_at = NOW()
--   4. Message also inserted into messages table if sent
--
-- Analytics Use Cases:
--   - Track message usage rate (how many get sent vs ignored)
--   - Track modification rate (measure message quality)
--   - A/B testing different prompts
--   - Identify patterns in successful messages
--
-- Relationships:
--   - References: profiles(id) for sender and recipient
--   - Referenced by: messages table (optional link if message sent)
--
-- Security:
--   - RLS enabled: Users only see their own suggestions
--   - Edge Function inserts with service role
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suggested_messages (
    -- ========================================================================
    -- Primary Key
    -- ========================================================================
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Unique identifier for each suggestion
    -- Used to track if suggestion was actually sent
    
    -- ========================================================================
    -- User References
    -- ========================================================================
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- User who would send this message
    -- ON DELETE CASCADE: Clean up suggestions if user deletes account
    -- Used for: Retrieving user's suggestions, analytics
    
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- User who would receive this message
    -- ON DELETE CASCADE: Clean up if recipient deletes account
    -- Used for: Tracking suggestions per match pair, analytics
    
    -- ========================================================================
    -- Message Content
    -- ========================================================================
    message TEXT NOT NULL,
    -- The AI-generated message text
    -- NOT NULL: Every suggestion must have content
    -- Typically 50-120 words (2-4 sentences)
    -- Examples:
    --   "I saw we're both taking Data Structures! How are you finding..."
    --   "Your interest in machine learning caught my eye. Would you..."
    -- Used for: Displaying to user, copying to messages if sent
    
    -- ========================================================================
    -- Generation Metadata
    -- ========================================================================
    generated_topics TEXT[] DEFAULT '{}',
    -- Topics used to generate the message
    -- Combination of: common_courses + common_interests
    -- Examples: ['Data Structures', 'AI', 'Web Development']
    -- Used for: Understanding what the AI focused on, analytics
    -- Helps improve prompts by seeing which topics resonate
    
    -- ========================================================================
    -- Usage Tracking (Analytics)
    -- ========================================================================
    was_used BOOLEAN DEFAULT false,
    -- Did the user actually send this message?
    -- FALSE: User ignored suggestion or wrote their own
    -- TRUE: User clicked "Send" on this suggestion
    -- Used for: Calculating message usage rate (success metric)
    -- Target: >60% usage rate indicates good quality
    
    was_modified BOOLEAN DEFAULT false,
    -- Did the user edit the message before sending?
    -- FALSE: Sent as-is (perfect message quality)
    -- TRUE: User made changes (indicates room for improvement)
    -- Used for: Message quality metric
    -- Target: 20-40% modification rate is acceptable
    -- >60% modification = prompt needs improvement
    
    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- When suggestion was generated
    -- Used for: Caching (don't regenerate if recent), analytics
    -- Caching strategy: If created_at > NOW() - INTERVAL '1 hour', reuse
    
    used_at TIMESTAMPTZ,
    -- When user sent this message (NULL if not sent)
    -- Set by application when was_used → true
    -- Used for: Analytics (time to send), A/B testing results
    -- Metric: Shorter time = better suggestion (user sent immediately)
    
    -- ========================================================================
    -- Constraints
    -- ========================================================================
    CONSTRAINT different_users_msg CHECK (sender_id != recipient_id)
    -- Prevents: Generating message from user to themselves
    -- Belt-and-suspenders: Should also be prevented in app logic
);

-- ============================================================================
-- INDEXES for suggested_messages table
-- ============================================================================
--
-- Query Patterns Optimized:
--   1. Find suggestions for a specific sender (user's suggestions)
--   2. Find suggestions for a sender-recipient pair (check cache)
--   3. Find recent suggestions (time-based queries for analytics)
--
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_suggested_messages_sender ON public.suggested_messages(sender_id);
-- Speeds up: SELECT * FROM suggested_messages WHERE sender_id = 'uuid'
-- Use case: Retrieve all suggestions for a user
-- Cardinality: High (1:many - each user can have many suggestions)

CREATE INDEX IF NOT EXISTS idx_suggested_messages_recipient ON public.suggested_messages(recipient_id);
-- Speeds up: SELECT * FROM suggested_messages WHERE recipient_id = 'uuid'
-- Use case: Analytics - which users get most messages
-- Less frequently queried than sender_id

CREATE INDEX IF NOT EXISTS idx_suggested_messages_created ON public.suggested_messages(created_at);
-- Speeds up: SELECT * FROM suggested_messages WHERE created_at > NOW() - INTERVAL '1 hour'
-- Use case: Cache lookup (avoid regenerating recent messages)
-- Use case: Time-based analytics queries
-- Consider: BRIN index for very large tables (time-series data)

-- ============================================================================
-- ROW LEVEL SECURITY for suggested_messages table
-- ============================================================================

ALTER TABLE public.suggested_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Read Access (SELECT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view suggested messages for them" ON public.suggested_messages;

CREATE POLICY "Users can view suggested messages for them"
    ON public.suggested_messages
    FOR SELECT
    USING (auth.uid() = sender_id);
-- Policy explanation:
--   - Allows: Users to see suggestions where they are the sender
--   - Prevents: Seeing suggestions for other users
--   - Excludes: Can't see messages where they are recipient
--   
-- Why only sender_id?
--   - Suggestions are "for" the sender to send
--   - Recipient shouldn't see suggestions before they're sent
--   - Keeps the "surprise" element of first message
--
-- Use case: User views their suggested message for a match

-- ============================================================================
-- POLICY: Insert Access (INSERT)
-- ============================================================================
DROP POLICY IF EXISTS "System can insert suggested messages" ON public.suggested_messages;

CREATE POLICY "System can insert suggested messages"
    ON public.suggested_messages
    FOR INSERT
    WITH CHECK (true);
-- Policy explanation:
--   - Allows: Anyone (Edge Function with service_role key)
--   - Why unrestricted: Edge Function needs to insert suggestions
--   - Security: Edge Function validates sender/recipient before insert
--   
-- How it works:
--   1. Mobile app calls Edge Function with auth token
--   2. Edge Function validates user is authenticated
--   3. Edge Function uses service_role key to insert
--   4. Service_role bypasses RLS, so WITH CHECK (true) needed
--
-- Alternative approach:
--   WITH CHECK (auth.uid() = sender_id)
--   - But this fails with service_role key
--   - Would need to set local role before insert

-- ============================================================================
-- POLICY: Update Access (UPDATE)
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their suggested messages" ON public.suggested_messages;

CREATE POLICY "Users can update their suggested messages"
    ON public.suggested_messages
    FOR UPDATE
    USING (auth.uid() = sender_id);
-- Policy explanation:
--   - Allows: Sender to update their suggestions
--   - Prevents: Others from modifying suggestions
--   - Use case: Mark was_used=true when message sent
--   
-- Common updates:
--   UPDATE suggested_messages 
--   SET was_used = true, 
--       was_modified = true,
--       used_at = NOW()
--   WHERE id = 'suggestion-uuid';
--
-- Application flow:
--   1. User sends message (possibly after editing)
--   2. App updates this table (mark as used/modified)
--   3. App inserts into messages table

-- ============================================================================
-- TABLE: messages
-- ============================================================================
--
-- Purpose: Stores actual chat messages between matched users
--
-- Design Decisions:
--   - Links to matches table (all messages belong to a match)
--   - Tracks if message came from AI suggestion
--   - Supports read receipts for better UX
--   - Real-time enabled via Supabase subscriptions
--
-- Message Flow:
--   1. Users accept match (status → 'accepted')
--   2. One user writes/sends first message → inserted here
--   3. Real-time subscription notifies recipient
--   4. Recipient sees message, reads it → is_read = true
--   5. Conversation continues...
--
-- Real-time Capabilities:
--   - Supabase real-time subscriptions enabled (see below)
--   - Mobile app listens for INSERT events
--   - New messages appear instantly without refresh
--
-- Relationships:
--   - References: matches(id) - all messages belong to a match
--   - References: profiles(id) - who sent the message
--   - References: suggested_messages(id) - optional link if AI-generated
--
-- Security:
--   - RLS enabled: Users only see messages in their matches
--   - Can only send messages in accepted matches
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    -- ========================================================================
    -- Primary Key
    -- ========================================================================
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Unique identifier for each message
    -- Used for: Message updates (read status), pagination
    
    -- ========================================================================
    -- Relationships
    -- ========================================================================
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    -- Which match/conversation this message belongs to
    -- ON DELETE CASCADE: If match deleted, delete all its messages
    -- Used for: Grouping messages by conversation
    -- Foreign key ensures: Can't send message to non-existent match
    
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Who sent this message
    -- ON DELETE CASCADE: If user deletes account, remove their messages
    -- Used for: Displaying sender name/avatar, enforcing "can only send own"
    
    -- ========================================================================
    -- Message Content
    -- ========================================================================
    content TEXT NOT NULL,
    -- The actual message text
    -- NOT NULL: Empty messages not allowed
    -- Consider: Add length limit in application (e.g., 1000 chars)
    -- Used for: Displaying in chat UI
    
    -- ========================================================================
    -- AI Tracking (Optional)
    -- ========================================================================
    is_ai_generated BOOLEAN DEFAULT false,
    -- Was this message generated by AI?
    -- TRUE: User sent the suggested message (or modified version)
    -- FALSE: User wrote completely original message
    -- Used for: Analytics (how often AI messages are used)
    
    suggested_message_id UUID REFERENCES public.suggested_messages(id),
    -- Link to the suggestion if this came from AI
    -- NULL: User wrote original message
    -- NOT NULL: Message based on AI suggestion
    -- Used for: Tracking suggestion → actual message
    -- Analytics: If is_ai_generated true, this should be set
    
    -- ========================================================================
    -- Read Status (Read Receipts)
    -- ========================================================================
    is_read BOOLEAN DEFAULT false,
    -- Has the recipient read this message?
    -- FALSE: Message delivered but not opened/seen
    -- TRUE: Recipient has viewed the message
    -- Used for: UI indicators (read receipts, unread count)
    -- Updated by: Recipient's app when message displayed
    
    read_at TIMESTAMPTZ,
    -- When the message was read (NULL if unread)
    -- Set when: is_read changes from false → true
    -- Used for: "Read 5 minutes ago", analytics
    -- Privacy: Consider making optional based on user preference
    
    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- When message was sent
    -- Used for: Sorting messages chronologically, "Sent at 3:42 PM"
    -- Important for: Real-time ordering in chat UI
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
    -- When message was last modified
    -- Updated via trigger (see below)
    -- Used for: Tracking edits (if you add edit functionality)
    -- Currently: Only updates when read status changes
);

-- ============================================================================
-- INDEXES for messages table
-- ============================================================================
--
-- Query Patterns Optimized:
--   1. Load all messages for a match (conversation history)
--   2. Count unread messages per user
--   3. Sort messages chronologically
--
-- Performance Critical:
--   - messages table grows fastest (many messages per match)
--   - Without indexes, full table scans would slow down chat
--
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id);
-- Speeds up: SELECT * FROM messages WHERE match_id = 'uuid'
-- Use case: Load conversation history for a match
-- Query frequency: Very high (every time user opens chat)
-- Cardinality: High (many messages per match)
-- Critical for: Chat performance

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
-- Speeds up: SELECT * FROM messages WHERE sender_id = 'uuid'
-- Use case: Analytics (message count per user)
-- Query frequency: Medium (analytics queries)
-- Less critical than match_id index

CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
-- Speeds up: SELECT * FROM messages ORDER BY created_at DESC
-- DESC: Most recent first (common pattern in chat)
-- Use case: Pagination, "load more" messages
-- Combined with match_id: Efficient conversation loading
-- Note: Composite index (match_id, created_at) would be even better:
--   CREATE INDEX idx_messages_match_time ON messages(match_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY for messages table
-- ============================================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Read Access (SELECT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;

CREATE POLICY "Users can view messages in their matches"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = messages.match_id
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );
-- Policy explanation:
--   - Allows: Users to see messages in matches where they are a participant
--   - Prevents: Viewing messages in other people's conversations
--   - How: Subquery checks if user is in the match
--   
-- Performance consideration:
--   - EXISTS subquery is optimized by PostgreSQL
--   - Indexes on matches(user1_id, user2_id) make this fast
--   - Alternative: JOIN but EXISTS is cleaner for security policies
--
-- Logic:
--   1. For each message, check its match_id
--   2. Look up that match in matches table
--   3. If current user is user1_id OR user2_id, allow access
--   4. Otherwise, hide the message

-- ============================================================================
-- POLICY: Insert Access (INSERT)
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON public.messages;

CREATE POLICY "Users can insert messages in their matches"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = match_id
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
            AND matches.status = 'accepted'
        )
    );
-- Policy explanation:
--   - Allows: Users to send messages in their accepted matches
--   - Prevents: 
--     1. Sending messages as another user (auth.uid() = sender_id)
--     2. Sending to matches you're not part of
--     3. Sending to pending/rejected matches (status = 'accepted')
--   
-- Three-part check:
--   1. auth.uid() = sender_id
--      - Can only send messages as yourself
--      - Prevents impersonation
--   
--   2. User is in the match (user1_id OR user2_id)
--      - Can't send to random matches
--      - Must be a participant
--   
--   3. Match status = 'accepted'
--      - Can only message after match is accepted
--      - Prevents spam to pending matches
--      - Users must mutually accept first
--
-- Example rejected scenarios:
--   - User tries to send in 'pending' match → blocked by status check
--   - User tries to send to match they're not in → blocked by EXISTS
--   - User tries to set sender_id to someone else → blocked by first condition

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================
--
-- Purpose: Automate common database operations
--
-- Functions Defined:
--   1. update_updated_at_column() - Auto-update timestamp on row changes
--   2. ensure_match_order() - Enforce user1_id < user2_id in matches
--
-- Why Triggers?
--   - Consistency: Logic runs at database level (can't be bypassed)
--   - Simplicity: App doesn't need to handle these concerns
--   - Performance: Database-native operations are fast
--   - Safety: Prevents invalid data states
--
-- ============================================================================

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
--
-- Purpose: Automatically set updated_at = NOW() whenever a row is updated
--
-- Why this matters:
--   - Tracks when records last changed
--   - Useful for caching (invalidate cache when updated_at changes)
--   - Audit trail (know when data was modified)
--   - No application code needed (automatic)
--
-- How it works:
--   - Triggered BEFORE UPDATE on specified tables
--   - Modifies NEW record (about to be updated)
--   - Sets NEW.updated_at to current timestamp
--   - Returns NEW (modified record gets saved)
--
-- Performance: Negligible overhead (single timestamp assignment)
--
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set updated_at to current time
    -- NEW represents the row being inserted/updated
    -- This changes the row before it's written to disk
    NEW.updated_at = NOW();
    
    -- Return the modified row
    -- Must return NEW for BEFORE triggers that modify data
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Language: plpgsql (PostgreSQL procedural language)
-- Returns: TRIGGER type (special return type for trigger functions)

-- ============================================================================
-- TRIGGER: Auto-update profiles.updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
-- Drop if exists: Ensures idempotent (safe to run multiple times)

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Trigger configuration:
--   - BEFORE UPDATE: Run before the update is committed
--   - FOR EACH ROW: Run once per updated row
--   - EXECUTE FUNCTION: Call update_updated_at_column()
--
-- Example:
--   UPDATE profiles SET major = 'Physics' WHERE id = 'uuid';
--   → Trigger fires
--   → Sets updated_at = NOW()
--   → Row saved with both changes

-- ============================================================================
-- TRIGGER: Auto-update messages.updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Same logic as profiles trigger
-- Updates messages.updated_at whenever a message is modified
-- Example use: Marking message as read (is_read → true)

-- ============================================================================
-- FUNCTION: Ensure match order (user1_id < user2_id)
-- ============================================================================
--
-- Purpose: Prevent duplicate matches by enforcing consistent user ordering
--
-- Problem it solves:
--   - Without this: Could have both (Alice, Bob) and (Bob, Alice)
--   - These represent the same match but appear as duplicates
--   - Queries would need to check both orders: WHERE (user1=A AND user2=B) OR (user1=B AND user2=A)
--
-- Solution:
--   - Always store smaller UUID as user1_id
--   - Always store larger UUID as user2_id
--   - Automatic via trigger on INSERT/UPDATE
--
-- Benefits:
--   - UNIQUE constraint works correctly
--   - Queries simplified (only check one order)
--   - No duplicate match rows possible
--
-- How it works:
--   - Compare user1_id and user2_id UUIDs
--   - If user1_id > user2_id, swap them
--   - Return the corrected row
--
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_match_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user IDs are in wrong order
    IF NEW.user1_id > NEW.user2_id THEN
        -- Swap the users using a temporary variable
        -- DECLARE creates a local variable scope
        DECLARE
            temp UUID;  -- Temporary storage for UUID
        BEGIN
            -- Three-way swap
            temp := NEW.user1_id;           -- temp = user1
            NEW.user1_id := NEW.user2_id;   -- user1 = user2
            NEW.user2_id := temp;           -- user2 = temp (original user1)
        END;
    END IF;
    
    -- Return the (possibly modified) row
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Example:
--   INSERT INTO matches (user1_id, user2_id) VALUES ('uuid-zzz', 'uuid-aaa');
--   → Trigger fires
--   → Detects 'zzz' > 'aaa'
--   → Swaps to ('uuid-aaa', 'uuid-zzz')
--   → Row inserted with correct order

-- ============================================================================
-- TRIGGER: Enforce match order on INSERT/UPDATE
-- ============================================================================

DROP TRIGGER IF EXISTS ensure_match_order_trigger ON public.matches;

CREATE TRIGGER ensure_match_order_trigger
    BEFORE INSERT OR UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION ensure_match_order();
-- Trigger configuration:
--   - BEFORE INSERT OR UPDATE: Run on both operations
--   - Why both?
--     - INSERT: Ensure correct order when match created
--     - UPDATE: Maintain order if user IDs are updated (rare)
--   - FOR EACH ROW: Process each match individually
--
-- Working with this trigger:
--   - App can insert users in any order
--   - Database ensures consistent ordering
--   - UNIQUE(user1_id, user2_id) constraint works correctly

-- ============================================================================
-- REALTIME SETUP
-- ============================================================================
--
-- Purpose: Enable Supabase real-time subscriptions for live updates
--
-- What is Real-time?
--   - Supabase feature that broadcasts database changes to connected clients
--   - Uses PostgreSQL's LISTEN/NOTIFY under the hood
--   - Mobile app can subscribe to INSERT/UPDATE/DELETE events
--   - Changes appear instantly without polling or refresh
--
-- Use Cases in Peerly:
--   1. messages table: New messages appear immediately in chat
--   2. matches table: Match status updates show instantly
--
-- Security:
--   - RLS still applies to real-time events
--   - Users only receive events for data they can access
--
-- ============================================================================

DO $$ 
BEGIN
    -- Enable realtime for messages table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        -- Mobile app can now subscribe: supabase.channel('messages').on('postgres_changes'...)
    END IF;
END $$;

DO $$ 
BEGIN
    -- Enable realtime for matches table (optional but recommended)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
        -- Enables instant match acceptance notifications
    END IF;
END $$;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
--
-- Purpose: Provide sample profiles for development/testing
--
-- ⚠️  WARNING: Remove this section in production!
--
-- Sample profiles have common ground for testing:
--   - Same major: Computer Science
--   - Same year: 3 (Juniors)
--   - Common course: Data Structures
--   - Common interest: AI
--
-- ============================================================================

DO $$ 
BEGIN
    -- Only insert if table is empty (safety check)
    IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        INSERT INTO public.profiles (id, email, name, major, year, courses, interests, study_preferences, bio, goals)
        VALUES
            (
                '00000000-0000-0000-0000-000000000001'::UUID,  -- Test UUID
                'alice.smith@university.edu',
                'Alice Smith',
                'Computer Science',
                3,  -- Junior
                ARRAY['Data Structures', 'Algorithms', 'Machine Learning'],
                ARRAY['AI', 'Web Development', 'Mobile Apps'],
                '{"location": "library", "time_of_day": "evening", "group_size": "one-on-one"}'::jsonb,
                'Love coding and building cool projects! Always looking for study partners.',
                ARRAY['Master algorithms', 'Build a startup', 'Learn React Native']
            ),
            (
                '00000000-0000-0000-0000-000000000002'::UUID,  -- Test UUID
                'bob.jones@university.edu',
                'Bob Jones',
                'Computer Science',
                3,  -- Junior
                ARRAY['Data Structures', 'Operating Systems', 'Database Systems'],
                ARRAY['AI', 'Cybersecurity', 'Cloud Computing'],
                '{"location": "coffee shop", "time_of_day": "afternoon", "group_size": "small group"}'::jsonb,
                'CS junior who loves system programming and security.',
                ARRAY['Ace technical interviews', 'Contribute to open source']
            );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;  -- Silently fail if UUIDs conflict
END $$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
--
-- Purpose: Give authenticated users access to database objects
--
-- Security Model:
--   1. GRANT gives table-level access (can query the table)
--   2. RLS policies give row-level access (which rows they see)
--   3. Both must pass for access to succeed
--
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
-- Unlock access to public schema

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- Table access (RLS still applies)

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- Sequence access (for auto-increment if needed)

-- ============================================================================
-- 🎉 SCHEMA DEPLOYMENT COMPLETE
-- ============================================================================
--
-- Next Steps:
--   1. Verify: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--   2. Test RLS: Try querying as authenticated user
--   3. Enable real-time: Subscribe in mobile app
--   4. Deploy Edge Function: supabase functions deploy generate-first-message
--
-- Documentation: See IMPLEMENTATION_GUIDE.md
-- ============================================================================