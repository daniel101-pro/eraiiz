import OpenAI from 'openai';

export function openRouterKey() {
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
    ''
  ).trim();
}

export function openAiKey() {
  return (process.env.OPENAI_API_KEY || '').trim();
}

export function hasAiChatConfigured() {
  return Boolean(openRouterKey() || openAiKey());
}

export function createChatClient() {
  const routerKey = openRouterKey();
  if (routerKey) {
    return {
      client: new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: routerKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eraiiz.com',
          'X-Title': 'Eraiiz Eco-Edu',
        },
      }),
      // Cheap/reliable OpenRouter chat model
      model: process.env.AI_CHAT_MODEL || 'openai/gpt-4o-mini',
      provider: 'openrouter' as const,
    };
  }

  const openaiKey = openAiKey();
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
      provider: 'openai' as const,
    };
  }

  return null;
}

/** Voice STT/TTS need a real OpenAI key — OpenRouter does not proxy these reliably. */
export function createAudioClient() {
  const openaiKey = openAiKey();
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  }
  // Last resort: some OpenRouter accounts proxy audio; prefer failing clearly.
  const routerKey = openRouterKey();
  if (routerKey) {
    return new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: routerKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eraiiz.com',
        'X-Title': 'Eraiiz Eco-Edu',
      },
    });
  }
  return null;
}
