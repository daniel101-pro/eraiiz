import { NextRequest, NextResponse } from 'next/server';
import { createAudioClient, openAiKey } from '@/lib/aiKey';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`ai-speak:${clientIp(request)}`, 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json({ error: 'rate_limited', message: 'Too many requests' }, { status: 429 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ 
        error: 'invalid_text',
        message: 'Invalid text provided'
      }, { status: 400 });
    }

    if (!openAiKey()) {
      return NextResponse.json({
        error: 'api_key_missing',
        message: 'Voice needs OPENAI_API_KEY on Vercel (OpenRouter does not support TTS).',
      }, { status: 503 });
    }

    const openai = createAudioClient();
    if (!openai) {
      return NextResponse.json({ 
        error: 'api_key_missing',
        message: 'API key not configured'
      }, { status: 503 });
    }

    try {
      const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text.slice(0, 4000),
        response_format: 'mp3'
      });

      console.log('🔊 TTS successful, audio generated');

      // Convert the response to a buffer
      const buffer = Buffer.from(await speech.arrayBuffer());

      // Return the audio as a blob
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      });

    } catch (apiError: any) {
      console.error('❌ TTS API Error:', apiError);
      return NextResponse.json({
        error: 'tts_failed',
        message: apiError.message || 'Text-to-speech failed'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ TTS processing error:', error);
    return NextResponse.json({
      error: 'processing_error',
      message: error.message || 'Failed to process TTS request'
    }, { status: 500 });
  }
} 