import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_URL, fetchBackend } from '@/lib/backendApi';
import { filterSuppressedProducts, suppressedProductIdSet } from '@/lib/suppressedProductsStore';

export const revalidate = 60;

function extractProducts(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.products)) return obj.products;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 48) || 48, 100);
  const search = (request.nextUrl.searchParams.get('search') || '').trim();
  const authHeader = request.headers.get('authorization') || '';

  try {
    const query = new URLSearchParams();
    if (limit) query.set('limit', String(limit));
    if (search) query.set('search', search);

    let response = await fetchBackend(`/api/products?${query.toString()}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeoutMs: 12000,
      revalidate: 60,
    });

    let products = extractProducts(await response.json().catch(() => []));

    if (!response.ok || !products.length) {
      response = await fetchBackend('/api/products/random?limit=24', {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeoutMs: 12000,
        revalidate: 60,
      });
      products = extractProducts(await response.json().catch(() => []));
    }

    const suppressed = await suppressedProductIdSet();
    const list = filterSuppressedProducts(
      products.filter((item) => item && typeof item === 'object') as Array<{
        _id?: unknown;
        id?: unknown;
      }>,
      suppressed
    ).slice(0, limit);

    return NextResponse.json(
      {
        products: list,
        meta: {
          count: list.length,
          source: BACKEND_API_URL,
          cached: true,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        products: [],
        meta: {
          count: 0,
          error: error instanceof Error ? error.message : 'catalog_unavailable',
        },
      },
      { status: 502 }
    );
  }
}
