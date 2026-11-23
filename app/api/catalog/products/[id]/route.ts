import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';
import { isProductSuppressed } from '@/lib/suppressedProductsStore';

export const revalidate = 60;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const productId = String(id || '').trim();
  if (!productId) {
    return NextResponse.json({ message: 'Product id required' }, { status: 400 });
  }

  if (await isProductSuppressed(productId)) {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }

  try {
    const response = await fetchBackend(`/api/products/${productId}/public`, {
      timeoutMs: 12000,
      revalidate: 60,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Product unavailable' },
      { status: 502 }
    );
  }
}
