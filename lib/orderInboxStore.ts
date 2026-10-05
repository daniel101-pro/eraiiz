import { promises as fs } from 'fs';
import path from 'path';

export interface InboxNotification {
  _id: string;
  userId: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
}

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'order-inbox.json')
  : path.join(process.cwd(), 'data', 'order-inbox.json');

type Store = Record<string, InboxNotification[]>;

function normalizeKey(id: string) {
  const value = String(id || '').trim();
  if (!value) return '';
  return value.includes('@') ? value.toLowerCase() : value;
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.map((id) => normalizeKey(String(id || ''))).filter(Boolean))];
}

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

export async function addInboxNotification(
  userIds: Array<string | null | undefined>,
  notification: Omit<InboxNotification, 'userId'>
) {
  const ids = uniqueIds(userIds);
  if (ids.length === 0) return notification;

  const store = await readStore();
  for (const id of ids) {
    const entry: InboxNotification = { ...notification, userId: id };
    const existing = store[id] || [];
    store[id] = [entry, ...existing.filter((item) => item._id !== entry._id)].slice(0, 100);
  }
  await writeStore(store);
  return { ...notification, userId: ids[0] };
}

export async function getInboxForUsers(userIds: Array<string | null | undefined>) {
  const ids = uniqueIds(userIds);
  const store = await readStore();
  const merged = new Map<string, InboxNotification>();

  for (const id of ids) {
    for (const item of store[id] || []) {
      merged.set(item._id, item);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function markInboxRead(
  userIds: Array<string | null | undefined>,
  notificationId: string,
  read = true
) {
  const ids = uniqueIds(userIds);
  const store = await readStore();
  let updated: InboxNotification | null = null;

  for (const id of ids) {
    store[id] = (store[id] || []).map((item) => {
      if (item._id !== notificationId) return item;
      updated = { ...item, read };
      return updated;
    });
  }

  await writeStore(store);
  return updated;
}

export async function clearInboxForUsers(userIds: Array<string | null | undefined>) {
  const ids = uniqueIds(userIds);
  const store = await readStore();
  for (const id of ids) {
    delete store[id];
  }
  await writeStore(store);
}
