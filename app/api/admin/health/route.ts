import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { secureAdminJson } from '@/lib/adminSecurity';
import { isPaystackConfigured, isStripeConfigured } from '@/lib/paymentConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function ping(url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(6000), cache: 'no-store' });
    return {
      ok: response.ok || response.status < 500,
      status: response.status,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : 'unreachable',
    };
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const [api, site] = await Promise.all([
    ping(`${API_URL}/api/products/random`),
    ping(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eraiiz.com'),
  ]);

  const checks = [
    { id: 'api', label: 'Product API', ...api },
    { id: 'site', label: 'Storefront', ...site },
    { id: 'stripe', label: 'Stripe configured', ok: isStripeConfigured, status: isStripeConfigured ? 200 : 0, ms: 0 },
    { id: 'paystack', label: 'Paystack configured', ok: isPaystackConfigured, status: isPaystackConfigured ? 200 : 0, ms: 0 },
    { id: 'admin-emails', label: 'Admin allowlist env', ok: Boolean(process.env.ADMIN_EMAILS), status: process.env.ADMIN_EMAILS ? 200 : 0, ms: 0 },
  ];

  const healthy = checks.every((check) => check.ok);

  return secureAdminJson({
    healthy,
    checks,
    runtime: {
      nodeEnv: process.env.NODE_ENV || 'development',
      vercel: Boolean(process.env.VERCEL),
      region: process.env.VERCEL_REGION || 'local',
      generatedAt: new Date().toISOString(),
    },
  });
}
