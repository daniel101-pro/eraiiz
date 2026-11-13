import { promises as fs } from 'fs';
import path from 'path';

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'processed-payments.json')
  : path.join(process.cwd(), 'data', 'processed-payments.json');

const inFlight = new Set<string>();

async function readStore(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, string>) {
  const entries = Object.entries(store).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 5000);
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(Object.fromEntries(entries)), 'utf8');
}

export async function claimPaymentReference(reference: string): Promise<boolean> {
  const key = String(reference || '').trim();
  if (!key || inFlight.has(key)) return false;
  inFlight.add(key);
  try {
    const store = await readStore();
    if (store[key]) return false;
    store[key] = new Date().toISOString();
    await writeStore(store);
    return true;
  } finally {
    inFlight.delete(key);
  }
}

export async function releasePaymentReference(reference: string) {
  const store = await readStore();
  if (!store[reference]) return;
  delete store[reference];
  await writeStore(store);
}
