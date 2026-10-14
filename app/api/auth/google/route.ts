import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnavailable(response: Response, bodyText: string) {
  const routing = response.headers.get('x-render-routing') || '';
  if (routing.includes('hibernate') || response.status === 503 || response.status === 429) {
    return true;
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return true;
  }
  return /just a moment|cloudflare|cf-ray/i.test(bodyText);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code : '';

    if (!code) {
      return NextResponse.json({ message: 'Google authorization code is required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      code,
      redirectUri: 'postmessage',
      redirect_uri: 'postmessage',
    });

    let lastStatus = 502;
    let lastMessage = 'Google sign-in failed. Please try again.';

    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: payload,
        signal: AbortSignal.timeout(20000),
      });

      const text = await response.text();
      lastStatus = response.status;

      if (isUnavailable(response, text) && attempt < 4) {
        await sleep(1500 * attempt);
        continue;
      }

      let data: Record<string, unknown> = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json(
          { message: 'Auth service is waking up. Please try Google sign-in again.' },
          { status: 503 }
        );
      }

      if (!response.ok) {
        lastMessage =
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          lastMessage;
        return NextResponse.json({ message: lastMessage }, { status: response.status });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ message: lastMessage }, { status: lastStatus });
  } catch (error) {
    console.error('Google auth proxy error:', error);
    return NextResponse.json(
      { message: 'Auth service is waking up. Please try Google sign-in again.' },
      { status: 503 }
    );
  }
}
