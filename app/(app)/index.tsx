/**
 * ============================================================
 *  MAIN CHAT SCREEN
 *
 *  This is your app's home screen. The agent is ready to go.
 *
 *  TO CUSTOMISE FOR YOUR APP:
 *  1. Change systemPrompt to define your agent's personality/role
 *  2. Change placeholder to match your use case
 *  3. Change assistantName to your agent's name
 *  4. The agent will automatically use whatever tools are enabled
 *     in features.ts — no extra wiring needed
 *
 *  EXAMPLE — Tennis app:
 *    systemPrompt: `You are an expert tennis coach. When users ask
 *    about techniques, search YouTube for top instructional videos.
 *    When they share a video, analyse their form and suggest
 *    improvements with specific YouTube drills to practice.`
 * ============================================================
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgent } from '../../src/hooks/useAgent';
import { AgentChat } from '../../src/components/chat/AgentChat';
import { useAuth } from '../../src/lib/auth.context';
import { FEATURES } from '../../src/config/features';

// ── CUSTOMISE THIS PER PROJECT ─────────────────────────────────
const AGENT_CONFIG = {
  systemPrompt: `You are a helpful AI assistant with access to powerful tools.

You can:
- Search YouTube for videos on any topic
- Save interesting content to the user's library
- Analyse photos and videos using your vision capability
- Search the web for information (if enabled)

Always be concise and helpful. When you find YouTube videos,
present them in a structured way the user can tap to watch.
When asked to save something, confirm what you saved.`,

  temperature: 0.7,
};

const ASSISTANT_NAME = 'AI Agent'; // ← change this
const PLACEHOLDER = 'Ask me anything…'; // ← change this
// ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const agent = useAgent({
    config: AGENT_CONFIG,
    onError: (err) => console.error('[ChatScreen]', err),
  });

  const handleCameraPress = useCallback(() => {
    if (FEATURES.camera) router.push('/(app)/camera');
  }, [router]);

  return (
    <View style={styles.container}>
      <AgentChat
        {...agent}
        assistantName={ASSISTANT_NAME}
        placeholder={PLACEHOLDER}
        onCameraPress={FEATURES.camera ? handleCameraPress : undefined}
        style={styles.chat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52 },
  chat: { flex: 1 },
});
