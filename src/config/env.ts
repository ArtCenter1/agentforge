/**
 * ============================================================
 *  ENVIRONMENT CONFIG
 *
 *  All env vars live here — typed and validated.
 *  If a required var is missing, you get a clear error message
 *  telling you exactly which .env key to add.
 *
 *  FOR FUTURE AGENTS:
 *  - Copy .env.example → .env
 *  - Fill in only the keys for features you enabled in features.ts
 *  - Never commit .env to git (it's in .gitignore)
 * ============================================================
 */

import { FEATURES } from './features';

function requireEnv(key: string, feature: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `\n[Boilerplate] Missing required environment variable: ${key}\n` +
      `  Required by: FEATURES.${feature} = true\n` +
      `  Fix: Add ${key}=your_value to your .env file\n` +
      `  Or:  Disable the feature in src/config/features.ts\n`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const ENV = {

  // ── App ───────────────────────────────────────────────────
  app: {
    name: optionalEnv('EXPO_PUBLIC_APP_NAME', 'My App'),
    slug: optionalEnv('EXPO_PUBLIC_APP_SLUG', 'my-app'),
    env: optionalEnv('EXPO_PUBLIC_ENV', 'development'),
    isDev: optionalEnv('EXPO_PUBLIC_ENV', 'development') === 'development',
  },

  // ── Google OAuth ──────────────────────────────────────────
  google: {
    clientId: FEATURES.googleAuth
      ? requireEnv('EXPO_PUBLIC_GOOGLE_CLIENT_ID', 'googleAuth')
      : '',
    iosClientId: optionalEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    androidClientId: optionalEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
    // Redirect scheme — must match app.json scheme field
    scheme: optionalEnv('EXPO_PUBLIC_APP_SCHEME', 'myapp'),
  },

  // ── Gemini ────────────────────────────────────────────────
  gemini: {
    apiKey: FEATURES.gemini
      ? requireEnv('EXPO_PUBLIC_GEMINI_API_KEY', 'gemini')
      : '',
    // Model options:
    //   gemini-2.5-flash  → fast, great for chat + tool calling (recommended)
    //   gemini-2.5-pro    → most capable, slower, higher cost
    //   gemini-1.5-flash  → stable, widely available
    model: optionalEnv('EXPO_PUBLIC_GEMINI_MODEL', 'gemini-2.5-flash'),
    visionModel: optionalEnv('EXPO_PUBLIC_GEMINI_VISION_MODEL', 'gemini-2.5-flash'),
  },

  // ── YouTube Data API v3 ───────────────────────────────────
  youtube: {
    apiKey: FEATURES.tools.youtubeSearch
      ? requireEnv('EXPO_PUBLIC_YOUTUBE_API_KEY', 'tools.youtubeSearch')
      : '',
    maxResults: parseInt(optionalEnv('EXPO_PUBLIC_YOUTUBE_MAX_RESULTS', '10')),
  },

  // ── Google Custom Search (optional) ──────────────────────
  search: {
    apiKey: FEATURES.tools.webSearch
      ? requireEnv('EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY', 'tools.webSearch')
      : '',
    engineId: FEATURES.tools.webSearch
      ? requireEnv('EXPO_PUBLIC_SEARCH_ENGINE_ID', 'tools.webSearch')
      : '',
  },

} as const;
