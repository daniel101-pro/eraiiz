import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

type AdminActor = { id: string; email: string };

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;
const MUTATION_RATE_MAX = 40;

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
  ok: boolean;
};

const AUDIT_PATH = process.env.VERCEL
  ? path.join('/tmp', 'eraiiz-admin-audit.json')
  : path.join(process.cwd(), 'data', 'admin-audit.json');

function clientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function bumpRate(key: string, max: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, remaining: max - 1 };
  }
  current.count += 1;
  rateBuckets.set(key, current);
  return { ok: current.count <= max, remaining: Math.max(0, max - current.count) };
}

export function enforceAdminRateLimit(request: NextRequest, session: AdminActor | null) {
  const ip = clientIp(request);
  const identity = session?.id || 'anon';
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
  const max = mutating ? MUTATION_RATE_MAX : RATE_MAX;
  const result = bumpRate(`admin:${identity}:${ip}:${mutating ? 'w' : 'r'}`, max);
  if (!result.ok) {
    return NextResponse.json(
      { message: 'Too many admin requests. Slow down and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
  return null;
}

export function assertAdminSameOrigin(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  if (!host) {
    return NextResponse.json({ message: 'Invalid host' }, { status: 400 });
  }

  const allowedHosts = new Set(
    [
      host,
      process.env.VERCEL_URL,
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, ''),
      'www.eraiiz.com',
      'eraiiz.com',
      'localhost:3000',
    ]
      .filter(Boolean)
      .map((value) => String(value).replace(/^https?:\/\//, '').toLowerCase())
  );

  const check = (raw?: string | null) => {
    if (!raw) return true;
    try {
      const url = new URL(raw);
      return allowedHosts.has(url.host.toLowerCase());
    } catch {
      return false;
    }
  };

  if (origin && !check(origin)) {
    return NextResponse.json({ message: 'Cross-origin admin write blocked' }, { status: 403 });
  }
  if (!origin && referer && !check(referer)) {
    return NextResponse.json({ message: 'Cross-origin admin write blocked' }, { status: 403 });
  }
  return null;
}

async function readAudit(): Promise<AuditEvent[]> {
  try {
    const raw = await fs.readFile(AUDIT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAudit(events: AuditEvent[]) {
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.writeFile(AUDIT_PATH, JSON.stringify(events.slice(0, 2000), null, 2), 'utf8');
}

export async function recordAdminAudit(
  request: NextRequest,
  session: AdminActor,
  input: { action: string; resource: string; detail?: string; ok?: boolean }
) {
  const events = await readAudit();
  events.unshift({
    id: randomBytes(8).toString('hex'),
    at: new Date().toISOString(),
    actorId: session.id,
    actorEmail: session.email,
    action: input.action,
    resource: input.resource,
    detail: input.detail,
    ip: clientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
    ok: input.ok !== false,
  });
  await writeAudit(events);
}

export async function listAdminAudit(limit = 100) {
  const events = await readAudit();
  return events.slice(0, limit);
}

export function secureAdminJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers || {});
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  headers.set('Pragma', 'no-cache');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  return NextResponse.json(data, { ...init, headers });
}

export function fingerprintToken(token: string) {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

export function safeEqualString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function adminSecuritySnapshot() {
  return {
    httpsOnlyCookiesExpected: true,
    hstsEnabled: true,
    adminFramingDenied: true,
    adminNoStore: true,
    rateLimiting: true,
    mutationOriginCheck: true,
    auditLogging: true,
    allowlistAuth: true,
    env: {
      apiUrl: Boolean(process.env.NEXT_PUBLIC_API_URL),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
      adminEmails: Boolean(process.env.ADMIN_EMAILS),
      googleClient: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
    },
  };
}
