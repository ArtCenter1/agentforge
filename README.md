# ⚡ AgentForge

> Forge any AI-powered Expo app in minutes.

**AgentForge** is a production-ready Expo (React Native) boilerplate that gives you Google Sign-In, a Gemini AI agent with tool calling, camera + vision analysis, YouTube search, and a local SQLite database — all pre-wired and feature-flaggable.

---

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)
![Expo](https://img.shields.io/badge/expo-52-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ What's inside

| Feature | Status | Toggle |
|---|---|---|
| Google Sign-In (OAuth 2.0) | ✅ | `googleAuth` |
| Persistent login (SecureStore) | ✅ | `persistentLogin` |
| Auto token refresh | ✅ | `tokenAutoRefresh` |
| Auth guard (protected routes) | ✅ | `authGuard` |
| Gemini AI agent | ✅ | `gemini` |
| Tool calling (agentic loop) | ✅ | `geminiToolCalling` |
| Gemini Vision (image + video) | ✅ | `geminiVision` |
| YouTube search tool | ✅ | `tools.youtubeSearch` |
| Web search tool | ✅ off | `tools.webSearch` |
| Save / retrieve from library | ✅ | `tools.saveToLibrary` |
| Camera recording | ✅ | `camera` |
| Gallery picker | ✅ | `mediaLibrary` |
| Video frame extraction | ✅ | `videoFrameExtraction` |
| SQLite local database | ✅ | `localDatabase` |
| Chat UI with tool activity | ✅ | `chatUI` |
| Bottom tab navigation | ✅ | `bottomTabs` |
| Multi-model switch (UI) | ✅ off | `multiModelSwitch` |

---

## 🚀 Quick Start

### 1. Clone and rename

```bash
git clone https://github.com/YOUR_USERNAME/agentforge.git my-new-app
cd my-new-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys (see [Getting API Keys](#-getting-api-keys) below).

### 3. Configure your app

Open **`src/config/features.ts`** — this is the only file you need to edit to turn features on or off per project.

### 4. Run on your phone

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your phone. That's it.

---

## 🔑 Getting API Keys

### Google OAuth Client ID (required for Sign-In)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Enable APIs** → enable **Google Generative Language API**
4. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add Authorized redirect URI:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/YOUR_APP_SLUG
   ```
7. Copy the Client ID → paste into `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

### Gemini API Key (required for AI)
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key**
3. Copy it → paste into `.env` as `EXPO_PUBLIC_GEMINI_API_KEY`

### YouTube Data API Key (required if `tools.youtubeSearch: true`)
1. In Google Cloud Console → **APIs & Services → Enable APIs**
2. Enable **YouTube Data API v3**
3. Go to **Credentials → Create API Key**
4. Copy it → paste into `.env` as `EXPO_PUBLIC_YOUTUBE_API_KEY`

### Google Custom Search (optional, for `tools.webSearch: true`)
1. Go to [programmablesearchengine.google.com](https://programmablesearchengine.google.com)
2. Create a search engine → copy the **Search Engine ID**
3. In Google Cloud Console → enable **Custom Search API** → create an API key
4. Add both to `.env`

---

## 🗂️ Project Structure

```
agentforge/
│
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout — AuthProvider + AuthGuard
│   ├── auth/
│   │   └── login.tsx             # Google Sign-In screen
│   └── (app)/                    # Protected screens (require login)
│       ├── _layout.tsx           # Bottom tab navigator
│       ├── index.tsx             # 💬 Chat screen (main screen)
│       ├── camera.tsx            # 📷 Camera + video analysis
│       ├── library.tsx           # 📚 Saved items
│       └── settings.tsx          # ⚙️ Settings + feature overview
│
├── src/
│   ├── config/
│   │   ├── features.ts           # ⭐ Feature flags — START HERE
│   │   └── env.ts                # Typed, validated env vars
│   │
│   ├── services/
│   │   ├── agent.service.ts      # Gemini agent + agentic tool loop
│   │   ├── auth.service.ts       # Google OAuth + SecureStore + refresh
│   │   └── camera.service.ts     # Recording, photo, frame extraction
│   │
│   ├── tools/
│   │   └── tool.registry.ts      # ⭐ All agent tools live here
│   │
│   ├── hooks/
│   │   └── useAgent.ts           # React hook — messages, sendMessage, vision
│   │
│   ├── lib/
│   │   └── auth.context.tsx      # Auth React context + useAuth()
│   │
│   ├── db/
│   │   └── db.service.ts         # SQLite: library items, chat history, settings
│   │
│   └── components/
│       ├── chat/
│       │   └── AgentChat.tsx     # Chat bubble UI + tool activity + video cards
│       └── shared/
│           └── AuthGuard.tsx     # Route protection component
│
├── docs/
│   ├── AGENT_INSTRUCTIONS.md     # 🤖 Guide for AI agents taking over this repo
│   ├── ADD_A_TOOL.md             # How to add a new Gemini tool in 5 steps
│   └── CUSTOMISE.md              # Per-project customisation guide
│
├── .env.example                  # Copy to .env and fill in your keys
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎛️ Feature Flags

Every feature is controlled by a single file: **`src/config/features.ts`**

```ts
export const FEATURES = {
  googleAuth: true,        // false → skip login entirely
  persistentLogin: true,   // false → log out when app closes
  tokenAutoRefresh: true,  // false → tokens expire after 1 hour
  authGuard: true,         // false → all screens accessible without login

  gemini: true,            // false → placeholder responses only
  geminiToolCalling: true, // false → plain chat, no tool use
  geminiVision: true,      // false → no image/video analysis

  tools: {
    youtubeSearch: true,   // YouTube Data API v3
    webSearch: false,      // Google Custom Search (needs extra key)
    saveToLibrary: true,   // Save items to SQLite
    getFromLibrary: true,  // Retrieve saved items
    getCurrentTime: true,  // Date/time context for agent
  },

  camera: true,            // false → no camera access
  mediaLibrary: true,      // false → no gallery picker
  videoFrameExtraction: true, // false → no video analysis

  localDatabase: true,     // false → nothing persisted
  chatUI: true,            // false → blank canvas for your own UI
  showAgentActivity: true, // false → hide "Searching YouTube..." indicators
  bottomTabs: true,        // false → no tab bar
  multiModelSwitch: false, // true → show model picker in UI
}
```

Set a flag to `false` and that feature is completely skipped — no code to delete, no imports to hunt down.

---

## 🤖 Using the Agent in Your Screen

Drop the `useAgent` hook into any screen:

```tsx
import { useAgent } from '../src/hooks/useAgent';
import { AgentChat } from '../src/components/chat/AgentChat';

export default function MyScreen() {
  const agent = useAgent({
    config: {
      systemPrompt: `You are an expert tennis coach.
        When users ask about techniques, search YouTube for
        top instructional videos. When they share a video,
        analyse their form and suggest specific drills.`,
      temperature: 0.7,
    },
  });

  return (
    <AgentChat
      {...agent}
      assistantName="Coach AI"
      placeholder="Ask about your technique..."
    />
  );
}
```

The agent automatically calls YouTube search, saves items, analyses images — based on what the user says. No extra wiring needed.

---

## 🛠️ Adding a New Tool

Tools are what make the agent powerful. Adding one takes 5 steps in `src/tools/tool.registry.ts`:

**1.** Add a flag in `features.ts`:
```ts
tools: { myTool: true }
```

**2.** Write the handler (what actually runs):
```ts
async function handleMyTool(params: Record<string, unknown>): Promise<string> {
  const query = params.query as string;
  // do your work here...
  return JSON.stringify({ result: 'something useful' });
}
```

**3.** Write the declaration (what Gemini sees):
```ts
const MY_TOOL_DECLARATION = {
  name: 'my_tool',
  description: 'What this tool does and when Gemini should call it.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: 'The input' },
    },
    required: ['query'],
  },
};
```

**4.** Register it in `buildToolRegistry()`:
```ts
if (isToolEnabled('myTool')) {
  tools.push({ declaration: MY_TOOL_DECLARATION, handler: handleMyTool });
}
```

**5.** That's it. Gemini discovers and calls it automatically.

See [`docs/ADD_A_TOOL.md`](docs/ADD_A_TOOL.md) for a full walkthrough.

---

## 📱 Real-World Example: Tennis App

Here's how you'd use AgentForge to build the tennis coaching app described in the design docs:

**`app/(app)/index.tsx`** — change the system prompt:
```ts
const AGENT_CONFIG = {
  systemPrompt: `You are an expert tennis coach AI.
    - When users ask about techniques (serve, forehand, backhand),
      search YouTube for the most popular instructional videos.
    - When users record a video, analyse their form, identify errors,
      and search YouTube for specific drill videos to fix them.
    - When users want to save a video or analysis, save it to their library.
    - Always be encouraging but technically precise.`,
};
```

**`app/(app)/camera.tsx`** — change the analysis prompt:
```ts
const ANALYSIS_PROMPT = `You are analysing a tennis technique video.
  Identify: 1) The shot being played, 2) What's done well,
  3) Technical errors (grip, stance, swing path, follow-through),
  4) Specific corrections with drills to practice.`;
```

That's the entire customisation. The YouTube search, vision analysis, save-to-library, and chat UI all work automatically.

---

## 🔧 Per-Project Customisation Checklist

When starting a new project from this boilerplate:

- [ ] Edit `src/config/features.ts` — turn on/off what you need
- [ ] Copy `.env.example` → `.env` and fill in keys
- [ ] Edit `app.json` — change `name`, `slug`, `scheme`, `bundleIdentifier`
- [ ] Edit `app/(app)/index.tsx` — change `AGENT_CONFIG.systemPrompt`
- [ ] Edit `app/(app)/camera.tsx` — change `ANALYSIS_PROMPT`
- [ ] Edit `app/auth/login.tsx` — change app name and tagline
- [ ] Add your custom tools in `src/tools/tool.registry.ts`

See [`docs/CUSTOMISE.md`](docs/CUSTOMISE.md) for the full guide.

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `expo` ~52 | Core Expo SDK |
| `expo-router` ~4 | File-based navigation |
| `@google/generative-ai` | Gemini API client |
| `expo-auth-session` | Google OAuth flow |
| `expo-secure-store` | Encrypted session storage |
| `expo-sqlite` | Local database |
| `expo-image-picker` | Camera + gallery access |
| `expo-file-system` | Read files as base64 |
| `expo-web-browser` | OAuth browser session |
| `nanoid` | Unique IDs for messages |
| `expo-video-thumbnails` *(optional)* | Video frame extraction |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — free to use in personal and commercial projects.

---

## 🙏 Acknowledgements

- [Google Gemini](https://ai.google.dev) — the AI powering the agent
- [Expo](https://expo.dev) — the best way to build React Native apps

---

<p align="center">Built with ❤️ as a reusable foundation for AI-powered mobile apps.</p>
