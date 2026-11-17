import type { NextRequest, NextResponse } from 'next/server';
import type { ProfileExtras } from '@/lib/userProfileExtras';
import { hasProfileExtras } from '@/lib/userProfileExtras';

export const PROFILE_EXTRAS_COOKIE = 'eraiiz_profile_extras';

type CookiePayload = {
  v: 1;
  ids: string[];
  extras: ProfileExtras;
  updatedAt: string;
};

function encodePayload(payload: CookiePayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(raw: string | undefined | null): CookiePayload | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as CookiePayload;
    if (!parsed || parsed.v !== 1 || !parsed.extras || typeof parsed.extras !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readProfileExtrasCookie(
  request: NextRequest,
  userIds: string[]
): ProfileExtras {
  const payload = decodePayload(request.cookies.get(PROFILE_EXTRAS_COOKIE)?.value);
  if (!payload || !hasProfileExtras(payload.extras)) return {};

  const allowed = new Set(userIds.map((id) => id.toLowerCase()));
  const matches = (payload.ids || []).some((id) => allowed.has(String(id).toLowerCase()));
  if (!matches && allowed.size > 0) return {};
  return payload.extras;
}

export function writeProfileExtrasCookie(
  response: NextResponse,
  userIds: string[],
  extras: ProfileExtras
) {
  if (!hasProfileExtras(extras)) {
    response.cookies.set(PROFILE_EXTRAS_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  const payload: CookiePayload = {
    v: 1,
    ids: userIds.filter(Boolean),
    extras,
    updatedAt: new Date().toISOString(),
  };

  response.cookies.set(PROFILE_EXTRAS_COOKIE, encodePayload(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // 400 days — durable across Vercel redeploys (unlike /tmp).
    maxAge: 60 * 60 * 24 * 400,
  });

  return response;
}
