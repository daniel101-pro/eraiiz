import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export type MailIdentity = {
  id: string;
  localPart: string;
  email: string;
  displayName: string;
  color: string;
  createdAt: string;
  createdBy?: string;
};

const DOMAIN = 'eraiiz.com';
const TMP_PATH = path.join('/tmp', 'eraiiz-mail-identities.json');
const LOCAL_PATH = path.join(process.cwd(), 'data', 'mail-identities.json');

const DEFAULTS: Array<Pick<MailIdentity, 'localPart' | 'displayName' | 'color'>> = [
  { localPart: 'support', displayName: 'Eraiiz Support', color: '#1a73e8' },
  { localPart: 'hello', displayName: 'Eraiiz', color: '#188038' },
  { localPart: 'noreply', displayName: 'Eraiiz Notices', color: '#5f6368' },
];

let memory: { at: number; identities: MailIdentity[] } | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function identityId(localPart: string) {
  return createHash('sha256').update(`mail-id:${localPart}@${DOMAIN}`).digest('hex').slice(0, 16);
}

function normalizeLocalPart(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@eraiiz\.com$/i, '')
    .replace(/[^a-z0-9._+-]/g, '')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 64);
}

function colorFor(localPart: string) {
  const palette = ['#1a73e8', '#188038', '#e37400', '#c5221f', '#9334e6', '#007b83', '#1967d2', '#f9ab00'];
  let hash = 0;
  for (let i = 0; i < localPart.length; i += 1) hash = (hash * 31 + localPart.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function seed(identities: MailIdentity[]) {
  const map = new Map(identities.map((row) => [row.localPart, row]));
  for (const item of DEFAULTS) {
    if (!map.has(item.localPart)) {
      map.set(item.localPart, {
        id: identityId(item.localPart),
        localPart: item.localPart,
        email: `${item.localPart}@${DOMAIN}`,
        displayName: item.displayName,
        color: item.color,
        createdAt: new Date(0).toISOString(),
      });
    }
  }
  return [...map.values()].sort((a, b) => a.localPart.localeCompare(b.localPart));
}

async function readFile(filePath: string): Promise<MailIdentity[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MailIdentity[]) : Array.isArray(parsed?.identities) ? parsed.identities : [];
  } catch {
    return [];
  }
}

async function writeFile(filePath: string, identities: MailIdentity[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify({ identities }, null, 2), 'utf8');
}

async function readStore() {
  if (memory && Date.now() - memory.at < 4_000) return memory.identities;
  const [local, tmp] = await Promise.all([readFile(LOCAL_PATH), readFile(TMP_PATH)]);
  const map = new Map<string, MailIdentity>();
  for (const row of [...local, ...tmp]) {
    if (!row?.localPart) continue;
    map.set(String(row.localPart).toLowerCase(), {
      ...row,
      localPart: String(row.localPart).toLowerCase(),
      email: `${String(row.localPart).toLowerCase()}@${DOMAIN}`,
    });
  }
  const identities = seed([...map.values()]);
  memory = { at: Date.now(), identities };
  return identities;
}

async function writeStore(identities: MailIdentity[]) {
  const next = seed(identities).slice(0, 100);
  memory = { at: Date.now(), identities: next };
  await Promise.all([
    writeFile(TMP_PATH, next).catch(() => undefined),
    writeFile(LOCAL_PATH, next).catch(() => undefined),
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

export function mailIdentityDomain() {
  return DOMAIN;
}

export async function listMailIdentities() {
  return readStore();
}

export async function getMailIdentity(emailOrLocal: string) {
  const value = String(emailOrLocal || '').trim().toLowerCase();
  const local = normalizeLocalPart(value);
  const identities = await readStore();
  return identities.find((row) => row.localPart === local || row.email === value) || null;
}

export async function createMailIdentity(input: {
  localPart: string;
  displayName?: string;
  createdBy?: string;
}) {
  const localPart = normalizeLocalPart(input.localPart);
  if (!localPart || localPart.length < 2) {
    throw new Error('Use at least 2 characters for the email name');
  }
  if (['www', 'admin', 'root', 'postmaster'].includes(localPart)) {
    throw new Error('That email name is reserved');
  }

  return enqueueWrite(async () => {
    const identities = await readStore();
    if (identities.some((row) => row.localPart === localPart)) {
      throw new Error(`${localPart}@${DOMAIN} already exists`);
    }
    const row: MailIdentity = {
      id: identityId(localPart),
      localPart,
      email: `${localPart}@${DOMAIN}`,
      displayName: String(input.displayName || localPart).trim() || localPart,
      color: colorFor(localPart),
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };
    identities.push(row);
    await writeStore(identities);
    return row;
  });
}

export async function deleteMailIdentity(localPartInput: string) {
  const localPart = normalizeLocalPart(localPartInput);
  if (DEFAULTS.some((item) => item.localPart === localPart)) {
    throw new Error('Default Eraiiz addresses cannot be deleted');
  }
  return enqueueWrite(async () => {
    const identities = await readStore();
    const next = identities.filter((row) => row.localPart !== localPart);
    if (next.length === identities.length) throw new Error('Address not found');
    await writeStore(next);
    return true;
  });
}

export function formatMailFrom(identity: Pick<MailIdentity, 'displayName' | 'email'>) {
  const name = String(identity.displayName || 'Eraiiz').replace(/[<>]/g, '');
  return `${name} <${identity.email}>`;
}
