import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  CARBON_MODEL_VERSION,
  calculateCarbonFootprint,
  canRecalculateFromSustainability,
  isCarbonModelCurrent,
  type SustainabilityInput,
} from '@/lib/carbonFootprint';
import { persistProductCarbonFootprint } from '@/lib/carbonSync';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

type ProductRow = {
  _id?: string;
  id?: string;
  name?: string;
  carbonFootprint?: { modelVersion?: string } | null;
  sustainability?: SustainabilityInput | null;
};

async function fetchProductDetail(id: string, authHeader: string): Promise<ProductRow | null> {
  try {
    const protectedRes = await fetch(`${API_URL}/api/products/${id}`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(15000),
    });
    if (protectedRes.ok) {
      return (await protectedRes.json()) as ProductRow;
    }
  } catch {
    // fall through
  }

  try {
    const publicRes = await fetch(`${API_URL}/api/products/${id}/public`, {
      signal: AbortSignal.timeout(15000),
    });
    if (publicRes.ok) {
      return (await publicRes.json()) as ProductRow;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const body = await request.json().catch(() => ({}));
  const force = body.force === true;
  const dryRun = body.dryRun === true;
  const limit = Math.min(500, Math.max(1, Number(body.limit) || 200));

  const listRes = await fetch(`${API_URL}/api/products`, {
    headers: { Authorization: authHeader },
    signal: AbortSignal.timeout(20000),
  });
  const listData = await listRes.json().catch(() => []);
  const list = (Array.isArray(listData) ? listData : listData.products || []) as ProductRow[];

  const results: Array<{
    id: string;
    name: string;
    status: 'updated' | 'skipped' | 'failed' | 'dry_run';
    reason?: string;
    total?: string;
  }> = [];

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of list.slice(0, limit)) {
    const id = String(item._id || item.id || '').trim();
    if (!id) continue;

    const detail = (await fetchProductDetail(id, authHeader)) || item;
    const name = String(detail.name || item.name || id);
    const sustainability = detail.sustainability || null;

    if (!canRecalculateFromSustainability(sustainability)) {
      skipped += 1;
      results.push({ id, name, status: 'skipped', reason: 'missing sustainability inputs' });
      continue;
    }

    if (!force && isCarbonModelCurrent(detail.carbonFootprint)) {
      skipped += 1;
      results.push({ id, name, status: 'skipped', reason: 'already on current model' });
      continue;
    }

    try {
      const carbonFootprint = calculateCarbonFootprint(sustainability as SustainabilityInput);
      if (dryRun) {
        results.push({
          id,
          name,
          status: 'dry_run',
          total: carbonFootprint.total,
        });
        continue;
      }

      await persistProductCarbonFootprint({
        productId: id,
        carbonFootprint,
        authHeader,
        sustainability,
      });
      updated += 1;
      results.push({
        id,
        name,
        status: 'updated',
        total: carbonFootprint.total,
      });
    } catch (err) {
      failed += 1;
      results.push({
        id,
        name,
        status: 'failed',
        reason: err instanceof Error ? err.message : 'update failed',
      });
    }
  }

  return NextResponse.json({
    success: true,
    modelVersion: CARBON_MODEL_VERSION,
    summary: { updated, skipped, failed, scanned: Math.min(list.length, limit) },
    results,
  });
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  return NextResponse.json({
    modelVersion: CARBON_MODEL_VERSION,
    usage:
      'POST with Authorization bearer admin token. Optional body: { force, dryRun, limit }.',
  });
}
