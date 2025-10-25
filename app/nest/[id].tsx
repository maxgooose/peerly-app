import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { 
  getNestById, 
  getNestMessages, 
  sendNestMessage,
  isUserMemberOfNest 
} from '@/services/nests';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { NestMembersModal } from '@/components/nest/NestMembersModal';
import type { NestWithMembers, NestMessageWithSender } from '@/types/chat';

export default function NestChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const [nest, setNest] = useState<NestWithMembers | null>(null);
  const [messages, setMessages] = useState<NestMessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const currentUserId = supabase.auth.getUser().then(user => user.data.user?.id);

  useEffect(() => {
    initializeNest();
    subscribeToMessages();
    
    return () => {
      // Cleanup subscription
      supabase.removeAllChannels();
    };
  }, [id]);

  const initializeNest = async () => {
    try {
      setLoading(true);
      
      // Check if user is a member
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        router.back();
        return;
      }

      const memberCheck = await isUserMemberOfNest(id, userId);
      if (!memberCheck) {
        Alert.alert('Access Denied', 'You are not a member of this nest.');
        router.back();
        return;
      }

      setIsMember(true);

      // Load nest data
      const nestData = await getNestById(id);
      if (!nestData) {
        Alert.alert('Error', 'Nest not found.');
        router.back();
        return;
      }

      setNest(nestData);

      // Load initial messages
      await loadMessages();
    } catch (error) {
      console.error('Error initializing nest:', error);
      Alert.alert('Error', 'Failed to load nest.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await getNestMessages(id, { limit: 50 });
      setMessages(messagesData);
      setHasMoreMessages(messagesData.length === 50);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadOlderMessages = async () => {
    if (!hasMoreMessages || loadingOlderMessages || messages.length === 0) {
      return;
    }

    try {
      setLoadingOlderMessages(true);
      const oldestMessage = messages[messages.length - 1];
      const olderMessages = await getNestMessages(id, {
        limit: 50,
        before: oldestMessage.created_at,
      });

      if (olderMessages.length > 0) {
        setMessages(prev => [...prev, ...olderMessages]);
        setHasMoreMessages(olderMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`nest:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nest_messages',
          filter: `nest_id=eq.${id}`,
        },
        async (payload) => {
          const newMessage = payload.new as NestMessageWithSender;
          
          // Get sender info
          const { data: sender } = await supabase
            .from('users')
            .select('id, full_name, profile_photo_url')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender: NestMessageWithSender = {
            ...newMessage,
            sender: sender,
          };

          setMessages(prev => [messageWithSender, ...prev]);
          
          // Auto-scroll to bottom for new messages
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }
      )
      .subscribe();

    return channel;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    try {
      setSending(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      await sendNestMessage({
        nestId: id,
        content: content.trim(),
        senderId: userId,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: NestMessageWithSender }) => {
    const userId = currentUserId;
    const isCurrentUser = item.sender_id === userId;
    
    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showSender={true} // Always show sender in group chat
      />
    );
  };

  const renderHeader = () => {
    if (loadingOlderMessages) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading older messages...</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading nest...</Text>
      </View>
    );
  }

  if (!nest || !isMember) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>Unable to load nest</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={() => setMembersModalVisible(true)}
        >
          <Text style={styles.nestName}>{nest.name}</Text>
          <Text style={styles.memberCount}>{nest.member_count} members</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setMembersModalVisible(true)}>
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={loadOlderMessages}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onTyping={() => {}} // TODO: Implement typing indicators for nests
        onStopTyping={() => {}}
      />

      {/* Members Modal */}
      <NestMembersModal
        visible={membersModalVisible}
        onClose={() => setMembersModalVisible(false)}
        members={nest.members}
        nestId={nest.id}
        nestName={nest.name}
        isCreator={nest.created_by === (await currentUserId)}
        onNestDeleted={() => router.back()}
        onMemberLeft={() => router.back()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  nestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  memberCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
