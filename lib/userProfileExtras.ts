import { promises as fs } from 'fs';
import path from 'path';

type Extras = {
  dateOfBirth?: string;
};

type Store = Record<string, Extras>;

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'eraiiz-user-profile-extras.json')
  : path.join(process.cwd(), 'data', 'user-profile-extras.json');

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

export async function getUserProfileExtras(userId: string) {
  if (!userId) return {};
  const store = await readStore();
  return store[userId] || {};
}

export async function setUserProfileExtras(userId: string, extras: Extras) {
  if (!userId) return;
  const store = await readStore();
  const next: Extras = { ...(store[userId] || {}) };
  if (extras.dateOfBirth !== undefined) {
    const dob = normalizeDob(extras.dateOfBirth);
    if (dob) next.dateOfBirth = dob;
    else delete next.dateOfBirth;
  }
  store[userId] = next;
  await writeStore(store);
  return next;
}

export function userIdsFromUser(user: Record<string, unknown> | null | undefined) {
  if (!user) return [];
  return [user._id, user.id, user.userId]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}
