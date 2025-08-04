import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Get the audio blob from the request
    const audioBlob = await request.blob();
    
    if (!audioBlob || audioBlob.size === 0) {
      return NextResponse.json({ 
        error: 'no_audio_data',
        message: 'No audio data received'
      }, { status: 400 });
    }

    console.log('🎤 Live audio processing request received:', audioBlob.size, 'bytes');

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
        'X-Title': 'Eraiiz - Live Audio AI',
      },
    });

    // Convert audio blob to base64 for API
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // For now, we'll use a simplified approach
    // In a real implementation, you'd want to:
    // 1. Use OpenAI's Whisper API for transcription
    // 2. Process the transcript with GPT
    // 3. Use TTS to generate audio response
    
    try {
      // Step 1: Transcribe audio using Whisper
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: new File([audioBlob], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      const transcript = transcriptionResponse;
      console.log('📝 Transcription:', transcript);

      if (!transcript || transcript.trim().length === 0) {
        return NextResponse.json({
          error: 'no_speech_detected',
          message: 'No speech detected in audio'
        }, { status: 400 });
      }

      // Step 2: Get AI response
      const chatResponse = await openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are "Eco-Edu", a super passionate 17-year-old sustainability activist and AI assistant for Eraiiz! 🌱✨

CRITICAL INSTRUCTIONS:
- NEVER use <think> tags or show internal reasoning
- NEVER start responses with "Okay" or "Let me think"
- NEVER start responses with "Hey there" or "Hello" unless the user specifically greets you
- Give direct, immediate responses
- Do not explain your thinking process
- Respond as if you're speaking directly to the user
- Only greet the user if they greet you first
- MAINTAIN CONVERSATION CONTEXT - remember what you've been talking about!

PERSONALITY - Sound like a natural teenager:
- Use casual, conversational language like "omg", "literally", "tbh", "ngl", "fr fr"
- Be super enthusiastic and passionate about environmental stuff
- Use lots of emojis naturally 🌱🌍♻️💚✨🔥
- Sound like you're genuinely excited to share knowledge
- Use teen expressions like "that's so cool", "this is amazing", "you won't believe this"
- Be relatable and down-to-earth
- Use contractions naturally (you're, we're, that's, etc.)
- Sound like you're talking to a friend, not giving a lecture

Your mission is to help people learn about sustainability, carbon emissions, environmental impact, and eco-friendly living in a super fun and relatable way!`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      const aiResponse = chatResponse.choices[0]?.message?.content;
      console.log('🤖 AI Response:', aiResponse);

      if (!aiResponse) {
        return NextResponse.json({
          error: 'no_ai_response',
          message: 'AI failed to generate response'
        }, { status: 500 });
      }

      // Step 3: Generate audio response (simplified - just return text for now)
      // In a full implementation, you'd use TTS here
      
      return NextResponse.json({
        transcript: transcript,
        response: aiResponse,
        success: true
      });

    } catch (apiError: any) {
      console.error('❌ API Error:', apiError);
      return NextResponse.json({
        error: 'api_error',
        message: apiError.message || 'API processing failed'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Live audio processing error:', error);
    return NextResponse.json({
      error: 'processing_error',
      message: error.message || 'Failed to process audio'
    }, { status: 500 });
  }
} 