import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ 
        error: 'invalid_message',
        message: 'Invalid message provided'
      }, { status: 400 });
    }

    console.log('💬 Chat request received:', message.substring(0, 50) + '...');

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
      const completion = await openai.chat.completions.create({
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
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      const aiResponse = completion.choices[0]?.message?.content;
      console.log('🤖 AI response generated:', aiResponse?.substring(0, 50) + '...');

      if (!aiResponse) {
        return NextResponse.json({
          error: 'no_ai_response',
          message: 'AI failed to generate response'
        }, { status: 500 });
      }

      // Clean up the response
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
      cleanedResponse = cleanedResponse.replace(/^(Okay,|Let me think|I think|Hmm,)/i, '');
      cleanedResponse = cleanedResponse.replace(/\s+/g, ' ').trim();

      if (!cleanedResponse) {
        cleanedResponse = "🌱 I'm Eco-Edu, your sustainability educator! I'm here to help you learn about environmental impact, carbon footprints, and eco-friendly living. At Eraiiz, we make sustainable shopping easy and accessible. What sustainability topic interests you today? 💚";
      }

      return NextResponse.json({
        response: cleanedResponse,
        success: true
      });

    } catch (apiError: any) {
      console.error('❌ OpenAI API Error:', apiError);
      return NextResponse.json({
        error: 'ai_response_failed',
        message: apiError.message || 'AI response failed'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Chat processing error:', error);
    return NextResponse.json({
      error: 'processing_error',
      message: error.message || 'Failed to process chat request'
    }, { status: 500 });
  }
} 