import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ 
        error: 'invalid_text',
        message: 'Invalid text provided'
      }, { status: 400 });
    }

    console.log('🔊 TTS request received:', text.substring(0, 50) + '...');

    // Initialize OpenAI client for OpenRouter
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ OpenRouter API key not found');
      return NextResponse.json({ 
        error: 'api_key_missing',
        message: 'API key not configured'
      }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://eraiiz.com',
        'X-Title': 'Eraiiz - Voice Agent',
      },
    });

    try {
      // Use OpenAI TTS for speech synthesis
      const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // You can choose: alloy, echo, fable, onyx, nova, shimmer
        input: text,
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