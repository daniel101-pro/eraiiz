export type AccountProfileFields = {
  name: string;
  email: string;
  dateOfBirth: string;
  phone: string;
  country: string;
  state: string;
  houseAddress: string;
  city: string;
  postalAddress: string;
};

export function emptyProfileFields(): AccountProfileFields {
  return {
    name: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    country: '',
    state: '',
    houseAddress: '',
    city: '',
    postalAddress: '',
  };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function toDateInput(value: unknown) {
  if (!value) return '';
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  // Use UTC parts so ISO midnight values don't shift a day westward.
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateOfBirthDisplay(value: unknown) {
  const iso = toDateInput(value);
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString();
}

export function unwrapUser(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload as Record<string, unknown>;
  if (data.user && typeof data.user === 'object') {
    return data.user as Record<string, unknown>;
  }
  return data;
}

function storedAccountProfile(user: Record<string, unknown> | null | undefined) {
  const raw = user?.accountProfile;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

export function profileFromUser(user: Record<string, unknown> | null | undefined): AccountProfileFields {
  const stored = storedAccountProfile(user);
  const billing =
    (user?.billingAddress as Record<string, unknown> | undefined) ||
    (user?.billing as Record<string, unknown> | undefined) ||
    {};

  return {
    name: firstString(user?.name, user?.fullName, stored.name),
    email: firstString(user?.email, stored.email),
    dateOfBirth: toDateInput(
      user?.dateOfBirth || user?.dob || stored.dateOfBirth || stored.dob
    ),
    phone: firstString(user?.phone, user?.phoneNumber, stored.phone),
    country: firstString(user?.country, billing.country, stored.country),
    state: firstString(user?.state, billing.state, stored.state),
    houseAddress: firstString(
      billing.houseAddress,
      billing.address,
      user?.houseAddress,
      user?.address,
      stored.houseAddress,
      stored.address
    ),
    city: firstString(billing.city, user?.city, stored.city),
    postalAddress: firstString(
      billing.postalAddress,
      billing.postalCode,
      user?.postalAddress,
      user?.postalCode,
      stored.postalAddress,
      stored.postalCode
    ),
  };
}

export function buildAccountProfileBlob(form: AccountProfileFields) {
  const dob = toDateInput(form.dateOfBirth);
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    country: form.country.trim(),
    state: form.state.trim(),
    dateOfBirth: dob,
    houseAddress: form.houseAddress.trim(),
    city: form.city.trim(),
    postalAddress: form.postalAddress.trim(),
    postalCode: form.postalAddress.trim(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Backend `/api/users/me` rejects unknown top-level keys with "Invalid updates".
 * Prefer the nested `accountProfile` blob (same pattern as sellerPayout) so DOB +
 * billing live on the Mongo user document even when flat/nested aliases are dropped.
 */
export function buildProfilePatchPayload(form: AccountProfileFields) {
  const houseAddress = form.houseAddress.trim();
  const city = form.city.trim();
  const postal = form.postalAddress.trim();
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const country = form.country.trim();
  const state = form.state.trim();
  const dob = toDateInput(form.dateOfBirth);
  const accountProfile = buildAccountProfileBlob(form);

  const payload: Record<string, unknown> = {
    name,
    email,
    phone,
    country,
    state,
    accountProfile,
    billingAddress: {
      houseAddress,
      city,
      postalAddress: postal,
      postalCode: postal,
      state,
      country,
    },
  };

  if (dob) {
    payload.dateOfBirth = dob;
  }

  return payload;
}

/** Ordered fallbacks when Render returns "Invalid updates". */
export function buildProfilePatchAttempts(form: AccountProfileFields) {
  const full = buildProfilePatchPayload(form);
  const accountProfile = buildAccountProfileBlob(form);
  const core = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    country: form.country.trim(),
    state: form.state.trim(),
  };

  const attempts: Array<Record<string, unknown>> = [
    full,
    { ...core, accountProfile, dateOfBirth: accountProfile.dateOfBirth || undefined },
    { ...core, accountProfile },
    {
      ...core,
      billingAddress: full.billingAddress,
      dateOfBirth: accountProfile.dateOfBirth || undefined,
    },
    { ...core, billingAddress: full.billingAddress },
    core,
  ];

  return attempts.map((payload) => {
    const next = { ...payload };
    if (!next.dateOfBirth) delete next.dateOfBirth;
    return next;
  });
}

export function buildSettingsPatchPayload(input: {
  emailNotifications?: boolean;
  password?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (typeof input.emailNotifications === 'boolean') {
    payload.emailNotifications = input.emailNotifications;
  }
  if (input.password) {
    payload.password = input.password;
  }
  return payload;
}

export function profilesMatch(expected: AccountProfileFields, actualUser: Record<string, unknown>) {
  const actual = profileFromUser(actualUser);
  const keys: Array<keyof AccountProfileFields> = [
    'name',
    'email',
    'phone',
    'country',
    'state',
    'houseAddress',
    'city',
    'postalAddress',
    'dateOfBirth',
  ];

  const mismatches: string[] = [];
  for (const key of keys) {
    const want =
      key === 'dateOfBirth'
        ? toDateInput(expected[key])
        : String(expected[key] || '').trim();
    if (!want) continue;
    const got =
      key === 'dateOfBirth'
        ? toDateInput(actual[key])
        : String(actual[key] || '').trim();
    if (got.toLowerCase() !== want.toLowerCase()) {
      mismatches.push(key);
    }
  }
  return { ok: mismatches.length === 0, mismatches, actual };
}

export function mergeProfileExtras(
  user: Record<string, unknown>,
  extras: {
    dateOfBirth?: string;
    houseAddress?: string;
    city?: string;
    postalAddress?: string;
    state?: string;
    country?: string;
    phone?: string;
    name?: string;
  } | null | undefined
) {
  if (!extras) return user;

  const current = profileFromUser(user);
  const billing =
    (user.billingAddress as Record<string, unknown> | undefined) ||
    (user.billing as Record<string, unknown> | undefined) ||
    {};

  const dateOfBirth = current.dateOfBirth || toDateInput(extras.dateOfBirth);
  const houseAddress = current.houseAddress || firstString(extras.houseAddress);
  const city = current.city || firstString(extras.city);
  const postalAddress = current.postalAddress || firstString(extras.postalAddress);
  const state = current.state || firstString(extras.state);
  const country = current.country || firstString(extras.country);
  const phone = current.phone || firstString(extras.phone);
  const name = current.name || firstString(extras.name);

  const accountProfile = {
    ...storedAccountProfile(user),
    name,
    phone,
    country,
    state,
    dateOfBirth,
    houseAddress,
    city,
    postalAddress,
    postalCode: postalAddress,
  };

  return {
    ...user,
    name,
    phone,
    country,
    state,
    dateOfBirth: dateOfBirth || user.dateOfBirth,
    houseAddress,
    city,
    postalAddress,
    postalCode: postalAddress,
    accountProfile,
    billingAddress: {
      ...billing,
      houseAddress,
      city,
      postalAddress,
      postalCode: postalAddress,
      state,
      country,
    },
  };
}
