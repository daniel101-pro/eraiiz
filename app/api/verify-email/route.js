// app/api/verify-email/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    // Proxy request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || 'Verification failed' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Verification proxy error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}