// =====================================================
// CHAT DETAIL SCREEN - PHASE 2, 3 & 4
// =====================================================
// Displays messages in a conversation
// Phase 3: Added sending functionality with optimistic updates
// Phase 4: Added real-time updates with Supabase Realtime

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/services/supabase';
import { getMessages, getConversation, getOtherUser, sendMessage } from '@/services/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import type { MessageWithSender, ConversationWithMatch, Message } from '@/types/chat';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [conversation, setConversation] = useState<ConversationWithMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Phase 5: Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadCurrentUser();
      loadConversation();
      loadMessages();
    }
  }, [id]);

  // Phase 4: Real-time subscription
  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    console.log('📡 Setting up real-time subscription for conversation:', id);

    // Create Realtime channel
    const channel = supabase
      .channel(`conversation:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          handleRealtimeMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          console.log('🔄 Message updated:', payload);
          handleRealtimeMessageUpdate(payload.new as Message);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadConversation() {
    if (!id || typeof id !== 'string') return;
    try {
      const data = await getConversation(id);
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  async function loadMessages() {
    if (!id || typeof id !== 'string') return;
    try {
      const data = await getMessages(id, { limit: 50 });
      setMessages(data);
      
      // Phase 5: Set pagination state
      if (data.length > 0) {
        setOldestMessageTimestamp(data[0].created_at);
        setHasMoreMessages(data.length === 50); // If we got exactly 50, there might be more
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  // Phase 4: Handle incoming real-time messages
  function handleRealtimeMessage(message: Message) {
    // Don't add if it's our own optimistic message (already in state)
    setMessages((prev) => {
      // Check if message already exists by ID or client_id
      const exists = prev.some(
        (m) =>
          m.id === message.id ||
          (message.client_id && m.client_id === message.client_id)
      );

      if (exists) {
        console.log('⏭️  Message already exists, skipping');
        return prev;
      }

      console.log('✅ Adding new real-time message to state');

      // Create MessageWithSender object
      const newMessage: MessageWithSender = {
        ...message,
        sender: {
          id: message.sender_id || '',
          full_name: null,
          profile_photo_url: null,
        },
      };

      // Add to end of array (newest messages at bottom)
      const updated = [...prev, newMessage];

      // Auto-scroll to bottom if not from current user
      if (message.sender_id !== currentUserId) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      return updated;
    });
  }

  // Phase 4: Handle message status updates
  function handleRealtimeMessageUpdate(message: Message) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === message.id) {
          return {
            ...m,
            ...message,
          };
        }
        return m;
      })
    );
  }

  // Phase 5: Load older messages for pagination
  async function loadOlderMessages() {
    if (!id || typeof id !== 'string' || !hasMoreMessages || loadingOlderMessages || !oldestMessageTimestamp) {
      return;
    }

    setLoadingOlderMessages(true);

    try {
      const olderMessages = await getMessages(id, {
        limit: 50,
        before: oldestMessageTimestamp,
      });

      if (olderMessages.length === 0) {
        // No more messages
        setHasMoreMessages(false);
      } else {
        // Prepend older messages to existing messages
        setMessages((prev) => {
          // Create a map to avoid duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = olderMessages.filter(m => !existingIds.has(m.id));
          
          return [...newMessages, ...prev];
        });

        // Update cursor for next page
        setOldestMessageTimestamp(olderMessages[0].created_at);
        
        // If we got less than 50 messages, we've reached the end
        if (olderMessages.length < 50) {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  function renderMessage({ item }: { item: MessageWithSender }) {
    if (!currentUserId) return null;

    const isCurrentUser = item.sender_id === currentUserId;

    return <MessageBubble message={item} isCurrentUser={isCurrentUser} />;
  }

  async function handleSendMessage(content: string) {
    if (!currentUserId || !id || typeof id !== 'string') {
      console.error('Missing currentUserId or conversation id');
      return;
    }

    try {
      // Create optimistic message to show immediately
      const optimisticMessage: MessageWithSender = {
        id: `temp_${Date.now()}`,
        conversation_id: id,
        sender_id: currentUserId,
        content,
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
        client_id: `temp_${Date.now()}_${Math.random()}`,
        sender: {
          id: currentUserId,
          full_name: null,
          profile_photo_url: null,
        },
      };

      // Add optimistic message to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send to server
      const sentMessage = await sendMessage({
        conversationId: id,
        senderId: currentUserId,
        content,
        clientId: optimisticMessage.client_id || undefined,
      });

      // Update the optimistic message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_id === optimisticMessage.client_id
            ? {
                ...sentMessage,
                sender: optimisticMessage.sender,
              } as MessageWithSender
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith('temp_') && msg.created_at === new Date().toISOString()
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    }
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No messages yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Start the conversation by sending a message!
        </Text>
      </View>
    );
  }

  // Get header title (other user's name)
  const headerTitle = conversation && currentUserId
    ? getOtherUser(conversation, currentUserId).full_name || 'Chat'
    : 'Chat';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      {/* Custom header with user name */}
      <Stack.Screen
        options={{
          title: headerTitle,
          headerBackTitle: 'Chats',
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            messages.length === 0
              ? styles.emptyListContainer
              : styles.messageList
          }
          ListEmptyComponent={renderEmptyState}
          inverted={false}
          // Phase 5: Pagination
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            loadingOlderMessages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading older messages...</Text>
              </View>
            ) : null
          }
        />

        {/* Chat Input - Phase 3 */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={!currentUserId}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  messageList: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  // Phase 5: Pagination loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
});
