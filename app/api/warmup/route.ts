import { NextRequest, NextResponse } from 'next/server';
import { warmBackend } from '@/lib/backendApi';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Keeps the Render API awake so shoppers don't hit a cold start.
 * Hit by Vercel Cron + a light client ping on first page load.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || '';
  const auth = request.headers.get('authorization') || '';
  const isCron =
    request.headers.get('x-vercel-cron') === '1' ||
    (cronSecret && auth === `Bearer ${cronSecret}`);

  // Allow anonymous light warmup from the storefront; cron can also call it.
  const result = await warmBackend();

  return NextResponse.json(
    {
      ok: result.ok,
      ms: result.ms,
      cron: isCron,
      checks: result.checks,
      at: new Date().toISOString(),
    },
    {
      status: result.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
