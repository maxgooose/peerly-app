// =====================================================
// CHAT TYPES
// =====================================================
// TypeScript types for the chat system
// These match the database schema from Phase 1

export type MessageType = 'text' | 'image' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

// Database table types
export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  message_type: MessageType;
  media_url: string | null;
  media_type: string | null;
  media_size: number | null;
  thumbnail_url: string | null;
  status: MessageStatus;
  is_ai_generated: boolean;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client_id: string | null;
}

// Extended types with joined data (for UI)
export interface ConversationWithMatch extends Conversation {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    status: string;
    match_type: 'auto' | 'manual';
    matched_at: string;
    ai_message_sent: boolean;
    user1: {
      id: string;
      full_name: string | null;
      profile_photo_url: string | null;
    };
    user2: {
      id: string;
      full_name: string | null;
      profile_photo_url: string | null;
    };
  };
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    full_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

export interface ReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

// Types for creating messages
export interface CreateMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  clientId?: string;
}

export interface CreateMediaMessageParams {
  conversationId: string;
  senderId: string;
  file: {
    uri: string;
    type: string;
    name: string;
  };
  messageType: 'image' | 'file';
  caption?: string;
}

// =====================================================
// NEST TYPES
// =====================================================
// TypeScript types for the Nests (study groups) system

export interface Nest {
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
}

export interface NestMember {
  id: string;
  nest_id: string;
  user_id: string;
  role: 'creator' | 'member';
  joined_at: string;
  user: {
    id: string;
    full_name: string | null;
    profile_photo_url: string | null;
  };
}

export interface NestMessage {
  id: string;
  nest_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NestWithMembers extends Nest {
  members: NestMember[];
  member_count: number;
}

export interface NestMessageWithSender extends NestMessage {
  sender: {
    id: string;
    full_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

// Types for creating/joining nests
export interface CreateNestParams {
  name: string;
  subject: string;
  class_name?: string;
  description?: string;
  member_limit?: number;
}

export interface JoinNestParams {
  nestId: string;
}

export interface SendNestMessageParams {
  nestId: string;
  content: string;
  senderId: string;
}

export interface SearchNestsParams {
  subject?: string;
  university?: string;
  search?: string; // Search by name or class_name
  limit?: number;
}
