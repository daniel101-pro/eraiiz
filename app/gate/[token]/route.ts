import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_GATE_COOKIE,
  adminGateToken,
  fingerprintAdminGateToken,
} from '@/lib/adminGate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: provided } = await params;
  const expected = adminGateToken();

  // Unknown/incorrect tokens look like a missing page
  if (!expected || !provided || provided !== expected) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const redirectTo = new URL('/login?next=%2Fadmin', request.url);
  const response = NextResponse.redirect(redirectTo, 302);
  response.cookies.set(ADMIN_GATE_COOKIE, fingerprintAdminGateToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 45,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
