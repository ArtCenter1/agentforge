/**
 * ============================================================
 *  useAgent HOOK
 *
 *  The primary interface between your UI and the Gemini agent.
 *  Drop this into any screen to get full agent capabilities.
 *
 *  Usage:
 *    const agent = useAgent({ systemPrompt: 'You are a tennis coach.' });
 *    <AgentChat {...agent} />
 *
 *  Or manually:
 *    await agent.sendMessage('Show me serve videos');
 *    await agent.analyzePhoto(base64Image, 'Analyse my serve form');
 *
 *  FOR FUTURE AGENTS:
 *  This hook manages:
 *  - Chat history (messages array)
 *  - Agent activity (what tool is being called right now)
 *  - Session persistence via dbService
 *  - Vision analysis requests
 * ============================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { agentService, type AgentMessage, type AgentActivity, type AgentConfig } from '../services/agent.service';
import { dbService } from '../db/db.service';
import { FEATURES } from '../config/features';
import type { ChatSession } from '@google/generative-ai';

interface UseAgentOptions {
  config?: AgentConfig;
  sessionId?: string;    // provide to restore history from DB
  onError?: (err: Error) => void;
}

interface UseAgentReturn {
  messages: AgentMessage[];
  activity: AgentActivity | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  sendMessage: (text: string, imageBase64?: string) => Promise<void>;
  analyzePhoto: (base64: string, prompt: string) => Promise<string>;
  analyzeVideoFrames: (frames: Array<{ base64: string }>, prompt: string) => Promise<string>;
  clearChat: () => void;
}

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const sessionId = useRef(options.sessionId ?? nanoid()).current;
  const chatSession = useRef<ChatSession | null>(null);
  const configRef = useRef(options.config ?? {});

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activity, setActivity] = useState<AgentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise agent + load history on mount
  useEffect(() => {
    agentService.init();
    chatSession.current = agentService.startSession(configRef.current);

    // Load persisted messages if DB enabled
    if (FEATURES.localDatabase && options.sessionId) {
      dbService.getMessages(sessionId).then(saved => {
        if (saved.length > 0) {
          setMessages(saved.map(m => ({
            id: String(m.id ?? nanoid()),
            role: m.role,
            content: m.content,
            toolName: m.toolName,
            imageUri: m.imageUri,
            timestamp: m.timestamp,
          })));
        }
      });
    }

    // Subscribe to agent activity
    const unsub = agentService.onActivity(setActivity);
    return () => unsub();
  }, []);

  const addMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const full: AgentMessage = { ...msg, id: nanoid(), timestamp: Date.now() };
    setMessages(prev => [...prev, full]);

    if (FEATURES.localDatabase) {
      dbService.saveMessage({
        sessionId,
        role: full.role,
        content: full.content,
        toolName: full.toolName,
        imageUri: full.imageUri,
        timestamp: full.timestamp,
      }).catch(console.error);
    }

    return full;
  }, [sessionId]);

  const sendMessage = useCallback(async (text: string, imageBase64?: string) => {
    if (!text.trim() || isLoading || !chatSession.current) return;

    setError(null);
    setIsLoading(true);

    addMessage({ role: 'user', content: text, imageUri: imageBase64 ? 'inline' : undefined });

    try {
      const response = await agentService.sendMessage(
        chatSession.current,
        text,
        imageBase64,
      );
      addMessage({ role: 'agent', content: response });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      options.onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setIsLoading(false);
      setActivity(null);
    }
  }, [isLoading, addMessage, options]);

  const analyzePhoto = useCallback(async (base64: string, prompt: string): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await agentService.analyzeImage(base64, prompt, 'image/jpeg', configRef.current);
      addMessage({ role: 'agent', content: result });
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const analyzeVideoFrames = useCallback(async (
    frames: Array<{ base64: string }>,
    prompt: string
  ): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await agentService.analyzeVideoFrames(frames, prompt, configRef.current);
      addMessage({ role: 'agent', content: result });
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    chatSession.current = agentService.startSession(configRef.current);
    if (FEATURES.localDatabase) {
      dbService.deleteSession(sessionId).catch(console.error);
    }
  }, [sessionId]);

  return {
    messages, activity, isLoading, error, sessionId,
    sendMessage, analyzePhoto, analyzeVideoFrames, clearChat,
  };
}
