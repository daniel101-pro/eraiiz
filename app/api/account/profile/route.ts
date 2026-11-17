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
  setUserProfileExtras,
  userIdsFromUser,
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

async function withExtras(user: Record<string, unknown>) {
  const ids = userIdsFromUser(user);
  for (const id of ids) {
    const extras = await getUserProfileExtras(id);
    if (extras.dateOfBirth) {
      return mergeProfileExtras(user, extras);
    }
  }
  return user;
}

async function persistDobExtra(user: Record<string, unknown>, dateOfBirth: string) {
  const dob = toDateInput(dateOfBirth);
  if (!dob) return;
  for (const id of userIdsFromUser(user)) {
    await setUserProfileExtras(id, { dateOfBirth: dob });
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

    const payload = buildProfilePatchPayload(expected);
    await patchMe(authHeader, payload);

    let user = await fetchMe(authHeader);
    let check = profilesMatch(expected, user);

    // Retry DOB as noon-UTC ISO if calendar string did not stick.
    if (expected.dateOfBirth && check.mismatches.includes('dateOfBirth')) {
      try {
        await patchMe(authHeader, {
          name: expected.name,
          email: expected.email,
          phone: expected.phone,
          country: expected.country,
          state: expected.state,
          billingAddress: {
            houseAddress: expected.houseAddress,
            city: expected.city,
            postalAddress: expected.postalAddress,
          },
          dateOfBirth: `${expected.dateOfBirth}T12:00:00.000Z`,
        });
        user = await fetchMe(authHeader);
        check = profilesMatch(expected, user);
      } catch {
        // Keep prior result; may fall back to extras below.
      }
    }

    // If Render still drops DOB, keep it in our durable extras store.
    if (expected.dateOfBirth && check.mismatches.includes('dateOfBirth')) {
      await persistDobExtra(user, expected.dateOfBirth);
      user = await withExtras(user);
      check = profilesMatch(expected, user);
    } else if (expected.dateOfBirth) {
      // Keep extras in sync when backend accepted DOB.
      await persistDobExtra(user, expected.dateOfBirth);
    }

    const criticalMismatches = check.mismatches.filter((key) => key !== 'dateOfBirth');
    if (criticalMismatches.length) {
      return NextResponse.json(
        {
          message: 'Account save did not stick on the server. Please try again.',
          mismatches: check.mismatches,
          user: await withExtras(user),
          profile: profileFromUser(await withExtras(user)),
        },
        { status: 502 }
      );
    }

    user = await withExtras(user);
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
