import { promises as fs } from 'fs';
import path from 'path';

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'mail-log.json')
  : path.join(process.cwd(), 'data', 'mail-log.json');

type Store = Record<string, string>;

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function alreadySentMail(key: string) {
  const id = String(key || '').trim();
  if (!id) return false;
  const store = await readStore();
  return Boolean(store[id]);
}

export async function markMailSent(key: string) {
  const id = String(key || '').trim();
  if (!id) return;
  const store = await readStore();
  store[id] = new Date().toISOString();
  const keys = Object.keys(store);
  if (keys.length > 500) {
    for (const extra of keys.slice(0, keys.length - 500)) {
      delete store[extra];
    }
  }
  await writeStore(store);
}
