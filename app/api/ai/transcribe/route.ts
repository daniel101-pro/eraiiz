import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { openRouterKey } from '@/lib/aiKey';
import { clientIp, rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(`ai-transcribe:${clientIp(request)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'rate_limited', message: 'Too many requests' }, { status: 429 });
  }
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json({ 
        error: 'no_audio_file',
        message: 'No audio file provided'
      }, { status: 400 });
    }

    console.log('🎤 Transcription request received:', audioFile.size, 'bytes', 'type:', audioFile.type);

    // Initialize OpenAI client for OpenRouter
    const apiKey = openRouterKey();
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
      // Convert File to ArrayBuffer for OpenAI API
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Create a File object that OpenAI can handle
      const file = new File([buffer], 'audio.webm', { type: audioFile.type || 'audio/webm' });
      
      console.log('📁 File prepared for OpenAI:', file.size, 'bytes', file.type);
      
      // Use OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      console.log('📝 Transcription successful:', transcription);

      return NextResponse.json({
        text: transcription,
        success: true
      });

    } catch (apiError: any) {
      console.error('❌ Whisper API Error:', apiError);
      console.error('❌ Error details:', apiError.response?.data || apiError.message);
      return NextResponse.json({
        error: 'transcription_failed',
        message: apiError.message || 'Transcription failed',
        details: apiError.response?.data || 'No additional details'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Transcription processing error:', error);
    return NextResponse.json({
      error: 'processing_error',
      message: error.message || 'Failed to process audio'
    }, { status: 500 });
  }
} 