import { promises as fs } from 'fs';
import path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';
const CACHE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'eraiiz-backend-admin-token.json')
  : path.join(process.cwd(), 'data', 'backend-admin-token.json');

type TokenCache = {
  token: string;
  expiresAt: number;
};

function staticServiceToken() {
  const serviceToken = String(
    process.env.BACKEND_ADMIN_TOKEN ||
      process.env.ERAIIZ_BACKEND_ADMIN_TOKEN ||
      process.env.ADMIN_API_TOKEN ||
      ''
  ).trim();
  if (!serviceToken) return '';
  return serviceToken.startsWith('Bearer ') ? serviceToken : `Bearer ${serviceToken}`;
}

async function readCache(): Promise<TokenCache | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TokenCache;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (parsed.expiresAt <= Date.now() + 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(cache: TokenCache) {
  try {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache), 'utf8');
  } catch {
    // ignore cache write failures
  }
}

function decodeExp(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return Number(json.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

async function loginForAdminToken() {
  const email = String(process.env.BACKEND_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.BACKEND_ADMIN_PASSWORD || '');
  if (!email || !password) return '';

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) return '';

  const token = String(
    data.accessToken || data.token || (data.data as { accessToken?: string } | undefined)?.accessToken || ''
  ).trim();
  if (!token) return '';

  const expiresAt = decodeExp(token) || Date.now() + 55 * 60_000;
  await writeCache({ token, expiresAt });
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * Prefer a dedicated backend admin JWT / service login so Next allowlist admins
 * can mutate Render resources even when their own role is not `admin`.
 */
export async function resolveBackendAdminAuth(requestAuthHeader?: string | null) {
  const staticToken = staticServiceToken();
  if (staticToken) return staticToken;

  const cached = await readCache();
  if (cached?.token) {
    return cached.token.startsWith('Bearer ') ? cached.token : `Bearer ${cached.token}`;
  }

  const loggedIn = await loginForAdminToken().catch(() => '');
  if (loggedIn) return loggedIn;

  return String(requestAuthHeader || '').trim();
}

/** Sync helper for call sites that cannot await (falls back to static token / request). */
export function backendAdminAuthHeader(requestAuthHeader?: string | null) {
  const staticToken = staticServiceToken();
  if (staticToken) return staticToken;
  return String(requestAuthHeader || '').trim();
}
