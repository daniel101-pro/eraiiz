import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // TODO: Create user in DB
    const token = 'mock-jwt-token';

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ message: 'Signup failed' }, { status: 500 });
  }
}
