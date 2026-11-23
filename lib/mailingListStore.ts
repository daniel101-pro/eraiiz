import { promises as fs } from 'fs';
import path from 'path';

export type MailingListEntry = {
  email: string;
  name: string;
  source: string;
  optedInAt: string;
  phone?: string;
};

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'mailing-list.json')
  : path.join(process.cwd(), 'data', 'mailing-list.json');

async function readStore(): Promise<MailingListEntry[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(entries: MailingListEntry[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(entries.slice(0, 10000), null, 2), 'utf8');
}

export async function upsertMailingListEntry(input: {
  email: string;
  name?: string;
  phone?: string;
  source?: string;
}) {
  const email = String(input.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return null;

  const entry: MailingListEntry = {
    email,
    name: String(input.name || email.split('@')[0]),
    phone: input.phone ? String(input.phone) : undefined,
    source: input.source || 'checkout',
    optedInAt: new Date().toISOString(),
  };

  const store = await readStore();
  const index = store.findIndex((item) => item.email === email);
  if (index >= 0) store[index] = { ...store[index], ...entry };
  else store.unshift(entry);
  await writeStore(store);
  return entry;
}

export async function listMailingList() {
  return readStore();
}

export async function syncMailingListToResend(entry: MailingListEntry) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return { ok: false as const, reason: 'not_configured' };

  const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: entry.email,
      first_name: entry.name.split(' ')[0] || entry.name,
      last_name: entry.name.split(' ').slice(1).join(' ') || undefined,
      unsubscribed: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false as const, reason: text || `status_${response.status}` };
  }
  return { ok: true as const };
}
