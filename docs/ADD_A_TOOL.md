# Adding a New Tool to the Agent

Tools are what make the agent genuinely useful. This guide walks through adding a real tool end to end.

---

## Example: Add a `get_weather` tool

### 1. Add the feature flag

In `src/config/features.ts`:
```ts
tools: {
  youtubeSearch: true,
  webSearch: false,
  saveToLibrary: true,
  getFromLibrary: true,
  getCurrentTime: true,
  getWeather: true,   // ← add this
},
```

### 2. Add the env var (if your tool needs an API key)

In `.env.example`:
```
EXPO_PUBLIC_WEATHER_API_KEY=your_openweathermap_key
```

In `src/config/env.ts`:
```ts
weather: {
  apiKey: FEATURES.tools.getWeather
    ? requireEnv('EXPO_PUBLIC_WEATHER_API_KEY', 'tools.getWeather')
    : '',
},
```

### 3. Write the handler

In `src/tools/tool.registry.ts`, add the handler function:

```ts
async function handleGetWeather(params: Record<string, unknown>): Promise<string> {
  const city = params.city as string;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${ENV.weather.apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const data = await res.json();
    return JSON.stringify({
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
    });
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
```

### 4. Write the declaration

```ts
const GET_WEATHER_DECLARATION = {
  name: 'get_weather',
  description: 'Get the current weather for a city. Use when the user asks about weather conditions.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      city: {
        type: SchemaType.STRING,
        description: 'The city name, e.g. "Taipei" or "London"',
      },
    },
    required: ['city'],
  },
};
```

### 5. Register in buildToolRegistry()

```ts
if (isToolEnabled('getWeather')) {
  tools.push({ declaration: GET_WEATHER_DECLARATION, handler: handleGetWeather });
}
```

### Done!

Now when the user says "what's the weather in Taipei?", Gemini will automatically call `get_weather` with `{ city: "Taipei" }`, get the result, and respond naturally.

---

## Tool handler rules

- Always return a **JSON string** — use `JSON.stringify()`
- On error, return `JSON.stringify({ error: '...' })` — don't throw
- Keep handlers **focused** — one job per tool
- Handlers should be **fast** (under 5 seconds) — Gemini waits for the result
- The handler result goes back to Gemini as context — write it to be readable

## Writing good descriptions

The description is the most important part. Gemini uses it to decide *when* to call your tool.

**Bad:** `"Gets weather"`

**Good:** `"Get the current weather for a specific city. Use this when the user asks about weather conditions, temperature, rain, or climate in any location."`

The more specific the description, the more reliably Gemini calls the right tool at the right time.
