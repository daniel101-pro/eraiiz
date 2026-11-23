import { NextRequest, NextResponse } from 'next/server';
import { createAudioClient, createChatClient, openAiKey } from '@/lib/aiKey';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(`ai-live:${clientIp(request)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'rate_limited', message: 'Too many requests' }, { status: 429 });
  }

  try {
    const audioBlob = await request.blob();

    if (!audioBlob || audioBlob.size === 0) {
      return NextResponse.json(
        { error: 'no_audio_data', message: 'No audio data received' },
        { status: 400 }
      );
    }

    if (!openAiKey()) {
      return NextResponse.json(
        {
          error: 'api_key_missing',
          message: 'Voice needs OPENAI_API_KEY on Vercel.',
        },
        { status: 503 }
      );
    }

    const audioClient = createAudioClient();
    const chat = createChatClient();
    if (!audioClient || !chat) {
      return NextResponse.json(
        { error: 'api_key_missing', message: 'API key not configured' },
        { status: 503 }
      );
    }

    const transcriptionResponse = await audioClient.audio.transcriptions.create({
      file: new File([audioBlob], 'audio.wav', { type: 'audio/wav' }),
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    const transcript = String(transcriptionResponse || '').trim();
    if (!transcript) {
      return NextResponse.json(
        { error: 'no_speech_detected', message: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    const chatResponse = await chat.client.chat.completions.create({
      model: chat.model,
      messages: [
        {
          role: 'system',
          content:
            'You are Eco-Edu for Eraiiz. Be concise, helpful, and sustainability-focused. No chain-of-thought.',
        },
        { role: 'user', content: transcript.slice(0, 2000) },
      ],
      temperature: 0.7,
      max_tokens: 220,
    });

    const responseText = String(chatResponse.choices[0]?.message?.content || '').trim();
    return NextResponse.json({
      transcript,
      response: responseText || "I heard you — ask me about sustainable shopping on Eraiiz.",
      success: true,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Live audio error:', err?.message || error);
    return NextResponse.json(
      { error: 'processing_error', message: err?.message || 'Failed to process audio' },
      { status: 500 }
    );
  }
}
