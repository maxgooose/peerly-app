// =====================================================
// CHAT INPUT COMPONENT - PHASE 3
// =====================================================
// Text input with send button for sending messages
// Includes character limit and empty state handling

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = text.trim().length > 0 && !sending && !disabled;

  async function handleSend() {
    if (!canSend) return;

    const messageContent = text.trim();
    setText(''); // Clear input immediately for better UX
    setSending(true);

    try {
      await onSend(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore text on error
      setText(messageContent);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Text Input */}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
          editable={!disabled && !sending}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={canSend ? '#FFFFFF' : '#C7C7CC'}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Character count (optional - shown when close to limit) */}
      {text.length > 800 && (
        <Text style={styles.charCount}>
          {text.length}/1000
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#000000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});
