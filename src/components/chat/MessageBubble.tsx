// =====================================================
// MESSAGE BUBBLE COMPONENT - PHASE 2
// =====================================================
// Displays a single chat message bubble
// Shows text content and timestamp
// Phase 9 will add image support, Phase 10 will add file support

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { MessageWithSender, NestMessageWithSender } from '@/types/chat';
import { formatMessageTime } from '@/services/chat';

interface MessageBubbleProps {
  message: MessageWithSender | NestMessageWithSender;
  isCurrentUser: boolean;
  showSender?: boolean; // For group messages
}

export function MessageBubble({ message, isCurrentUser, showSender = false }: MessageBubbleProps) {
  const senderName = 'sender' in message ? message.sender?.full_name : null;
  const senderAvatar = 'sender' in message ? message.sender?.profile_photo_url : null;

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        showSender && !isCurrentUser && styles.groupMessageContainer,
      ]}
    >
      {/* Sender avatar for group messages */}
      {showSender && !isCurrentUser && (
        <Image
          source={{ uri: senderAvatar || 'https://via.placeholder.com/32' }}
          style={styles.senderAvatar}
        />
      )}

      <View style={styles.messageContent}>
        {/* Sender name for group messages */}
        {showSender && !isCurrentUser && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        <View
          style={[
            styles.bubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            showSender && !isCurrentUser && styles.groupMessageBubble,
          ]}
        >
          {/* Message Content */}
          {message.content && (
            <Text
              style={[
                styles.text,
                isCurrentUser ? styles.currentUserText : styles.otherUserText,
              ]}
            >
              {message.content}
            </Text>
          )}

          {/* Timestamp and Status */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.timestamp,
                isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp,
              ]}
            >
              {formatMessageTime(message.created_at)}
            </Text>

            {/* Status indicator (only for current user) */}
            {isCurrentUser && 'status' in message && (
              <Text style={styles.statusIndicator}>
                {message.status === 'sending' && '⏳'}
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'failed' && '✗'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    flexDirection: 'row',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  groupMessageContainer: {
    alignItems: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  groupMessageBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  statusIndicator: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
