import { NextRequest, NextResponse } from 'next/server';
import {
  buildProfilePatchAttempts,
  buildSettingsPatchPayload,
  mergeProfileExtras,
  profileFromUser,
  profilesMatch,
  toDateInput,
  unwrapUser,
  type AccountProfileFields,
} from '@/lib/accountProfile';
import {
  getUserProfileExtras,
  hasProfileExtras,
  setUserProfileExtras,
  userIdsFromUser,
  type ProfileExtras,
} from '@/lib/userProfileExtras';
import {
  readProfileExtrasCookie,
  writeProfileExtrasCookie,
} from '@/lib/profileExtrasCookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function apiErrorMessage(data: Record<string, unknown>, fallback: string) {
  return String(data.message || data.error || fallback);
}

function jsonWithExtras(
  body: Record<string, unknown>,
  userIds: string[],
  extras: ProfileExtras,
  init?: { status?: number }
) {
  const response = NextResponse.json(body, init);
  if (hasProfileExtras(extras)) {
    writeProfileExtrasCookie(response, userIds, extras);
  }
  return response;
}

async function fetchMe(authHeader: string) {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw Object.assign(new Error(apiErrorMessage(data, 'Failed to load account')), {
      status: response.status,
    });
  }
  return unwrapUser(data);
}

async function patchMe(authHeader: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw Object.assign(new Error(apiErrorMessage(data, 'Failed to update account')), {
      status: response.status,
    });
  }
  return unwrapUser(data);
}

function mergeExtrasSources(...sources: ProfileExtras[]) {
  const merged: ProfileExtras = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source) as Array<
      [keyof ProfileExtras, string | undefined]
    >) {
      const text = String(value || '').trim();
      if (text && !merged[key]) merged[key] = text;
    }
  }
  return merged;
}

function extrasFromUserDocument(user: Record<string, unknown>): ProfileExtras {
  const profile = profileFromUser(user);
  return {
    dateOfBirth: profile.dateOfBirth || undefined,
    houseAddress: profile.houseAddress || undefined,
    city: profile.city || undefined,
    postalAddress: profile.postalAddress || undefined,
    state: profile.state || undefined,
    country: profile.country || undefined,
    phone: profile.phone || undefined,
    name: profile.name || undefined,
  };
}

async function loadExtrasForUser(request: NextRequest, user: Record<string, unknown>) {
  const ids = userIdsFromUser(user);
  const cookieExtras = readProfileExtrasCookie(request, ids);
  const documentExtras = extrasFromUserDocument(user);

  let fileExtras: ProfileExtras = {};
  for (const id of ids) {
    const extras = await getUserProfileExtras(id);
    if (hasProfileExtras(extras)) {
      fileExtras = extras;
      break;
    }
  }

  // Prefer Mongo user document (accountProfile / billing), then cookie, then soft file.
  return mergeExtrasSources(documentExtras, cookieExtras, fileExtras);
}

async function persistExtras(user: Record<string, unknown>, extras: ProfileExtras) {
  for (const id of userIdsFromUser(user)) {
    await setUserProfileExtras(id, extras);
  }
}

async function patchWithFallbacks(authHeader: string, form: AccountProfileFields) {
  const attempts = buildProfilePatchAttempts(form);
  let lastError: Error | null = null;

  for (const payload of attempts) {
    try {
      await patchMe(authHeader, payload);
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/invalid updates/i.test(message)) {
        lastError = error instanceof Error ? error : new Error(message);
        continue;
      }
      throw error;
    }
  }

  if (lastError) throw lastError;
  return attempts[attempts.length - 1];
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawUser = await fetchMe(authHeader);
    const extras = await loadExtrasForUser(request, rawUser);
    const user = mergeProfileExtras(rawUser, extras);
    const ids = userIdsFromUser(user);

    return jsonWithExtras(
      {
        user,
        profile: profileFromUser(user),
      },
      ids,
      extras
    );
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : 'Failed to load account';
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const settingsOnly = body.settingsOnly === true;

    if (settingsOnly) {
      const settingsPayload = buildSettingsPatchPayload({
        emailNotifications: body.emailNotifications,
        password: body.password,
      });
      if (!Object.keys(settingsPayload).length) {
        return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
      }

      await patchMe(authHeader, settingsPayload);
      const rawUser = await fetchMe(authHeader);
      const extras = await loadExtrasForUser(request, rawUser);
      const user = mergeProfileExtras(rawUser, extras);
      return jsonWithExtras(
        {
          success: true,
          user,
          profile: profileFromUser(user),
        },
        userIdsFromUser(user),
        extras
      );
    }

    const form = (body.profile || body) as AccountProfileFields;
    const expected = {
      name: String(form.name || ''),
      email: String(form.email || ''),
      dateOfBirth: toDateInput(form.dateOfBirth),
      phone: String(form.phone || ''),
      country: String(form.country || ''),
      state: String(form.state || ''),
      houseAddress: String(form.houseAddress || ''),
      city: String(form.city || ''),
      postalAddress: String(form.postalAddress || ''),
    };

    const extrasPayload: ProfileExtras = {
      dateOfBirth: expected.dateOfBirth || undefined,
      houseAddress: expected.houseAddress || undefined,
      city: expected.city || undefined,
      postalAddress: expected.postalAddress || undefined,
      state: expected.state || undefined,
      country: expected.country || undefined,
      phone: expected.phone || undefined,
      name: expected.name || undefined,
    };

    let user = await fetchMe(authHeader);
    await persistExtras(user, extrasPayload);

    // Persist onto Render Mongo (accountProfile blob + known fields), with fallbacks.
    await patchWithFallbacks(authHeader, expected);

    user = await fetchMe(authHeader);
    await persistExtras(user, extrasPayload);
    user = mergeProfileExtras(user, extrasPayload);

    const check = profilesMatch(expected, user);
    const critical = check.mismatches.filter((key) => ['name', 'email'].includes(key));

    if (critical.length) {
      return jsonWithExtras(
        {
          message: 'Account save did not stick on the server. Please try again.',
          mismatches: check.mismatches,
          user,
          profile: profileFromUser(user),
        },
        userIdsFromUser(user),
        extrasPayload,
        { status: 502 }
      );
    }

    return jsonWithExtras(
      {
        success: true,
        user,
        profile: profileFromUser(user),
        persisted: check.ok ? 'database' : 'database+local',
        mismatches: check.mismatches,
      },
      userIdsFromUser(user),
      extrasPayload
    );
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json({ message }, { status });
  }
}
