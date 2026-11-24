import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import Stripe from 'stripe';

export type AdminOperatorStatus = 'invited' | 'active' | 'revoked';

export type AdminOperator = {
  id: string;
  email: string;
  name: string;
  status: AdminOperatorStatus;
  source: 'default' | 'env' | 'invite';
  invitedBy?: string;
  invitedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  lastSeenAt?: string;
  inviteToken?: string;
  inviteExpiresAt?: string;
};

type StoreShape = {
  operators: AdminOperator[];
};

const TMP_PATH = path.join('/tmp', 'eraiiz-admin-operators.json');
const LOCAL_PATH = path.join(process.cwd(), 'data', 'admin-operators.json');
const STRIPE_EMAIL = 'admin-operators@eraiiz.internal';
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

let memory: { at: number; store: StoreShape } | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

const DEFAULT_ADMIN_EMAILS = ['projecterraiz@gmail.com', 'falodun379@gmail.com'];

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key);
}

function envAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function operatorIdFor(email: string) {
  return createHash('sha256').update(`admin-op:${email}`).digest('hex').slice(0, 24);
}

function seedOperators(existing: AdminOperator[]): AdminOperator[] {
  const map = new Map(existing.map((row) => [row.email, row]));

  for (const email of DEFAULT_ADMIN_EMAILS) {
    if (!map.has(email)) {
      map.set(email, {
        id: operatorIdFor(email),
        email,
        name: email.split('@')[0],
        status: 'active',
        source: 'default',
        acceptedAt: new Date(0).toISOString(),
      });
    }
  }

  for (const email of envAdminEmails()) {
    const current = map.get(email);
    if (!current) {
      map.set(email, {
        id: operatorIdFor(email),
        email,
        name: email.split('@')[0],
        status: 'active',
        source: 'env',
        acceptedAt: new Date().toISOString(),
      });
    } else if (current.status === 'revoked' && current.source !== 'invite') {
      map.set(email, { ...current, status: 'active', source: 'env', revokedAt: undefined, revokedBy: undefined });
    }
  }

  return [...map.values()];
}

async function readJson(filePath: string): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const operators = Array.isArray(parsed?.operators) ? parsed.operators : Array.isArray(parsed) ? parsed : [];
    return { operators };
  } catch {
    return { operators: [] };
  }
}

async function writeJson(filePath: string, store: StoreShape) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf8');
}

function packActiveEmails(emails: string[]) {
  const unique = [...new Set(emails)];
  const metadata: Record<string, string> = {};
  let chunk: string[] = [];
  let index = 0;
  const flush = () => {
    if (!chunk.length) return;
    metadata[`a${index}`] = chunk.join(',');
    index += 1;
    chunk = [];
  };
  for (const email of unique) {
    const next = chunk.length ? `${chunk.join(',')},${email}` : email;
    if (next.length > 490) {
      flush();
      chunk = [email];
    } else {
      chunk.push(email);
    }
  }
  flush();
  return metadata;
}

function unpackActiveEmails(metadata: Record<string, string> | null | undefined) {
  const emails: string[] = [];
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!key.startsWith('a') || !value) continue;
    emails.push(...value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean));
  }
  return [...new Set(emails)];
}

async function loadStripeActiveEmails() {
  const stripe = getStripe();
  if (!stripe) return [] as string[];
  try {
    const existing = await stripe.customers.list({ email: STRIPE_EMAIL, limit: 1 });
    return unpackActiveEmails(existing.data[0]?.metadata);
  } catch {
    return [];
  }
}

async function saveStripeActiveEmails(emails: string[]) {
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const existing = await stripe.customers.list({ email: STRIPE_EMAIL, limit: 1 });
    const metadata = packActiveEmails(emails);
    if (existing.data[0]) {
      const cleared: Record<string, string> = {};
      for (const key of Object.keys(existing.data[0].metadata || {})) {
        if (key.startsWith('a')) cleared[key] = '';
      }
      await stripe.customers.update(existing.data[0].id, { metadata: { ...cleared, ...metadata } });
    } else {
      await stripe.customers.create({
        email: STRIPE_EMAIL,
        name: 'Eraiiz admin operators',
        metadata,
      });
    }
    return true;
  } catch {
    return false;
  }
}

async function readStore(): Promise<StoreShape> {
  if (memory && Date.now() - memory.at < 4_000) return memory.store;

  const [local, tmp, stripeEmails] = await Promise.all([
    readJson(LOCAL_PATH),
    readJson(TMP_PATH),
    loadStripeActiveEmails(),
  ]);

  const merged = new Map<string, AdminOperator>();
  for (const row of [...local.operators, ...tmp.operators]) {
    if (!row?.email) continue;
    merged.set(String(row.email).toLowerCase(), {
      ...row,
      email: String(row.email).toLowerCase(),
      status: row.status || 'active',
    });
  }

  for (const email of stripeEmails) {
    if (!merged.has(email)) {
      merged.set(email, {
        id: operatorIdFor(email),
        email,
        name: email.split('@')[0],
        status: 'active',
        source: 'invite',
        acceptedAt: new Date().toISOString(),
      });
    } else if (merged.get(email)?.status === 'invited') {
      const current = merged.get(email)!;
      merged.set(email, { ...current, status: 'active' });
    }
  }

  const store = { operators: seedOperators([...merged.values()]) };
  memory = { at: Date.now(), store };
  return store;
}

async function writeStore(store: StoreShape) {
  const next = { operators: store.operators.slice(0, 500) };
  memory = { at: Date.now(), store: next };
  const active = next.operators.filter((row) => row.status === 'active').map((row) => row.email);
  await Promise.all([
    writeJson(TMP_PATH, next).catch(() => undefined),
    writeJson(LOCAL_PATH, next).catch(() => undefined),
    saveStripeActiveEmails(active),
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

export async function listAdminOperators() {
  const store = await readStore();
  return store.operators.sort((a, b) => {
    const rank = (status: AdminOperatorStatus) =>
      status === 'active' ? 0 : status === 'invited' ? 1 : 2;
    const diff = rank(a.status) - rank(b.status);
    if (diff !== 0) return diff;
    return a.email.localeCompare(b.email);
  });
}

export async function isActiveOperatorEmail(email?: string | null) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return false;
  if (DEFAULT_ADMIN_EMAILS.includes(value)) return true;
  if (envAdminEmails().includes(value)) return true;
  const store = await readStore();
  return store.operators.some((row) => row.email === value && row.status === 'active');
}

export async function touchAdminOperator(email: string, name?: string) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return null;
  return enqueueWrite(async () => {
    const store = await readStore();
    const index = store.operators.findIndex((row) => row.email === value);
    const now = new Date().toISOString();
    if (index < 0) {
      if (!(await isActiveOperatorEmail(value))) return null;
      const row: AdminOperator = {
        id: operatorIdFor(value),
        email: value,
        name: name || value.split('@')[0],
        status: 'active',
        source: 'default',
        lastSeenAt: now,
      };
      store.operators.unshift(row);
      await writeStore(store);
      return row;
    }
    store.operators[index] = {
      ...store.operators[index],
      name: name || store.operators[index].name,
      lastSeenAt: now,
      status: store.operators[index].status === 'invited' ? 'active' : store.operators[index].status,
      acceptedAt: store.operators[index].acceptedAt || now,
    };
    await writeStore(store);
    return store.operators[index];
  });
}

export async function createAdminInvite(input: {
  email: string;
  name?: string;
  invitedBy: string;
}) {
  const email = String(input.email || '').trim().toLowerCase();
  if (!email.includes('@')) throw new Error('Valid email required');

  return enqueueWrite(async () => {
    const store = await readStore();
    const existing = store.operators.find((row) => row.email === email);
    if (existing?.status === 'active') {
      throw new Error('That email is already an active admin');
    }

    const token = randomBytes(24).toString('hex');
    const now = new Date().toISOString();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
    const row: AdminOperator = {
      id: existing?.id || operatorIdFor(email),
      email,
      name: String(input.name || existing?.name || email.split('@')[0]).trim(),
      status: 'invited',
      source: 'invite',
      invitedBy: input.invitedBy,
      invitedAt: now,
      inviteToken: token,
      inviteExpiresAt,
      acceptedAt: undefined,
      revokedAt: undefined,
      revokedBy: undefined,
    };

    if (existing) {
      const index = store.operators.findIndex((item) => item.email === email);
      store.operators[index] = row;
    } else {
      store.operators.unshift(row);
    }
    await writeStore(store);
    return row;
  });
}

export async function getInviteByToken(token: string) {
  const value = String(token || '').trim();
  if (!value) return null;
  const store = await readStore();
  const row = store.operators.find((item) => item.inviteToken === value && item.status === 'invited');
  if (!row) return null;
  if (row.inviteExpiresAt && new Date(row.inviteExpiresAt).getTime() < Date.now()) return null;
  return row;
}

export async function acceptAdminInvite(input: {
  token: string;
  email: string;
  name?: string;
}) {
  const token = String(input.token || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error('Invite is invalid or expired');
  if (invite.email !== email) throw new Error('Sign in with the invited email address');

  return enqueueWrite(async () => {
    const store = await readStore();
    const index = store.operators.findIndex((row) => row.inviteToken === token);
    if (index < 0) throw new Error('Invite is invalid or expired');
    const now = new Date().toISOString();
    store.operators[index] = {
      ...store.operators[index],
      status: 'active',
      name: input.name || store.operators[index].name,
      acceptedAt: now,
      lastSeenAt: now,
      inviteToken: undefined,
      inviteExpiresAt: undefined,
      revokedAt: undefined,
      revokedBy: undefined,
    };
    await writeStore(store);
    return store.operators[index];
  });
}

export async function revokeAdminOperator(input: {
  email: string;
  revokedBy: string;
}) {
  const email = String(input.email || '').trim().toLowerCase();
  if (!email) throw new Error('Email required');
  if (DEFAULT_ADMIN_EMAILS.includes(email)) {
    throw new Error('Founding admin accounts cannot be revoked here');
  }

  return enqueueWrite(async () => {
    const store = await readStore();
    const index = store.operators.findIndex((row) => row.email === email);
    if (index < 0) throw new Error('Admin not found');
    store.operators[index] = {
      ...store.operators[index],
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      revokedBy: input.revokedBy,
      inviteToken: undefined,
      inviteExpiresAt: undefined,
    };
    await writeStore(store);
    return store.operators[index];
  });
}

export function appBaseUrl() {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '';
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.DOMAIN ||
    fromVercel ||
    'https://www.eraiiz.com'
  ).replace(/\/$/, '');
}
