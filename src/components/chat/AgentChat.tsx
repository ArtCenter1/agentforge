/**
 * ============================================================
 *  AgentChat COMPONENT
 *
 *  Full-featured chat UI wired to the agent.
 *  Supports text messages, image attachments, tool activity
 *  indicators, and YouTube video result cards.
 *
 *  Usage:
 *    const agent = useAgent({ systemPrompt: '...' });
 *    <AgentChat {...agent} placeholder="Ask your coach..." />
 * ============================================================
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Linking, Image, type ViewStyle,
} from 'react-native';
import { FEATURES } from '../../config/features';
import type { AgentMessage, AgentActivity } from '../../services/agent.service';

// ── Video Card (shown when agent returns YouTube results) ──────

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

function VideoCard({ video }: { video: VideoResult }) {
  return (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => Linking.openURL(video.url)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.videoChannel}>{video.channel}</Text>
        <Text style={styles.videoWatch}>▶ Watch on YouTube</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Message bubble ─────────────────────────────────────────────

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === 'user';
  const isTool = msg.role === 'tool';

  // Try to parse YouTube results from agent messages
  let videoResults: VideoResult[] | null = null;
  if (!isUser) {
    try {
      // Agent message may contain embedded JSON with videos
      const jsonMatch = msg.content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.videos?.length > 0) videoResults = parsed.videos;
      }
    } catch { /* not JSON, that's fine */ }
  }

  if (isTool) {
    return (
      <View style={styles.toolRow}>
        <Text style={styles.toolText}>⚡ {msg.toolName?.replace(/_/g, ' ')} — {msg.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.msgRow, isUser ? styles.msgRight : styles.msgLeft]}>
      {!isUser && (
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={isUser ? styles.textUser : styles.textAgent}>
          {msg.content}
        </Text>
        {videoResults && (
          <View style={styles.videoList}>
            {videoResults.slice(0, 5).map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Activity indicator ─────────────────────────────────────────

function ActivityRow({ activity }: { activity: AgentActivity }) {
  const icons: Record<string, string> = {
    thinking: '💭',
    tool_call: '⚡',
    tool_result: '✅',
    done: '✓',
    error: '⚠',
  };
  return (
    <View style={styles.activityRow}>
      <ActivityIndicator size="small" color="#6366f1" style={{ marginRight: 8 }} />
      <Text style={styles.activityText}>
        {icons[activity.type] ?? '•'} {activity.message}
      </Text>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────

interface AgentChatProps {
  messages: AgentMessage[];
  activity: AgentActivity | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat?: () => void;
  onCameraPress?: () => void;  // hook up to camera screen
  placeholder?: string;
  assistantName?: string;
  style?: ViewStyle;
}

export function AgentChat({
  messages, activity, isLoading, error,
  sendMessage, clearChat, onCameraPress,
  placeholder = 'Message…',
  assistantName = 'AI Agent',
  style,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, activity]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  }, [input, isLoading, sendMessage]);

  if (!FEATURES.chatUI) {
    return (
      <View style={styles.disabled}>
        <Text style={styles.disabledText}>Chat UI disabled in features.ts</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.headerTitle}>{assistantName}</Text>
        </View>
        {clearChat && messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearText}>New chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Ready to help</Text>
            <Text style={styles.emptyText}>Ask me anything or record a video for analysis.</Text>
          </View>
        }
      />

      {/* Agent activity */}
      {FEATURES.showAgentActivity && activity && (
        <ActivityRow activity={activity} />
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        {/* Camera button */}
        {FEATURES.camera && onCameraPress && (
          <TouchableOpacity onPress={onCameraPress} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>📷</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={4000}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnOff]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  clearText: { fontSize: 13, color: '#6366f1' },

  list: { padding: 16, paddingBottom: 8, gap: 8 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start', gap: 6 },

  agentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  agentAvatarText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  bubbleAgent: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  textUser: { color: '#fff', fontSize: 15, lineHeight: 22 },
  textAgent: { color: '#111827', fontSize: 15, lineHeight: 22 },

  toolRow: {
    alignSelf: 'center', backgroundColor: '#f0fdf4',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginVertical: 2,
  },
  toolText: { color: '#15803d', fontSize: 12 },

  videoList: { marginTop: 10, gap: 10 },
  videoCard: {
    flexDirection: 'row', backgroundColor: '#f9fafb',
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  videoThumb: { width: 100, height: 70, backgroundColor: '#d1d5db' },
  videoInfo: { flex: 1, padding: 8, gap: 2 },
  videoTitle: { fontSize: 12, fontWeight: '600', color: '#111827' },
  videoChannel: { fontSize: 11, color: '#6b7280' },
  videoWatch: { fontSize: 11, color: '#6366f1', marginTop: 4 },

  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
  },
  activityText: { color: '#6b7280', fontSize: 13 },

  errorBar: {
    backgroundColor: '#fef2f2', borderTopWidth: 1, borderTopColor: '#fecaca',
    padding: 10, paddingHorizontal: 16,
  },
  errorText: { color: '#dc2626', fontSize: 13 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827', maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#c7d2fe' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },

  disabled: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disabledText: { color: '#9ca3af' },
});
