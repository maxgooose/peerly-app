// =====================================================
// CHAT SERVICE - PHASE 2 & 3
// =====================================================
// Service for fetching conversations and messages
// Phase 3: Added sending functionality with optimistic updates

import { supabase } from './supabase';
import type { ConversationWithMatch, MessageWithSender, Message } from '@/types/chat';

/**
 * Get all conversations for the current user
 * Sorted by most recent activity
 */
export async function getConversations(): Promise<ConversationWithMatch[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch conversations with match and user details
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        match:matches!conversations_match_id_fkey (
          id,
          user1_id,
          user2_id,
          status,
          user1:users!matches_user1_id_fkey (
            id,
            full_name,
            profile_photo_url
          ),
          user2:users!matches_user2_id_fkey (
            id,
            full_name,
            profile_photo_url
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return (data || []) as unknown as ConversationWithMatch[];
  } catch (error) {
    console.error('getConversations error:', error);
    throw error;
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<ConversationWithMatch | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        match:matches!conversations_match_id_fkey (
          id,
          user1_id,
          user2_id,
          status,
          user1:users!matches_user1_id_fkey (
            id,
            full_name,
            profile_photo_url
          ),
          user2:users!matches_user2_id_fkey (
            id,
            full_name,
            profile_photo_url
          )
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }

    return data as unknown as ConversationWithMatch;
  } catch (error) {
    console.error('getConversation error:', error);
    return null;
  }
}

/**
 * Get messages for a conversation with pagination support
 * Phase 5: Added pagination parameters for loading older messages
 */
export async function getMessages(
  conversationId: string, 
  options?: {
    limit?: number;
    before?: string; // timestamp for cursor-based pagination
  }
): Promise<MessageWithSender[]> {
  try {
    const limit = options?.limit || 50;
    const before = options?.before;

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null) // Don't show deleted messages
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add cursor-based pagination
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    // Reverse to show oldest first (chat UI convention)
    return ((data || []) as unknown as MessageWithSender[]).reverse();
  } catch (error) {
    console.error('getMessages error:', error);
    throw error;
  }
}

/**
 * Get the other user in a conversation (not the current user)
 */
export function getOtherUser(conversation: ConversationWithMatch, currentUserId: string) {
  const { match } = conversation;

  if (match.user1_id === currentUserId) {
    return match.user2;
  } else {
    return match.user1;
  }
}

/**
 * Format timestamp for display
 * Shows time if today, date if this week, full date otherwise
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get conversation by match ID
 * Creates a new conversation if it doesn't exist
 */
export async function getOrCreateConversation(matchId: string): Promise<string | null> {
  try {
    // First, try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('match_id', matchId)
      .single();

    if (existing) {
      return existing.id;
    }

    // If not found, create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({ match_id: matchId })
      .select('id')
      .single();

    if (createError || !newConv) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConv.id;
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    return null;
  }
}

/**
 * Send a text message
 * Returns optimistic message immediately, then updates with server response
 * Phase 3: New function
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  clientId?: string;
}): Promise<Message> {
  const clientId = params.clientId || `temp_${Date.now()}_${Math.random()}`;

  // Create optimistic message object
  const optimisticMessage: Message = {
    id: clientId, // Temporary ID
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    content: params.content,
    message_type: 'text',
    media_url: null,
    media_type: null,
    media_size: null,
    thumbnail_url: null,
    status: 'sending',
    is_ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    client_id: clientId,
  };

  try {
    // Insert into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
        message_type: 'text',
        status: 'sent',
        client_id: clientId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data as Message;
  } catch (error) {
    console.error('sendMessage error:', error);
    // Return optimistic message with failed status
    return {
      ...optimisticMessage,
      status: 'failed',
    };
  }
}

/**
 * Retry sending a failed message
 * Phase 3: New function
 */
export async function retryMessage(message: Message): Promise<Message> {
  if (!message.sender_id) {
    throw new Error('Cannot retry message without sender_id');
  }

  return sendMessage({
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content || '',
    clientId: message.client_id || undefined,
  });
}
