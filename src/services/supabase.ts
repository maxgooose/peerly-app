import { createClient } from '@supabase/supabase-js';

// Expo automatically loads .env files at the project root
// These environment variables must be defined in .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key missing:');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? '(exists)' : '(missing)');
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

// Define availability schedule type for better type safety
// Represents a single day's availability with optional time slots
export type DaySchedule = {
  available: boolean; // Whether user is available on this day
  timeSlots?: Array<{
    start: string; // Time in HH:MM format (e.g., "09:00")
    end: string;   // Time in HH:MM format (e.g., "17:00")
  }>;
};

// Represents a user's weekly availability schedule
// Each day of the week is optional and contains a DaySchedule
export type WeeklyAvailability = {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
};

// Database types - ideally auto-generated with `supabase gen types typescript`
// This defines the complete structure of the Supabase database
export type Database = {
  public: {
    Tables: {
      users: {
        // Row type represents data returned from SELECT queries
        Row: {
          id: string; // UUID primary key, matches auth.users.id
          email: string; // User's university email address
          full_name: string | null; // User's full name (nullable until onboarding)
          university: string | null; // University name extracted from email domain
          major: string | null; // User's major/field of study
          year: string | null; // Academic year (e.g., "Freshman", "Sophomore", "Junior", "Senior")
          bio: string | null; // Optional biography/description
          profile_photo_url: string | null; // URL to profile photo in Supabase Storage
          profile_photo_uploaded_at: string | null; // Timestamp of last photo upload (from migration 3)
          has_profile_photo: boolean; // Boolean flag indicating photo exists (from migration 3)
          preferred_subjects: string[] | null; // Array of subjects user wants to study
          availability: WeeklyAvailability | null; // IMPROVED: Properly typed weekly schedule instead of 'any'
          study_style: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null; // How user prefers to study
          study_goals: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null; // What user wants to achieve
          push_token: string | null; // Expo push notification token
          push_token_updated_at: string | null; // When push token was last updated
          onboarding_completed: boolean; // ADDED: Whether user completed initial profile setup
          onboarding_completed_at: string | null; // ADDED: Timestamp of onboarding completion
          last_auto_match_cycle: string | null; // Timestamp of last auto-matching run
          badge_display_preference: 'show_all' | 'show_primary' | 'hide_all'; // How to display badges
          primary_badge_id: string | null; // User's primary/featured badge
          total_matches: number; // Total number of matches
          successful_matches: number; // Number of successful matches
          avg_messages_per_match: number; // Average messages per match
          created_at: string; // Timestamp of account creation
        };
        // Insert type represents data structure for INSERT operations
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          email: string; // Required: User's email address
          full_name?: string | null;
          university?: string | null;
          major?: string | null;
          year?: string | null;
          bio?: string | null;
          profile_photo_url?: string | null;
          profile_photo_uploaded_at?: string | null;
          has_profile_photo?: boolean; // Optional: Defaults to false
          preferred_subjects?: string[] | null;
          availability?: WeeklyAvailability | null;
          study_style?: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null;
          study_goals?: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null;
          push_token?: string | null;
          push_token_updated_at?: string | null;
          onboarding_completed?: boolean; // Optional: Defaults to false
          onboarding_completed_at?: string | null;
          last_auto_match_cycle?: string | null;
          badge_display_preference?: 'show_all' | 'show_primary' | 'hide_all';
          primary_badge_id?: string | null;
          total_matches?: number;
          successful_matches?: number;
          avg_messages_per_match?: number;
          created_at?: string; // Optional: Auto-set to now() if not provided
        };
        // Update type represents data structure for UPDATE operations
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          university?: string | null;
          major?: string | null;
          year?: string | null;
          bio?: string | null;
          profile_photo_url?: string | null;
          profile_photo_uploaded_at?: string | null;
          has_profile_photo?: boolean;
          preferred_subjects?: string[] | null;
          availability?: WeeklyAvailability | null;
          study_style?: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null;
          study_goals?: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null;
          push_token?: string | null;
          push_token_updated_at?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          last_auto_match_cycle?: string | null;
          badge_display_preference?: 'show_all' | 'show_primary' | 'hide_all';
          primary_badge_id?: string | null;
          total_matches?: number;
          successful_matches?: number;
          avg_messages_per_match?: number;
          created_at?: string;
        };
      };
      matches: {
        // Represents a match between two users
        Row: {
          id: string; // UUID primary key
          user1_id: string; // Foreign key to users table
          user2_id: string; // Foreign key to users table
          match_type: 'auto' | 'manual'; // How match was created: algorithm or mutual swipe
          status: 'pending' | 'active' | 'unmatched'; // Current state of the match
          matched_at: string; // Timestamp when match was created
          ai_message_sent: boolean; // Whether AI icebreaker message was sent
        };
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          user1_id: string; // Required
          user2_id: string; // Required
          match_type: 'auto' | 'manual'; // Required
          status?: 'pending' | 'active' | 'unmatched'; // Optional: Defaults to 'pending'
          matched_at?: string; // Optional: Defaults to now()
          ai_message_sent?: boolean; // Optional: Defaults to false
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          match_type?: 'auto' | 'manual';
          status?: 'pending' | 'active' | 'unmatched';
          matched_at?: string;
          ai_message_sent?: boolean;
        };
      };
      conversations: {
        // Represents a chat conversation between matched users
        Row: {
          id: string; // UUID primary key
          match_id: string; // Foreign key to matches table
          created_at: string; // When conversation started
          updated_at: string; // Last activity timestamp
          last_message_id: string | null; // Cached last message ID
          last_message_content: string | null; // Cached last message text
          last_message_at: string | null; // Cached last message timestamp
          last_message_sender_id: string | null; // Who sent last message
        };
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          match_id: string; // Required
          created_at?: string; // Optional: Defaults to now()
          updated_at?: string; // Optional: Defaults to now()
          last_message_id?: string | null;
          last_message_content?: string | null;
          last_message_at?: string | null;
          last_message_sender_id?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_id?: string | null;
          last_message_content?: string | null;
          last_message_at?: string | null;
          last_message_sender_id?: string | null;
        };
      };
      messages: {
        // Represents a chat message within a conversation
        Row: {
          id: string; // UUID primary key
          conversation_id: string; // Foreign key to conversations table
          sender_id: string | null; // Foreign key to users table (who sent the message)
          content: string | null; // Message text content
          message_type: 'text' | 'image' | 'file'; // Type of message
          media_url: string | null; // URL for images/files
          media_type: string | null; // MIME type (e.g., 'image/jpeg')
          media_size: number | null; // File size in bytes
          thumbnail_url: string | null; // Thumbnail URL for images
          status: 'sending' | 'sent' | 'delivered' | 'failed'; // Message delivery status
          is_ai_generated: boolean; // Whether message was generated by AI
          created_at: string; // Timestamp when message was sent
          updated_at: string; // Timestamp when message was last updated
          deleted_at: string | null; // Soft delete timestamp
          client_id: string | null; // Client-side ID for deduplication
        };
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          conversation_id: string; // Required
          sender_id?: string | null; // Required
          content?: string | null; // Required for text messages
          message_type?: 'text' | 'image' | 'file'; // Optional: Defaults to 'text'
          media_url?: string | null;
          media_type?: string | null;
          media_size?: number | null;
          thumbnail_url?: string | null;
          status?: 'sending' | 'sent' | 'delivered' | 'failed'; // Optional: Defaults to 'sent'
          is_ai_generated?: boolean; // Optional: Defaults to false
          created_at?: string; // Optional: Defaults to now()
          updated_at?: string; // Optional: Defaults to now()
          deleted_at?: string | null;
          client_id?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string | null;
          message_type?: 'text' | 'image' | 'file';
          media_url?: string | null;
          media_type?: string | null;
          media_size?: number | null;
          thumbnail_url?: string | null;
          status?: 'sending' | 'sent' | 'delivered' | 'failed';
          is_ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          client_id?: string | null;
        };
      };
      study_sessions: {
        // Represents a scheduled study session between matched users
        Row: {
          id: string; // UUID primary key
          match_id: string; // Foreign key to matches table
          date: string; // Date of the session (ISO date format)
          time_start: string; // Start time (HH:MM format)
          time_end: string; // End time (HH:MM format)
          location: string | null; // Optional location (e.g., "Library Room 204")
          notes: string | null; // Optional session notes
          status: 'scheduled' | 'completed' | 'cancelled'; // Current state of the session
        };
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          match_id: string; // Required
          date: string; // Required
          time_start: string; // Required
          time_end: string; // Required
          location?: string | null;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled'; // Optional: Defaults to 'scheduled'
        };
        Update: {
          id?: string;
          match_id?: string;
          date?: string;
          time_start?: string;
          time_end?: string;
          location?: string | null;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled';
        };
      };
      swipe_actions: {
        // Represents a user's swipe action (like/skip) on another user's profile
        Row: {
          id: string; // UUID primary key
          user_id: string; // Foreign key to users table (who swiped)
          target_user_id: string; // Foreign key to users table (who was swiped on)
          action: 'like' | 'skip'; // Type of swipe action
          created_at: string; // Timestamp of the swipe
        };
        Insert: {
          id?: string; // Optional: UUID auto-generated if not provided
          user_id: string; // Required
          target_user_id: string; // Required
          action: 'like' | 'skip'; // Required
          created_at?: string; // Optional: Defaults to now()
        };
        Update: {
          id?: string;
          user_id?: string;
          target_user_id?: string;
          action?: 'like' | 'skip';
          created_at?: string;
        };
      };
      nests: {
        Row: {
          id: string;
          name: string;
          subject: string;
          class_name: string | null;
          description: string | null;
          university: string;
          created_by: string;
          member_limit: number;
          is_auto_created: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          class_name?: string | null;
          description?: string | null;
          university: string;
          created_by: string;
          member_limit?: number;
          is_auto_created?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          class_name?: string | null;
          description?: string | null;
          university?: string;
          created_by?: string;
          member_limit?: number;
          is_auto_created?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      nest_members: {
        Row: {
          id: string;
          nest_id: string;
          user_id: string;
          role: 'creator' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          nest_id: string;
          user_id: string;
          role?: 'creator' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          nest_id?: string;
          user_id?: string;
          role?: 'creator' | 'member';
          joined_at?: string;
        };
      };
      nest_messages: {
        Row: {
          id: string;
          nest_id: string;
          sender_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          nest_id: string;
          sender_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          nest_id?: string;
          sender_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };
    // Database views - read-only virtual tables
    Views: {
      users_with_photos: {
        // View that filters users who have uploaded profile photos
        // Defined in migration 20241020000003_profile_picture_storage.sql
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          university: string | null;
          major: string | null;
          year: string | null;
          bio: string | null;
          profile_photo_url: string | null;
          has_profile_photo: boolean;
          profile_photo_uploaded_at: string | null;
          preferred_subjects: string[] | null;
          availability: WeeklyAvailability | null;
          created_at: string;
        };
      };
    };
    // Database functions - stored procedures callable via RPC
    Functions: {
      complete_user_onboarding: {
        // Function to complete user onboarding atomically
        // Defined in migration 20241020000004_user_onboarding.sql
        Args: {
          p_user_id: string; // User ID to update
          p_full_name: string; // User's full name
          p_major: string; // User's major
          p_year: string; // Academic year
          p_bio: string | null; // Optional bio
          p_preferred_subjects: string[]; // Array of subjects
          p_availability: WeeklyAvailability | null; // Optional availability schedule
          p_study_style: 'quiet' | 'with_music' | 'group_discussion' | 'teach_each_other' | null; // How user prefers to study
          p_study_goals: 'ace_exams' | 'understand_concepts' | 'just_pass' | 'make_friends' | null; // What user wants to achieve
        };
        // Returns the complete updated user record
        Returns: Database['public']['Tables']['users']['Row'];
      };
      validate_university_email: {
        // Function to validate university email format
        // Defined in migration 20241020000002_university_email_validation.sql
        Args: { email: string };
        Returns: boolean; // True if email is valid university email
      };
      extract_university_from_email: {
        // Function to extract university name from email domain
        // Defined in migration 20241020000002_university_email_validation.sql
        Args: { email: string };
        Returns: string; // University name (e.g., "Stanford")
      };
      increment_match_messages: {
        // Function to increment message count for a match
        // Defined in migration 20241024000006_add_match_success_tracking.sql
        Args: { p_match_id: string }; // Match ID to update
        Returns: void; // No return value
      };
      update_user_match_stats: {
        // Function to recalculate and update user match statistics
        // Defined in migration 20241024000006_add_match_success_tracking.sql
        Args: { user_id: string }; // User ID to update stats for
        Returns: void; // No return value
      };
    };
    // Enums - no custom enums defined in this database
    Enums: Record<string, never>;
    // Composite types - no custom composite types defined
    CompositeTypes: Record<string, never>;
  };
};

// Create and export the Supabase client with typed database schema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) as any; // Using 'as any' to bypass incomplete type definitions

// Helper types for better developer experience
// These provide shorter, more convenient type names for common operations

// Type for a complete user record from the database
export type User = Database['public']['Tables']['users']['Row'];
// Type for inserting a new user record
export type UserInsert = Database['public']['Tables']['users']['Insert'];
// Type for updating an existing user record
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Type for a complete match record
export type Match = Database['public']['Tables']['matches']['Row'];
// Type for a complete conversation record
export type Conversation = Database['public']['Tables']['conversations']['Row'];
// Type for a complete message record
export type Message = Database['public']['Tables']['messages']['Row'];
// Type for a complete study session record
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
// Type for a complete swipe action record
export type SwipeAction = Database['public']['Tables']['swipe_actions']['Row'];