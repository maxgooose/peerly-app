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
