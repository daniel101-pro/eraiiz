import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    if (email === 'admin@eraiz.com' && password === 'admin123') {
      return NextResponse.json({ token: 'your-mock-jwt-token' });
    }

    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: 'Server error', error: errorMessage }, { status: 500 });
  }
}