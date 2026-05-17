# 🤖 Agent Instructions

> This document is written specifically for AI agents (Claude, Copilot, Cursor, etc.)
> that are asked to work on a project built from the AgentForge boilerplate.
> Read this first before touching any code.

---

## What this repo is

AgentForge is a feature-flagged Expo (React Native) boilerplate for building AI-powered mobile apps. It ships with:

- Google Sign-In (OAuth 2.0 via expo-auth-session)
- Gemini AI agent with a full agentic tool-calling loop
- Camera + Gemini Vision for video/image analysis
- YouTube search, web search, local SQLite database
- Pre-built Chat UI with tool activity indicators

---

## The golden rule: start with features.ts

Before writing any code, read **`src/config/features.ts`**.

This file controls everything. If a feature flag is `false`, that entire code path is skipped. Never modify core boilerplate files to add app-specific logic — instead:

1. Check if the feature is already there and just needs to be enabled
2. If adding a new capability, add it as a new feature flag
3. Keep boilerplate code generic; put app-specific logic in the screen files under `app/`

---

## Architecture overview

```
User message
    ↓
useAgent hook  (src/hooks/useAgent.ts)
    ↓
agentService.sendMessage()  (src/services/agent.service.ts)
    ↓
Gemini API  ←→  Tool calls (src/tools/tool.registry.ts)
    ↓
AgentChat component  (src/components/chat/AgentChat.tsx)
    ↓
User sees response + tool activity
```

The agentic loop in `agent.service.ts` handles multiple back-and-forth tool calls automatically. Gemini decides which tools to call; you just define the tools.

---

## How to add a new tool

All tools live in `src/tools/tool.registry.ts`. Follow this exact pattern:

### Step 1 — Feature flag
```ts
// src/config/features.ts
tools: {
  myNewTool: true,
}
```

### Step 2 — Handler function
```ts
async function handleMyNewTool(params: Record<string, unknown>): Promise<string> {
  // params come from Gemini based on your declaration
  const input = params.someParam as string;
  
  // Do the work (API call, DB query, calculation, etc.)
  const result = await someApiCall(input);
  
  // Always return a JSON string — Gemini reads this
  return JSON.stringify({ result, success: true });
}
```

### Step 3 — Declaration (what Gemini sees)
```ts
const MY_TOOL_DECLARATION = {
  name: 'my_new_tool',  // snake_case, no spaces
  description: 'Clear description of WHEN Gemini should call this. Be specific.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      someParam: {
        type: SchemaType.STRING,
        description: 'What this parameter is for',
      },
    },
    required: ['someParam'],
  },
};
```

### Step 4 — Register it
```ts
// In buildToolRegistry():
if (isToolEnabled('myNewTool')) {
  tools.push({ declaration: MY_TOOL_DECLARATION, handler: handleMyNewTool });
}
```

Gemini will now discover and call this tool automatically when relevant.

---

## How to customise the agent per project

The two key customisation points are in the screen files — not the boilerplate core:

### 1. System prompt (`app/(app)/index.tsx`)
```ts
const AGENT_CONFIG = {
  systemPrompt: `You are a [role]. When users [situation], [action].`,
  temperature: 0.7,
};
```

This is your most powerful lever. A well-written system prompt determines the entire personality and behaviour of the agent.

### 2. Vision analysis prompt (`app/(app)/camera.tsx`)
```ts
const ANALYSIS_PROMPT = `Analyse this [type of content]. Identify: 1) ... 2) ... 3) ...`;
```

---

## File ownership rules

| Path | Rule |
|---|---|
| `src/config/features.ts` | Edit freely — this is the config layer |
| `src/config/env.ts` | Add new env vars here when needed |
| `src/tools/tool.registry.ts` | Add new tools here |
| `app/(app)/index.tsx` | Edit systemPrompt, assistantName, placeholder |
| `app/(app)/camera.tsx` | Edit ANALYSIS_PROMPT |
| `app/auth/login.tsx` | Edit UI text and branding only |
| `src/services/*.ts` | Edit only if adding new service capabilities |
| `src/components/**` | Edit UI styling freely; don't change props interfaces |
| `src/hooks/useAgent.ts` | Treat as stable — avoid editing |
| `src/lib/auth.context.tsx` | Treat as stable — avoid editing |
| `src/db/db.service.ts` | Add new tables/columns in `createTables()` only |

---

## Adding a new screen

Create a file in `app/(app)/` — Expo Router picks it up automatically.

```tsx
// app/(app)/my-screen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAgent } from '../../src/hooks/useAgent';

export default function MyScreen() {
  const agent = useAgent({ config: { systemPrompt: 'You are...' } });
  // build your UI
  return <View><Text>My Screen</Text></View>;
}
```

Then add it as a tab in `app/(app)/_layout.tsx` if needed.

---

## Adding a new database table

In `src/db/db.service.ts`, add your table inside `createTables()`:

```ts
await this.db.execAsync(`
  CREATE TABLE IF NOT EXISTS my_table (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    field_one  TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
```

Then add typed methods below (following the same pattern as `saveItem`, `getItems`, etc.).

---

## Environment variables

All env vars are typed and validated in `src/config/env.ts`. When adding a new one:

1. Add to `.env.example` with a comment
2. Add to `src/config/env.ts` using `requireEnv()` (if required) or `optionalEnv()` (if optional)
3. Reference via `ENV.yourSection.yourKey` — never read `process.env` directly elsewhere

---

## Common mistakes to avoid

- ❌ Don't read `process.env` directly in component files — use `ENV` from `src/config/env.ts`
- ❌ Don't add app-specific logic to service files — put it in screens or hooks
- ❌ Don't hardcode strings the user sees — keep them in the screen file constants
- ❌ Don't create new context providers unless absolutely necessary — `useAgent` and `useAuth` cover most needs
- ❌ Don't bypass feature flags — if something should be optional, add a flag
- ✅ Do keep tool handlers focused — one job per tool, return a JSON string
- ✅ Do write clear tool descriptions — Gemini's ability to call the right tool depends on them
- ✅ Do test with `FEATURES.gemini: false` to verify UI works without the API

---

## Tech stack quick reference

| Layer | Technology |
|---|---|
| Framework | Expo 52 + React Native |
| Navigation | Expo Router 4 (file-based) |
| Language | TypeScript (strict mode) |
| AI | Google Gemini via `@google/generative-ai` |
| Auth | expo-auth-session (Google OAuth 2.0 PKCE) |
| Secure storage | expo-secure-store |
| Database | expo-sqlite (SQLite) |
| Camera | expo-image-picker |
| Video frames | expo-video-thumbnails (optional) |

---

*Last updated: AgentForge v1.0*
