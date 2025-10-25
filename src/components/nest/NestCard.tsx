import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NestWithMembers } from '@/types/chat';
import { formatMessageTime } from '@/services/chat';

interface NestCardProps {
  nest: NestWithMembers;
  onPress: () => void;
  lastMessage?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
}

export function NestCard({ nest, onPress, lastMessage }: NestCardProps) {
  // Get subject emoji
  const getSubjectEmoji = (subject: string) => {
    const emojiMap: Record<string, string> = {
      'Computer Science': '💻',
      'Mathematics': '📊',
      'Physics': '⚛️',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'Engineering': '⚙️',
      'Psychology': '🧠',
      'Economics': '💰',
      'Literature': '📚',
      'History': '📜',
      'Art': '🎨',
      'Music': '🎵',
    };
    return emojiMap[subject] || '📖';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getSubjectEmoji(nest.subject)}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {nest.name}
          </Text>
          <Text style={styles.memberCount}>
            {nest.member_count}/{nest.member_limit}
          </Text>
        </View>
        
        <View style={styles.subjectRow}>
          <Text style={styles.subject}>{nest.subject}</Text>
          {nest.class_name && (
            <Text style={styles.className}>• {nest.class_name}</Text>
          )}
        </View>
        
        {lastMessage && (
          <View style={styles.lastMessageRow}>
            <Text style={styles.lastMessageSender}>{lastMessage.sender_name}:</Text>
            <Text style={styles.lastMessageContent} numberOfLines={1}>
              {lastMessage.content}
            </Text>
            <Text style={styles.timestamp}>
              {formatMessageTime(lastMessage.created_at)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  memberCount: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  className: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessageSender: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginRight: 4,
  },
  lastMessageContent: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  arrow: {
    marginLeft: 8,
  },
});
