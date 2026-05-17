/**
 * ============================================================
 *  FEATURE FLAGS — The single source of truth for this app.
 *
 *  Every feature in this boilerplate is controlled here.
 *  Set a flag to false and the code path is skipped entirely —
 *  no imports to remove, no files to delete.
 *
 *  FOR FUTURE AGENTS:
 *  This is always your first stop when starting a new project.
 *  Read this file top to bottom, decide what you need, then
 *  move to src/config/env.ts to fill in credentials.
 * ============================================================
 */

export const FEATURES = {

  // ── AUTHENTICATION ─────────────────────────────────────────
  // Google OAuth Sign-In via expo-auth-session.
  // If false → app skips login and goes straight to main screen.
  // Requires: EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env
  googleAuth: true,

  // Save session encrypted on-device (survives app restarts).
  // Requires: googleAuth: true
  persistentLogin: true,

  // Auto-refresh Google OAuth token before 1-hour expiry.
  // Requires: googleAuth: true
  tokenAutoRefresh: true,

  // Redirect unauthenticated users to login screen.
  // Requires: googleAuth: true
  authGuard: true,

  // ── GEMINI CORE ────────────────────────────────────────────
  // Master switch for all Gemini functionality.
  // If false → all Gemini calls return placeholder strings.
  // Requires: EXPO_PUBLIC_GEMINI_API_KEY in .env
  gemini: true,

  // Gemini function/tool calling (agentic mode).
  // Gemini decides which tools to call based on user message.
  // If false → plain chat only, no tool execution.
  // Requires: gemini: true
  geminiToolCalling: true,

  // Gemini Vision — analyse images and video frames.
  // Allows sending camera frames/photos to Gemini for analysis.
  // If false → vision API calls are disabled.
  // Requires: gemini: true
  geminiVision: true,

  // Gemini streaming responses (token by token, feels faster).
  // If false → waits for full response before showing.
  geminiStreaming: true,

  // ── TOOLS (Gemini can call these autonomously) ─────────────
  // Each tool here is a function Gemini can invoke when relevant.
  // Only active when geminiToolCalling: true.
  tools: {
    // Search YouTube and return video results.
    // Requires: EXPO_PUBLIC_YOUTUBE_API_KEY in .env
    youtubeSearch: true,

    // General web search via Google Custom Search API.
    // Requires: EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY + SEARCH_ENGINE_ID
    webSearch: false,

    // Save items to local database (videos, analyses, notes).
    // Requires: localDatabase: true
    saveToLibrary: true,

    // Retrieve saved items from local database.
    // Requires: localDatabase: true
    getFromLibrary: true,

    // Get current date/time (useful for scheduling context).
    getCurrentTime: true,

    // Placeholder for your custom tools — add more here.
    // See: src/tools/ for how to implement a tool.
    // customTool: false,
  },

  // ── CAMERA & MEDIA ─────────────────────────────────────────
  // Access device camera for recording and photo capture.
  // Requires: expo-camera installed
  camera: true,

  // Pick videos/photos from device gallery.
  // Requires: expo-image-picker installed
  mediaLibrary: true,

  // Auto-extract frames from recorded video for Gemini Vision.
  // Requires: camera: true + geminiVision: true
  videoFrameExtraction: true,

  // ── LOCAL DATABASE ─────────────────────────────────────────
  // SQLite database via expo-sqlite.
  // Stores: chat history, saved videos, analysis results, settings.
  // If false → nothing persisted between sessions.
  localDatabase: true,

  // ── UI COMPONENTS ──────────────────────────────────────────
  // Pre-built chat bubble interface (user right, agent left).
  // If false → blank canvas for your own UI.
  chatUI: true,

  // Show tool call activity in chat (what the agent is doing).
  // e.g. "Searching YouTube for serve technique..."
  showAgentActivity: true,

  // Allow user to switch AI model from the UI.
  // Shows a picker: Gemini Flash / Pro / Claude / OpenAI.
  multiModelSwitch: false,

  // Bottom tab navigation bar.
  // Tabs: Chat | Library | Camera | Settings
  bottomTabs: true,

} as const;

export type FeatureFlags = typeof FEATURES;

// ── Type helpers ───────────────────────────────────────────────
export type ToolName = keyof typeof FEATURES.tools;

export function isToolEnabled(tool: ToolName): boolean {
  return FEATURES.geminiToolCalling && FEATURES.tools[tool];
}
