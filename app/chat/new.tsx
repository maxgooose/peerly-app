// app/chat/new.tsx
// -----------------------------------------------------------------------------
// FRONT-END CHAT PROTOTYPE (no backend calls)
// -----------------------------------------------------------------------------
// - Works offline with local state so you can demo UX immediately
// - Includes typing indicator, timestamps, and day separators
// - Clearly marked BACKEND HOOKS show where to connect Supabase later
//
// When backend is ready, you'll typically:
//   1) Create or fetch a conversation_id (server RPC) after a match
//   2) Navigate to /chat/[id] instead of /chat/new
//   3) Replace local state here with:
//        - initial load: getMessages(conversation_id, { limit })
//        - send: insert into messages; optimistic update; confirm on ack
//        - realtime: subscribe to messages channel for conversation_id
//        - pagination: fetch older messages when scrolled to top
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

type LocalMessage = {
  id: string;
  senderId: 'me' | 'them';
  text: string;
  createdAt: string; // ISO string
};

type DaySeparatorItem = {
  type: 'separator';
  key: string;      // e.g., '2025-10-28'
  label: string;    // e.g., 'Today'
};

type RenderItem = LocalMessage | DaySeparatorItem;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dayLabel(d: Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, name, photo } = useLocalSearchParams<{
    userId?: string;
    name?: string;
    photo?: string;
  }>();

  // ---------------------------------------------------------------------------
  // LOCAL-ONLY STATE (replace this with Supabase when backend is ready)
  // ---------------------------------------------------------------------------
  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 'seed-1',
      senderId: 'them',
      text: `Hi! I'm ${name || 'your match'} 👋`,
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const listRef = useRef<FlatList<RenderItem>>(null);

  // Scroll to bottom on first mount and whenever messages grow
  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [messages.length]);

  const title = useMemo(() => (name ? String(name) : 'New Chat'), [name]);

  // Build the render list with day separators
  const renderData: RenderItem[] = useMemo(() => {
    const items: RenderItem[] = [];
    let lastDate: Date | null = null;

    messages.forEach((m) => {
      const d = new Date(m.createdAt);
      if (!lastDate || !isSameDay(d, lastDate)) {
        items.push({
          type: 'separator',
          key: d.toISOString().slice(0, 10),
          label: dayLabel(d),
        } as DaySeparatorItem);
        lastDate = d;
      }
      items.push(m);
    });

    return items;
  }, [messages]);

  // ----------------------------------------------------------------------------
  // SEND MESSAGE (frontend-only)
  // ----------------------------------------------------------------------------
  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const optimistic: LocalMessage = {
      id: `local-${Date.now()}`,
      senderId: 'me',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    // DEMO: simulate partner typing back after a short delay
    setPartnerTyping(true);
    setTimeout(() => {
      setPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          senderId: 'them',
          text: 'Sounds good! 👌',
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 1200);

    // ------------------------- BACKEND HOOK -------------------------
    // 1) If conversation_id doesn't exist yet, call an RPC to:
    //      - create or fetch a conversation for (me, userId)
    //    Response: { conversation_id }
    // 2) Insert message into messages table:
    //    await supabase.from('messages').insert({
    //      conversation_id,
    //      sender_id: currentUserId,
    //      content: trimmed,
    //      type: 'text'
    //    });
    // 3) Optimistic UI: keep the local message; on insert success, replace local id.
    // 4) Realtime: a channel subscription will push partner messages.
    // ----------------------------------------------------------------
  }

  // ----------------------------------------------------------------------------
  // RENDERERS
  // ----------------------------------------------------------------------------
  function renderItem({ item }: { item: RenderItem }) {
    if ('type' in item && item.type === 'separator') {
      return (
        <View style={styles.separatorWrap}>
          <Text style={styles.separatorText}>{item.label}</Text>
        </View>
      );
    }

    const mine = item.senderId === 'me';
    const d = new Date(item.createdAt);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
        {!mine && !!photo && (
          <Image source={{ uri: String(photo) }} style={styles.avatar} />
        )}
        <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.msgText, mine && { color: 'white' }]}>{item.text}</Text>
          <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.85)' }]}>{time}</Text>
        </View>
      </View>
    );
  }

  function keyExtractor(item: RenderItem) {
    if ('type' in item && item.type === 'separator') return `sep-${item.key}`;
    return (item as LocalMessage).id;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        {!!photo && <Image source={{ uri: String(photo) }} style={styles.headerAvatar} />}
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={renderData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      {/* Typing indicator (simulated) */}
      {partnerTyping && (
        <View style={[styles.typingWrap, { bottom: 60 + (insets.bottom || 0) }]}>
          <Image source={{ uri: String(photo || '') }} style={styles.typingAvatar} />
          <View style={styles.typingBubble}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      )}

      {/* Composer (safe-area aware) */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.composer,
          { paddingBottom: Math.max(10, insets.bottom || 0), paddingRight: Math.max(10, insets.right || 0) }
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ----------------------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { paddingRight: 8, paddingVertical: 4 },
  backText: { fontSize: 28, lineHeight: 28, color: '#222' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', flexShrink: 1 },

  listContent: { padding: 12, paddingBottom: 6 },

  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },

  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleThem: { backgroundColor: 'white', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E5EA' },
  bubbleMe: { backgroundColor: '#007AFF' },

  msgText: { fontSize: 15, color: '#111' },
  time: { fontSize: 11, marginTop: 4, color: '#666', alignSelf: 'flex-end' },

  separatorWrap: {
    alignSelf: 'center',
    backgroundColor: '#E9E9ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  separatorText: { fontSize: 12, color: '#555' },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingLeft: 10,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#A67B5B',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: 'white', fontWeight: '600' },

  // Typing indicator
  typingWrap: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 6 },
  typingBubble: {
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A0A0A6',
  },
});
