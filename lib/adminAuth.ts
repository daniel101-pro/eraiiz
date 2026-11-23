import { NextRequest, NextResponse } from 'next/server';
import { decodeAuthToken } from '@/lib/sellerPayoutStore';
import { isAdminAccount } from '@/lib/authRouting';
import {
  assertAdminSameOrigin,
  enforceAdminRateLimit,
  secureAdminJson,
} from '@/lib/adminSecurity';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function resolveAdminSession(authHeader?: string | null): Promise<AdminSession | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;

  const payload = decodeAuthToken(authHeader) as
    | (ReturnType<typeof decodeAuthToken> & { role?: string; name?: string; exp?: number })
    | null;

  if (payload?.exp && payload.exp * 1000 < Date.now()) return null;

  let user: Record<string, unknown> | null = null;
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    user = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }

  if (!user) return null;

  const email = String(user.email || payload?.email || '').trim().toLowerCase();
  const role = String(user.role || payload?.role || '').trim().toLowerCase();
  const id = String(user._id || user.id || user.userId || payload?.id || payload?._id || payload?.sub || email);
  const name = String(user.name || payload?.name || email.split('@')[0] || 'Admin');

  if (!isAdminAccount({ role, email })) return null;

  return { id, email, name, role: role || 'admin' };
}

export async function requireAdmin(request: NextRequest): Promise<
  { session: AdminSession; error: null } | { session: null; error: NextResponse }
> {
  const session = await resolveAdminSession(request.headers.get('authorization'));
  const rateError = enforceAdminRateLimit(request, session);
  if (rateError) return { session: null, error: rateError };

  if (!session) {
    return {
      session: null,
      error: secureAdminJson({ message: 'Admin access required' }, { status: 403 }),
    };
  }

  const originError = assertAdminSameOrigin(request);
  if (originError) return { session: null, error: originError };

  return { session, error: null };
}
