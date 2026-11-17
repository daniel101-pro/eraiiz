import {
  mergeProfileExtras,
  profileFromUser,
  type AccountProfileFields,
} from '@/lib/accountProfile';

const OVERLAY_PREFIX = 'eraiiz_profile_overlay:';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function overlayKey(userId: string) {
  return `${OVERLAY_PREFIX}${String(userId || '').trim().toLowerCase()}`;
}

export function profileOverlayIds(user: Record<string, unknown> | null | undefined) {
  if (!user) return [];
  return [user._id, user.id, user.userId, user.email]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

export function readProfileOverlay(user: Record<string, unknown> | null | undefined) {
  if (typeof window === 'undefined' || !user) return {};
  try {
    for (const id of profileOverlayIds(user)) {
      const raw = localStorage.getItem(overlayKey(id));
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Partial<AccountProfileFields>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function writeProfileOverlay(
  user: Record<string, unknown> | null | undefined,
  profile: Partial<AccountProfileFields>
) {
  if (typeof window === 'undefined' || !user) return;
  const extras = {
    dateOfBirth: clean(profile.dateOfBirth),
    houseAddress: clean(profile.houseAddress),
    city: clean(profile.city),
    postalAddress: clean(profile.postalAddress),
    state: clean(profile.state),
    country: clean(profile.country),
    phone: clean(profile.phone),
    name: clean(profile.name),
  };
  const hasAny = Object.values(extras).some(Boolean);
  try {
    for (const id of profileOverlayIds(user)) {
      if (!hasAny) {
        localStorage.removeItem(overlayKey(id));
        continue;
      }
      localStorage.setItem(overlayKey(id), JSON.stringify(extras));
    }
  } catch {
    // ignore
  }
}

export function clearProfileOverlay(user?: Record<string, unknown> | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      for (const id of profileOverlayIds(user)) {
        localStorage.removeItem(overlayKey(id));
      }
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(OVERLAY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/** Merge durable browser overlay onto a user object from the API. */
export function applyProfileOverlay(user: Record<string, unknown> | null | undefined) {
  if (!user) return user;
  const overlay = readProfileOverlay(user);
  if (!Object.values(overlay).some((v) => clean(v))) return user;
  return mergeProfileExtras(user, overlay);
}

export function cacheMergedUser(user: Record<string, unknown>) {
  const merged = applyProfileOverlay(user) || user;
  try {
    localStorage.setItem('user', JSON.stringify(merged));
  } catch {
    // ignore
  }
  return merged;
}

export function saveProfileLocally(
  user: Record<string, unknown>,
  profile: AccountProfileFields | Partial<AccountProfileFields>
) {
  writeProfileOverlay(user, profile);
  const merged = mergeProfileExtras(user, {
    dateOfBirth: clean(profile.dateOfBirth) || undefined,
    houseAddress: clean(profile.houseAddress) || undefined,
    city: clean(profile.city) || undefined,
    postalAddress: clean(profile.postalAddress) || undefined,
    state: clean(profile.state) || undefined,
    country: clean(profile.country) || undefined,
    phone: clean(profile.phone) || undefined,
    name: clean(profile.name) || undefined,
  });
  try {
    localStorage.setItem('user', JSON.stringify(merged));
  } catch {
    // ignore
  }
  return merged;
}

export function profileSnapshot(user: Record<string, unknown> | null | undefined) {
  return profileFromUser(applyProfileOverlay(user) || user);
}
