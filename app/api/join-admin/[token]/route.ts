import { NextRequest, NextResponse } from 'next/server';
import { acceptAdminInvite, getInviteByToken } from '@/lib/adminOperatorsStore';
import {
  ADMIN_GATE_COOKIE,
  adminGateToken,
  fingerprintAdminGateToken,
} from '@/lib/adminGate';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function resolveUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ message: 'Invite is invalid or expired' }, { status: 404 });
  }
  return NextResponse.json({
    email: invite.email,
    name: invite.name,
    invitedBy: invite.invitedBy,
    expiresAt: invite.inviteExpiresAt,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ message: 'Invite is invalid or expired' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const user = await resolveUser(authHeader);
  if (!user) {
    return NextResponse.json({ message: 'Sign in required', loginRequired: true }, { status: 401 });
  }

  const email = String(user.email || '').trim().toLowerCase();
  const name = String(user.name || '').trim();

  try {
    const operator = await acceptAdminInvite({ token, email, name });

    const response = NextResponse.json({
      ok: true,
      email: operator.email,
      redirectTo: '/admin',
    });

    // Invited admins get the gate cookie so /admin is reachable without the secret URL.
    const gate = adminGateToken();
    if (gate) {
      response.cookies.set(ADMIN_GATE_COOKIE, fingerprintAdminGateToken(gate), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 45,
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not accept invite' },
      { status: 400 }
    );
  }
}
