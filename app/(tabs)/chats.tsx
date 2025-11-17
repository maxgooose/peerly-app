// =====================================================
// CHATS SCREEN - PHASE 2 + NESTS
// =====================================================
// Lists all conversations sorted by recent activity
// Now includes segmented control for Direct chats and Nests

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { getConversations, getOtherUser, formatMessageTime } from '@/services/chat';
import { getNestsForUser } from '@/services/nests';
import { NestCard } from '@/components/nest/NestCard';
import type { ConversationWithMatch, NestWithMembers } from '@/types/chat';

export default function ChatsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithMatch[]>([]);
  const [nests, setNests] = useState<NestWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'nests'>('direct');

  useEffect(() => {
    loadCurrentUser();
    loadData();
  }, []);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadData() {
    try {
      await Promise.all([
        loadConversations(),
        loadNests(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadConversations() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  async function loadNests() {
    try {
      const data = await getNestsForUser();
      setNests(data);
    } catch (error) {
      console.error('Error loading nests:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  function handleConversationPress(conversation: ConversationWithMatch) {
    router.push(`/chat/${conversation.id}` as any);
  }

  function handleNestPress(nest: NestWithMembers) {
    router.push(`/nest/${nest.id}` as any);
  }

  function renderConversation({ item }: { item: ConversationWithMatch }) {
    if (!currentUserId) return null;

    const otherUser = getOtherUser(item, currentUserId);
    
    // Check if this is a new match (matched in last 2 hours) with AI message
    const isNewMatch = item.match && 
      new Date(item.match.matched_at) > new Date(Date.now() - 2 * 60 * 60 * 1000) &&
      item.match.match_type === 'auto';

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isNewMatch && styles.conversationItemHighlight
        ]}
        onPress={() => handleConversationPress(item)}
      >
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          {otherUser.profile_photo_url ? (
            <Image
              source={{ uri: otherUser.profile_photo_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {otherUser.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* New Match Indicator */}
          {isNewMatch && (
            <View style={styles.newMatchBadge}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser.full_name || 'Unknown User'}
            </Text>
            {item.last_message_at && (
              <Text style={styles.timestamp}>
                {formatMessageTime(item.last_message_at)}
              </Text>
            )}
          </View>

          <View style={styles.lastMessageRow}>
            {isNewMatch && (
              <View style={styles.newTag}>
                <Text style={styles.newTagText}>NEW</Text>
              </View>
            )}
            <Text style={[
              styles.lastMessage,
              isNewMatch && styles.lastMessageBold
            ]} numberOfLines={1}>
              {item.last_message_content || 'No messages yet'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderNest({ item }: { item: NestWithMembers }) {
    return (
      <NestCard
        nest={item}
        onPress={() => handleNestPress(item)}
        lastMessage={undefined} // TODO: Add last message support
      />
    );
  }

  function renderEmptyState() {
    if (activeTab === 'direct') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Conversations Yet</Text>
          <Text style={styles.emptyStateText}>
            Your conversations will appear here once you match with someone.
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Nests Yet</Text>
          <Text style={styles.emptyStateText}>
            Join study groups or create your own to start collaborating.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/nest/create')}
          >
            <Text style={styles.createButtonText}>Create Nest</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  function renderSegmentedControl() {
    return (
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'direct' && styles.activeSegment,
          ]}
          onPress={() => setActiveTab('direct')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'direct' && styles.activeSegmentText,
            ]}
          >
            Direct
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            activeTab === 'nests' && styles.activeSegment,
          ]}
          onPress={() => setActiveTab('nests')}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'nests' && styles.activeSegmentText,
            ]}
          >
            Nests
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5FBF" />
      </View>
    );
  }

  const currentData = activeTab === 'direct' ? conversations : nests;
  const isEmpty = currentData.length === 0;

  // Type-safe render handler
  const renderItem = ({ item }: { item: ConversationWithMatch | NestWithMembers }) => {
    if (activeTab === 'direct') {
      return renderConversation({ item: item as ConversationWithMatch });
    } else {
      return renderNest({ item: item as NestWithMembers });
    }
  };

  return (
    <View style={styles.container}>
      {renderSegmentedControl()}
      
      <FlatList
        data={currentData as any}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={isEmpty ? styles.emptyListContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5FBF"
          />
        }
      />
    </View>
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
  emptyListContainer: {
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    margin: 16,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeSegmentText: {
    color: '#8B5FBF',
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#8B5FBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessageBold: {
    fontWeight: '600',
    color: '#000000',
  },
  conversationItemHighlight: {
    backgroundColor: '#F0F8FF',
  },
  newMatchBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8B5FBF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  newTag: {
    backgroundColor: '#8B5FBF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  newTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#8B5FBF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
