// =====================================================
// CHAT SERVICE - PHASE 2 & 3
// =====================================================
// Service for fetching conversations and messages
// Phase 3: Added sending functionality with optimistic updates

import { supabase } from './supabase';
import type { ConversationWithMatch, MessageWithSender, Message } from '@/types/chat';
import { checkRateLimitByKey, recordAction } from './rateLimiting';
import { sanitizeMessage } from '@/utils/sanitization';

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
          match_type,
          matched_at,
          ai_message_sent,
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
          match_type,
          matched_at,
          ai_message_sent,
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
      return (existing as any).id;
    }

    // If not found, create new conversation
    const { data: newConv, error: createError } = await (supabase.from('conversations') as any)
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
 * Send an image message
 * Uploads image to Supabase storage and creates message record
 */
export async function sendImageMessage(
  conversationId: string,
  imageUri: string
): Promise<{ success: boolean; data?: Message; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check rate limit before uploading image
    const withinLimit = await checkRateLimitByKey(user.id, 'UPLOAD_IMAGE');
    if (!withinLimit) {
      return { 
        success: false, 
        error: 'Rate limit exceeded. Please wait before uploading another image.' 
      };
    }

    // 1. Upload image to storage
    const fileName = `${conversationId}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    // 3. Create message with image URL
    const { data, error } = await (supabase.from('messages') as any)
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: null,
        message_type: 'image',
        media_url: publicUrl,
        media_type: 'image/jpeg',
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating image message:', error);
      throw error;
    }

    // 4. Update conversation's last message
    await (supabase.from('conversations') as any)
      .update({
        last_message_id: data.id,
        last_message_content: '📷 Image',
        last_message_at: data.created_at,
        last_message_sender_id: user.id,
        updated_at: data.created_at,
      })
      .eq('id', conversationId);

    // Record successful image upload for rate limiting
    await recordAction(user.id, 'image_uploaded', {
      conversation_id: conversationId,
      file_name: fileName
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendImageMessage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send image' 
    };
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

  // Check rate limit before sending message
  const withinLimit = await checkRateLimitByKey(params.senderId, 'SEND_MESSAGE');
  if (!withinLimit) {
    throw new Error('Rate limit exceeded. Please wait before sending another message.');
  }

  // Sanitize message content
  const sanitizedContent = sanitizeMessage(params.content);

  // Create optimistic message object
  const optimisticMessage: Message = {
    id: clientId, // Temporary ID
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    content: sanitizedContent,
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
    const { data, error } = await (supabase.from('messages') as any)
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: sanitizedContent,
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

    // Record successful message send for rate limiting
    await recordAction(params.senderId, 'message_sent', {
      conversation_id: params.conversationId,
      message_length: params.content.length
    });

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
