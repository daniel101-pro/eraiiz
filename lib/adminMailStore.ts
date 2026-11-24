import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type AdminMailFolder = 'inbox' | 'sent' | 'support' | 'reports' | 'starred' | 'archived';

export type AdminMailMessage = {
  id: string;
  threadId: string;
  folder: Exclude<AdminMailFolder, 'starred'>;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  text: string;
  read: boolean;
  starred: boolean;
  createdAt: string;
  productId?: string;
  reason?: string;
};

const TMP_PATH = path.join('/tmp', 'admin-mail.json');
const LOCAL_PATH = path.join(process.cwd(), 'data', 'admin-mail.json');

let writeChain: Promise<unknown> = Promise.resolve();
let memoryCache: { at: number; messages: AdminMailMessage[] } | null = null;

async function readJsonFile(filePath: string): Promise<AdminMailMessage[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminMailMessage[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonFile(filePath: string, messages: AdminMailMessage[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(messages.slice(0, 2000), null, 2), 'utf8');
}

function mergeMessages(lists: AdminMailMessage[][]) {
  const map = new Map<string, AdminMailMessage>();
  for (const list of lists) {
    for (const item of list) {
      if (!item?.id) continue;
      const current = map.get(item.id);
      if (!current) {
        map.set(item.id, item);
        continue;
      }
      map.set(item.id, {
        ...current,
        ...item,
        read: Boolean(current.read || item.read),
        starred: Boolean(item.starred ?? current.starred),
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function readStore(): Promise<AdminMailMessage[]> {
  if (memoryCache && Date.now() - memoryCache.at < 3_000) {
    return memoryCache.messages;
  }
  const [local, tmp] = await Promise.all([readJsonFile(LOCAL_PATH), readJsonFile(TMP_PATH)]);
  const messages = mergeMessages([local, tmp]);
  memoryCache = { at: Date.now(), messages };
  return messages;
}

async function writeStore(messages: AdminMailMessage[]) {
  const next = messages.slice(0, 2000);
  memoryCache = { at: Date.now(), messages: next };
  await Promise.all([
    writeJsonFile(TMP_PATH, next).catch(() => undefined),
    writeJsonFile(LOCAL_PATH, next).catch(() => undefined),
  ]);
}

function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function threadIdFor(email: string) {
  return String(email || '').trim().toLowerCase() || 'unknown';
}

export async function addAdminMail(
  input: Omit<AdminMailMessage, 'id' | 'createdAt' | 'read' | 'starred' | 'threadId'> & {
    id?: string;
    threadId?: string;
    read?: boolean;
    starred?: boolean;
    createdAt?: string;
  }
) {
  return enqueueWrite(async () => {
    const message: AdminMailMessage = {
      id: input.id || randomUUID(),
      threadId: input.threadId || threadIdFor(input.folder === 'sent' ? input.toEmail : input.fromEmail),
      folder: input.folder,
      fromName: input.fromName,
      fromEmail: String(input.fromEmail || '').trim().toLowerCase(),
      toName: input.toName,
      toEmail: String(input.toEmail || '').trim().toLowerCase(),
      subject: input.subject || '(no subject)',
      text: input.text || '',
      read: Boolean(input.read),
      starred: Boolean(input.starred),
      createdAt: input.createdAt || new Date().toISOString(),
      productId: input.productId,
      reason: input.reason,
    };

    const store = await readStore();
    store.unshift(message);
    await writeStore(store);
    return message;
  });
}

export async function listAdminMail(folder: AdminMailFolder = 'inbox', query = '') {
  const store = await readStore();
  const q = query.trim().toLowerCase();

  const filtered = store.filter((item) => {
    if (folder === 'starred') return item.starred && item.folder !== 'archived';
    if (folder === 'inbox') return item.folder === 'inbox' || item.folder === 'support' || item.folder === 'reports';
    return item.folder === folder;
  });

  const searched = q
    ? filtered.filter((item) =>
        [item.fromName, item.fromEmail, item.toName, item.toEmail, item.subject, item.text]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : filtered;

  return searched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAdminMail(id: string) {
  const store = await readStore();
  return store.find((item) => item.id === id) || null;
}

export async function getAdminThread(threadId: string) {
  const store = await readStore();
  return store
    .filter((item) => item.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function patchAdminMail(
  id: string,
  patch: Partial<Pick<AdminMailMessage, 'read' | 'starred' | 'folder'>>
) {
  return enqueueWrite(async () => {
    const store = await readStore();
    const index = store.findIndex((item) => item.id === id);
    if (index < 0) return null;
    store[index] = { ...store[index], ...patch };
    await writeStore(store);
    return store[index];
  });
}

export async function adminMailCounts(extra: AdminMailMessage[] = []) {
  const store = mergeMessages([await readStore(), extra]);
  const unread = store.filter(
    (item) => !item.read && item.folder !== 'sent' && item.folder !== 'archived'
  ).length;
  return {
    inbox: store.filter(
      (item) => item.folder === 'inbox' || item.folder === 'support' || item.folder === 'reports'
    ).length,
    unread,
    sent: store.filter((item) => item.folder === 'sent').length,
    support: store.filter((item) => item.folder === 'support').length,
    reports: store.filter((item) => item.folder === 'reports').length,
    starred: store.filter((item) => item.starred && item.folder !== 'archived').length,
    archived: store.filter((item) => item.folder === 'archived').length,
  };
}

/** Merge remote Resend rows into the local durable-ish cache when possible. */
export async function rememberRemoteMail(messages: AdminMailMessage[]) {
  if (!messages.length) return;
  return enqueueWrite(async () => {
    const store = await readStore();
    const merged = mergeMessages([store, messages]);
    if (merged.length !== store.length) {
      await writeStore(merged);
    } else {
      // Still refresh cache timestamps/content when ids already existed
      memoryCache = { at: Date.now(), messages: merged };
    }
  });
}
