import { createClient } from '@supabase/supabase-js'

// Framework-agnostic environment variables
// Set these in your .env file (or .env.local for Next.js, .env for Expo, etc.)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you'll generate these later with supabase gen types)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          university: string | null
          major: string | null
          year: string | null
          bio: string | null
          profile_photo_url: string | null
          preferred_subjects: string[] | null
          availability: any | null
          last_auto_match_cycle: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          university?: string | null
          major?: string | null
          year?: string | null
          bio?: string | null
          profile_photo_url?: string | null
          preferred_subjects?: string[] | null
          availability?: any | null
          last_auto_match_cycle?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          university?: string | null
          major?: string | null
          year?: string | null
          bio?: string | null
          profile_photo_url?: string | null
          preferred_subjects?: string[] | null
          availability?: any | null
          last_auto_match_cycle?: string | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          match_type: 'auto' | 'manual'
          status: 'pending' | 'active' | 'unmatched'
          matched_at: string
          ai_message_sent: boolean
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          match_type: 'auto' | 'manual'
          status?: 'pending' | 'active' | 'unmatched'
          matched_at?: string
          ai_message_sent?: boolean
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          match_type?: 'auto' | 'manual'
          status?: 'pending' | 'active' | 'unmatched'
          matched_at?: string
          ai_message_sent?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          is_ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          is_ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          is_ai_generated?: boolean
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          match_id: string
          date: string
          time_start: string
          time_end: string
          location: string | null
          notes: string | null
          status: 'scheduled' | 'completed' | 'cancelled'
        }
        Insert: {
          id?: string
          match_id: string
          date: string
          time_start: string
          time_end: string
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled'
        }
        Update: {
          id?: string
          match_id?: string
          date?: string
          time_start?: string
          time_end?: string
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled'
        }
      }
      swipe_actions: {
        Row: {
          id: string
          user_id: string
          target_user_id: string
          action: 'like' | 'skip'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_user_id: string
          action: 'like' | 'skip'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_user_id?: string
          action?: 'like' | 'skip'
          created_at?: string
        }
      }
    }
  }
}
