import { promises as fs } from 'fs';
import path from 'path';

export type ProfileExtras = {
  dateOfBirth?: string;
  houseAddress?: string;
  city?: string;
  postalAddress?: string;
  state?: string;
  country?: string;
  phone?: string;
  name?: string;
};

type Store = Record<string, ProfileExtras>;

// Soft cache only on Vercel — /tmp is wiped on redeploy. Durable source of truth
// for DOB/billing is the httpOnly cookie (see profileExtrasCookie) + browser overlay.
const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'eraiiz-user-profile-extras.json')
  : path.join(process.cwd(), 'data', 'user-profile-extras.json');

const EXTRA_KEYS: Array<keyof ProfileExtras> = [
  'dateOfBirth',
  'houseAddress',
  'city',
  'postalAddress',
  'state',
  'country',
  'phone',
  'name',
];

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function normalizeDob(value: unknown) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

export async function getUserProfileExtras(userId: string) {
  if (!userId) return {};
  const store = await readStore();
  return store[userId] || {};
}

export async function setUserProfileExtras(userId: string, extras: ProfileExtras) {
  if (!userId) return {};
  const store = await readStore();
  const next: ProfileExtras = { ...(store[userId] || {}) };

  for (const key of EXTRA_KEYS) {
    if (extras[key] === undefined) continue;
    const value =
      key === 'dateOfBirth' ? normalizeDob(extras[key]) : cleanText(extras[key]);
    if (value) next[key] = value;
    else delete next[key];
  }

  store[userId] = next;
  await writeStore(store);
  return next;
}

export function userIdsFromUser(user: Record<string, unknown> | null | undefined) {
  if (!user) return [];
  return [user._id, user.id, user.userId, user.email]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

export function hasProfileExtras(extras: ProfileExtras | null | undefined) {
  if (!extras) return false;
  return EXTRA_KEYS.some((key) => Boolean(cleanText(extras[key])));
}
