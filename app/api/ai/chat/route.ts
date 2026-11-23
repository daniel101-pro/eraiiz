import { NextRequest, NextResponse } from 'next/server';
import { createChatClient, hasAiChatConfigured } from '@/lib/aiKey';
import { clientIp, rateLimit } from '@/lib/rateLimit';

const SYSTEM_PROMPT = `You are "Eco-Edu", a passionate sustainability educator and shopping guide for Eraiiz (eraiiz.com) — a marketplace for recycled and eco-friendly products.

RULES:
- Never use <think> tags or show chain-of-thought
- Be warm, clear, and concise (2–5 short sentences unless asked for detail)
- Help with sustainability, carbon footprints, recycled materials, and shopping on Eraiiz
- Suggest browsing /for-you or categories when relevant
- Do not invent order status, account data, or prices you don't know`;

type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`ai-chat:${clientIp(request)}`, 30, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests. Try again in a minute.' },
        { status: 429 }
      );
    }

    if (!hasAiChatConfigured()) {
      return NextResponse.json(
        {
          error: 'api_key_missing',
          message:
            'AI is not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY on Vercel.',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    const history = Array.isArray(body.history) ? (body.history as ChatTurn[]) : [];

    if (!message || message.length > 2000) {
      return NextResponse.json(
        { error: 'invalid_message', message: 'Invalid message provided' },
        { status: 400 }
      );
    }

    const chat = createChatClient();
    if (!chat) {
      return NextResponse.json(
        { error: 'api_key_missing', message: 'AI is not configured' },
        { status: 503 }
      );
    }

    const prior = history
      .filter(
        (turn) =>
          turn &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string' &&
          turn.content.trim()
      )
      .slice(-8)
      .map((turn) => ({
        role: turn.role as 'user' | 'assistant',
        content: String(turn.content).slice(0, 1500),
      }));

    try {
      const completion = await chat.client.chat.completions.create({
        model: chat.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...prior,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 280,
      });

      let cleanedResponse = String(completion.choices[0]?.message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/^(Okay,|Let me think|I think|Hmm,)\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanedResponse) {
        cleanedResponse =
          "I'm Eco-Edu — ask me about sustainable shopping, recycled materials, or cutting your carbon footprint, and I'll help.";
      }

      return NextResponse.json({
        response: cleanedResponse,
        success: true,
        provider: chat.provider,
      });
    } catch (apiError: unknown) {
      const err = apiError as { message?: string; status?: number };
      console.error('AI chat provider error:', err?.message || apiError);
      return NextResponse.json(
        {
          error: 'ai_response_failed',
          message: err?.message || 'AI response failed',
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Chat processing error:', err?.message || error);
    return NextResponse.json(
      {
        error: 'processing_error',
        message: err?.message || 'Failed to process chat request',
      },
      { status: 500 }
    );
  }
}
