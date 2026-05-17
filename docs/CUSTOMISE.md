# Customising AgentForge Per Project

Follow this checklist every time you start a new project from this boilerplate.

---

## Step 1 — Feature flags (`src/config/features.ts`)

Turn off what you don't need. Each flag is documented inline.

**Minimum for a basic AI chat app:**
```ts
googleAuth: true
gemini: true
geminiToolCalling: true
chatUI: true
localDatabase: true
```

**Add for camera/vision apps:**
```ts
camera: true
geminiVision: true
videoFrameExtraction: true
mediaLibrary: true
```

**Add for YouTube/search apps:**
```ts
tools: { youtubeSearch: true }
```

---

## Step 2 — Environment variables (`.env`)

Copy `.env.example` to `.env` and fill in only the keys needed for your enabled features.

---

## Step 3 — App identity (`app.json`)

```json
{
  "expo": {
    "name": "My App Name",
    "slug": "my-app-slug",
    "scheme": "myapp",
    "ios": { "bundleIdentifier": "com.yourcompany.myapp" },
    "android": { "package": "com.yourcompany.myapp" }
  }
}
```

The `scheme` must match `EXPO_PUBLIC_APP_SCHEME` in your `.env`.

---

## Step 4 — Agent personality (`app/(app)/index.tsx`)

```ts
const AGENT_CONFIG = {
  systemPrompt: `You are a [describe the role].
  
  Your capabilities:
  - [what the agent can do]
  - [when to search YouTube]
  - [when to save items]
  
  Your tone: [friendly / professional / technical]`,
  
  temperature: 0.7, // 0 = precise, 1 = creative
};

const ASSISTANT_NAME = 'My Assistant';
const PLACEHOLDER = 'Ask me about...';
```

---

## Step 5 — Vision prompt (`app/(app)/camera.tsx`)

Only needed if `camera: true` and `geminiVision: true`.

```ts
const ANALYSIS_PROMPT = `You are analysing a [type of content].

Please identify:
1. [What to look for first]
2. [What to assess]
3. [What to suggest]

Keep your response clear and actionable.`;
```

---

## Step 6 — Branding (`app/auth/login.tsx`)

Update the app name, tagline, and any visual elements on the login screen.

---

## Step 7 — Add custom tools (if needed)

See `docs/ADD_A_TOOL.md` for the full guide.

---

## Optional: Add new screens

Create `app/(app)/my-screen.tsx` — Expo Router picks it up automatically.
Add it as a tab in `app/(app)/_layout.tsx` if you want it in the tab bar.
