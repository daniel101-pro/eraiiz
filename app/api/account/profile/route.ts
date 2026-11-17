import { NextRequest, NextResponse } from 'next/server';
import {
  buildProfilePatchPayload,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function apiErrorMessage(data: Record<string, unknown>, fallback: string) {
  return String(data.message || data.error || fallback);
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

async function loadExtrasForUser(user: Record<string, unknown>) {
  for (const id of userIdsFromUser(user)) {
    const extras = await getUserProfileExtras(id);
    if (hasProfileExtras(extras)) return extras;
  }
  return {};
}

async function withExtras(user: Record<string, unknown>) {
  return mergeProfileExtras(user, await loadExtrasForUser(user));
}

async function persistExtras(user: Record<string, unknown>, extras: ProfileExtras) {
  for (const id of userIdsFromUser(user)) {
    await setUserProfileExtras(id, extras);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await withExtras(await fetchMe(authHeader));
    return NextResponse.json({
      user,
      profile: profileFromUser(user),
    });
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
      const user = await withExtras(await fetchMe(authHeader));
      return NextResponse.json({
        success: true,
        user,
        profile: profileFromUser(user),
      });
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

    // Always persist address/profile extras first so leave/return keeps billing
    // even when Render drops nested billingAddress.
    let user = await fetchMe(authHeader);
    await persistExtras(user, extrasPayload);

    const payload = buildProfilePatchPayload(expected);
    try {
      await patchMe(authHeader, payload);
    } catch (error) {
      // If Render rejects dateOfBirth, retry without it.
      const message = error instanceof Error ? error.message : '';
      if (/invalid updates/i.test(message) && payload.dateOfBirth) {
        const { dateOfBirth: _ignored, ...withoutDob } = payload;
        await patchMe(authHeader, withoutDob);
      } else if (/invalid updates/i.test(message) && payload.billingAddress) {
        // Some backends don't allow nested billingAddress — keep extras only.
      } else {
        throw error;
      }
    }

    user = await fetchMe(authHeader);
    await persistExtras(user, extrasPayload);
    user = await withExtras(user);

    const check = profilesMatch(expected, user);
    const critical = check.mismatches.filter((key) =>
      ['name', 'email'].includes(key)
    );

    // Name/email must stick on Render. Everything else can live in extras.
    if (critical.length) {
      return NextResponse.json(
        {
          message: 'Account save did not stick on the server. Please try again.',
          mismatches: check.mismatches,
          user,
          profile: profileFromUser(user),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      profile: profileFromUser(user),
    });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json({ message }, { status });
  }
}
