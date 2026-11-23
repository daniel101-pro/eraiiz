import { promises as fs } from 'fs';
import path from 'path';

export type DirectoryUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  updatedAt: string;
  source?: string;
};

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'user-directory.json')
  : path.join(process.cwd(), 'data', 'user-directory.json');

async function readStore(): Promise<DirectoryUser[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(users: DirectoryUser[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(users.slice(0, 5000), null, 2), 'utf8');
}

export async function upsertDirectoryUser(input: {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  source?: string;
}) {
  const email = String(input.email || '').trim().toLowerCase();
  const id = String(input.id || email || '').trim();
  if (!id && !email) return null;

  const next: DirectoryUser = {
    id: id || email,
    email,
    name: String(input.name || email.split('@')[0] || id),
    role: String(input.role || 'buyer').toLowerCase() || 'buyer',
    updatedAt: new Date().toISOString(),
    source: input.source || 'observed',
  };

  const store = await readStore();
  const key = email || id;
  const index = store.findIndex(
    (user) =>
      (email && user.email === email) ||
      user.id === id ||
      (!email && user.id === key)
  );

  if (index >= 0) {
    store[index] = {
      ...store[index],
      ...next,
      name:
        next.name && next.name !== next.id
          ? next.name
          : store[index].name || next.name,
      role: next.role || store[index].role,
    };
  } else {
    store.unshift(next);
  }

  await writeStore(store);
  return next;
}

export async function listDirectoryUsers() {
  return readStore();
}
