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

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'admin-mail.json')
  : path.join(process.cwd(), 'data', 'admin-mail.json');

async function readStore(): Promise<AdminMailMessage[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(messages: AdminMailMessage[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(messages.slice(0, 2000), null, 2), 'utf8');
}

export function threadIdFor(email: string) {
  return String(email || '').trim().toLowerCase() || 'unknown';
}

export async function addAdminMail(input: Omit<AdminMailMessage, 'id' | 'createdAt' | 'read' | 'starred' | 'threadId'> & {
  id?: string;
  threadId?: string;
  read?: boolean;
  starred?: boolean;
  createdAt?: string;
}) {
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

export async function patchAdminMail(id: string, patch: Partial<Pick<AdminMailMessage, 'read' | 'starred' | 'folder'>>) {
  const store = await readStore();
  const index = store.findIndex((item) => item.id === id);
  if (index < 0) return null;
  store[index] = { ...store[index], ...patch };
  await writeStore(store);
  return store[index];
}

export async function adminMailCounts() {
  const store = await readStore();
  const unread = store.filter((item) => !item.read && item.folder !== 'sent' && item.folder !== 'archived').length;
  return {
    inbox: store.filter((item) => item.folder === 'inbox' || item.folder === 'support' || item.folder === 'reports').length,
    unread,
    sent: store.filter((item) => item.folder === 'sent').length,
    support: store.filter((item) => item.folder === 'support').length,
    reports: store.filter((item) => item.folder === 'reports').length,
    starred: store.filter((item) => item.starred && item.folder !== 'archived').length,
    archived: store.filter((item) => item.folder === 'archived').length,
  };
}
