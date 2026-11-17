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

function toDateInput(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export function unwrapUser(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload as Record<string, unknown>;
  if (data.user && typeof data.user === 'object') {
    return data.user as Record<string, unknown>;
  }
  return data;
}

export function profileFromUser(user: Record<string, unknown> | null | undefined): AccountProfileFields {
  const billing =
    (user?.billingAddress as Record<string, unknown> | undefined) ||
    (user?.billing as Record<string, unknown> | undefined) ||
    {};

  return {
    name: firstString(user?.name, user?.fullName),
    email: firstString(user?.email),
    dateOfBirth: toDateInput(user?.dateOfBirth || user?.dob),
    phone: firstString(user?.phone, user?.phoneNumber),
    country: firstString(user?.country, billing.country),
    state: firstString(user?.state, billing.state),
    houseAddress: firstString(
      billing.houseAddress,
      billing.address,
      user?.houseAddress,
      user?.address
    ),
    city: firstString(billing.city, user?.city),
    postalAddress: firstString(
      billing.postalAddress,
      billing.postalCode,
      user?.postalAddress,
      user?.postalCode
    ),
  };
}

/** Send every shape the backend has accepted in different eras of this app. */
export function buildProfilePatchPayload(form: AccountProfileFields) {
  const houseAddress = form.houseAddress.trim();
  const city = form.city.trim();
  const postal = form.postalAddress.trim();
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const country = form.country.trim();
  const state = form.state.trim();
  const dateOfBirth = form.dateOfBirth ? new Date(form.dateOfBirth) : null;

  return {
    name,
    fullName: name,
    email,
    phone,
    phoneNumber: phone,
    country,
    state,
    dateOfBirth,
    dob: dateOfBirth,
    houseAddress,
    address: houseAddress,
    city,
    postalAddress: postal,
    postalCode: postal,
    billingAddress: {
      houseAddress,
      address: houseAddress,
      city,
      state,
      country,
      postalAddress: postal,
      postalCode: postal,
    },
    billing: {
      houseAddress,
      address: houseAddress,
      city,
      state,
      country,
      postalAddress: postal,
      postalCode: postal,
    },
  };
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
  ];

  const mismatches: string[] = [];
  for (const key of keys) {
    const want = String(expected[key] || '').trim();
    if (!want) continue;
    const got = String(actual[key] || '').trim();
    if (got.toLowerCase() !== want.toLowerCase()) {
      mismatches.push(key);
    }
  }
  return { ok: mismatches.length === 0, mismatches, actual };
}
