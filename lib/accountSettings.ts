import type { NextRequest, NextResponse } from 'next/server';

export const ACCOUNT_SETTINGS_COOKIE = 'eraiiz_account_settings';

export type AccountSettings = {
  emailNotifications?: boolean;
};

type CookiePayload = {
  v: 1;
  ids: string[];
  settings: AccountSettings;
  updatedAt: string;
};

function encodePayload(payload: CookiePayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(raw: string | undefined | null): CookiePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as CookiePayload;
    if (!parsed || parsed.v !== 1 || !parsed.settings || typeof parsed.settings !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readAccountSettingsCookie(
  request: NextRequest,
  userIds: string[]
): AccountSettings {
  const payload = decodePayload(request.cookies.get(ACCOUNT_SETTINGS_COOKIE)?.value);
  if (!payload) return {};

  const allowed = new Set(userIds.map((id) => String(id).toLowerCase()));
  const matches = (payload.ids || []).some((id) => allowed.has(String(id).toLowerCase()));
  if (!matches && allowed.size > 0) return {};
  return payload.settings;
}

export function writeAccountSettingsCookie(
  response: NextResponse,
  userIds: string[],
  settings: AccountSettings
) {
  const payload: CookiePayload = {
    v: 1,
    ids: userIds.filter(Boolean),
    settings,
    updatedAt: new Date().toISOString(),
  };

  response.cookies.set(ACCOUNT_SETTINGS_COOKIE, encodePayload(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  });

  return response;
}

export function applyAccountSettings(
  user: Record<string, unknown>,
  settings: AccountSettings | null | undefined
) {
  if (!settings || typeof settings.emailNotifications !== 'boolean') return user;
  return {
    ...user,
    emailNotifications: settings.emailNotifications,
  };
}
