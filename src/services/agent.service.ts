/**
 * ============================================================
 *  GEMINI AGENT SERVICE
 *
 *  This is the core agent engine — the equivalent of what
 *  AionUi calls its "built-in agent".
 *
 *  It implements the full agentic loop:
 *  1. User sends message
 *  2. Gemini responds (sometimes with a tool call request)
 *  3. If tool call → we execute the tool → send result back
 *  4. Gemini reads result → may call another tool or respond
 *  5. Repeat until Gemini gives a final text response
 *
 *  This loop runs automatically. Your UI just calls sendMessage()
 *  and subscribes to onActivity() to show what the agent is doing.
 *
 *  FOR FUTURE AGENTS:
 *  - To add tools: see src/tools/tool.registry.ts
 *  - To change model: edit EXPO_PUBLIC_GEMINI_MODEL in .env
 *  - To add vision: use analyzeImage() or analyzeVideoFrames()
 *  - The systemPrompt is your main lever for app behaviour
 * ============================================================
 */

import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type ChatSession,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai';
import { FEATURES } from '../config/features';
import { ENV } from '../config/env';
import { buildToolRegistry, type RegisteredTool } from '../tools/tool.registry';

// ── Types ──────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'tool';
  content: string;
  toolName?: string;       // set when role === 'tool'
  toolResult?: string;     // set when role === 'tool'
  imageUri?: string;       // set when message has an image/frame
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentActivity {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'done' | 'error';
  message: string;
  toolName?: string;
}

export type ActivityCallback = (activity: AgentActivity) => void;
export type StreamCallback = (token: string) => void;

export interface AgentConfig {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

// ── Agent Service ──────────────────────────────────────────────

class GeminiAgentService {
  private client: GoogleGenerativeAI | null = null;
  private toolRegistry: RegisteredTool[] = [];
  private activityCallbacks: Set<ActivityCallback> = new Set();

  // ── Initialisation ─────────────────────────────────────────

  init() {
    if (!FEATURES.gemini) return;
    this.client = new GoogleGenerativeAI(ENV.gemini.apiKey);
    this.toolRegistry = buildToolRegistry();
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) this.init();
    if (!this.client) throw new Error('Gemini client not initialised');
    return this.client;
  }

  // ── Activity bus ───────────────────────────────────────────

  onActivity(cb: ActivityCallback): () => void {
    this.activityCallbacks.add(cb);
    return () => this.activityCallbacks.delete(cb);
  }

  private emit(activity: AgentActivity) {
    this.activityCallbacks.forEach(cb => cb(activity));
  }

  // ── Build model ────────────────────────────────────────────

  private buildModel(config: AgentConfig = {}): GenerativeModel {
    const toolDeclarations = this.toolRegistry.map(t => t.declaration as FunctionDeclaration);

    return this.getClient().getGenerativeModel({
      model: config.model ?? ENV.gemini.model,
      systemInstruction: config.systemPrompt,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens ?? 4096,
      },
      ...(FEATURES.geminiToolCalling && toolDeclarations.length > 0
        ? { tools: [{ functionDeclarations: toolDeclarations }] }
        : {}),
    });
  }

  // ── Core agentic loop ──────────────────────────────────────

  /**
   * Start a new chat session. Returns a session object you hold
   * onto and pass back to sendMessage() for conversation history.
   */
  startSession(config: AgentConfig = {}): ChatSession {
    const model = this.buildModel(config);
    return model.startChat({ history: [] });
  }

  /**
   * Send a message to the agent. Automatically handles tool calls
   * in a loop until Gemini gives a final text response.
   *
   * @param session   Chat session from startSession()
   * @param message   User's text message
   * @param imageData Optional base64 image for vision (no prefix)
   * @param imageMime Optional mime type (default image/jpeg)
   * @returns         Final text response from agent
   */
  async sendMessage(
    session: ChatSession,
    message: string,
    imageData?: string,
    imageMime = 'image/jpeg',
  ): Promise<string> {
    if (!FEATURES.gemini) return `[Gemini disabled] You said: "${message}"`;

    this.emit({ type: 'thinking', message: 'Thinking...' });

    // Build the user message parts
    const parts: Content['parts'] = [{ text: message }];

    if (imageData && FEATURES.geminiVision) {
      parts.push({
        inlineData: { data: imageData, mimeType: imageMime },
      });
    }

    try {
      let result = await session.sendMessage(parts);

      // ── Agentic tool-call loop ──────────────────────────────
      // Gemini may request multiple tool calls before giving
      // its final text response. We loop until it stops.
      let iterations = 0;
      const MAX_ITERATIONS = 10; // safety limit

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const candidate = result.response.candidates?.[0];
        if (!candidate) break;

        // Collect all function calls in this response
        const functionCalls = candidate.content.parts
          .filter(p => p.functionCall)
          .map(p => p.functionCall!);

        if (functionCalls.length === 0) break; // No more tool calls → done

        // Execute each tool call
        const toolResults = await Promise.all(
          functionCalls.map(async (fc) => {
            const toolName = fc.name;
            const params = fc.args as Record<string, unknown>;

            this.emit({
              type: 'tool_call',
              message: `Using ${toolName.replace(/_/g, ' ')}…`,
              toolName,
            });

            const handler = this.toolRegistry.find(t => t.declaration.name === toolName)?.handler;
            let resultStr = '{"error": "Tool not found"}';

            if (handler) {
              try {
                resultStr = await handler(params);
              } catch (err) {
                resultStr = JSON.stringify({ error: String(err) });
              }
            }

            this.emit({
              type: 'tool_result',
              message: `Got result from ${toolName}`,
              toolName,
            });

            return {
              functionResponse: {
                name: toolName,
                response: { result: resultStr },
              },
            };
          })
        );

        // Send tool results back to Gemini
        result = await session.sendMessage(toolResults);
      }

      // Extract final text response
      const text = result.response.text();
      this.emit({ type: 'done', message: 'Done' });
      return text;

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.emit({ type: 'error', message });
      throw err;
    }
  }

  // ── Vision: analyse a single image ─────────────────────────

  /**
   * Send an image to Gemini for analysis (no chat history).
   * Good for one-shot analysis like "what is wrong with my serve?"
   */
  async analyzeImage(
    base64Image: string,
    prompt: string,
    mimeType = 'image/jpeg',
    config: AgentConfig = {},
  ): Promise<string> {
    if (!FEATURES.gemini || !FEATURES.geminiVision) {
      return '[Vision disabled] Cannot analyse image.';
    }

    const model = this.getClient().getGenerativeModel({
      model: config.model ?? ENV.gemini.visionModel,
      systemInstruction: config.systemPrompt,
    });

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64Image, mimeType } },
    ]);

    return result.response.text();
  }

  /**
   * Analyse multiple video frames (extracted from a recording).
   * Sends all frames in one request for temporal analysis.
   */
  async analyzeVideoFrames(
    frames: Array<{ base64: string; mimeType?: string }>,
    prompt: string,
    config: AgentConfig = {},
  ): Promise<string> {
    if (!FEATURES.gemini || !FEATURES.geminiVision || !FEATURES.videoFrameExtraction) {
      return '[Vision disabled] Cannot analyse video.';
    }

    const model = this.getClient().getGenerativeModel({
      model: config.model ?? ENV.gemini.visionModel,
      systemInstruction: config.systemPrompt,
    });

    const parts = [
      { text: prompt },
      ...frames.map(f => ({
        inlineData: { data: f.base64, mimeType: f.mimeType ?? 'image/jpeg' },
      })),
    ];

    const result = await model.generateContent(parts);
    return result.response.text();
  }

  // ── Quick one-shot message (no session) ────────────────────

  async quickMessage(prompt: string, config: AgentConfig = {}): Promise<string> {
    if (!FEATURES.gemini) return `[Gemini disabled] Prompt: "${prompt}"`;
    const model = this.buildModel(config);
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export const agentService = new GeminiAgentService();
