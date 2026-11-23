import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

type RawProduct = Record<string, unknown>;

function sellerLabel(item: RawProduct) {
  const seller = item.seller;
  if (seller && typeof seller === 'object') {
    const row = seller as Record<string, unknown>;
    return String(row.name || row.businessName || row.email || row._id || '');
  }
  return String(item.sellerName || item.sellerId || '');
}

function mapProduct(item: RawProduct) {
  const images = Array.isArray(item.images) ? item.images.map(String) : [];
  return {
    id: String(item._id || item.id || ''),
    name: String(item.name || 'Untitled'),
    description: String(item.description || ''),
    price: Number(item.price || 0),
    currency: String(item.currency || 'NGN'),
    category: String(item.category || ''),
    status: String(item.status || 'active').toLowerCase(),
    material: String(item.material || ''),
    sellerId: String(item.sellerId || (item.seller as { _id?: string } | undefined)?._id || ''),
    seller: sellerLabel(item),
    image: images[0] || '',
    images,
    averageRating: Number(item.averageRating || 0),
    totalReviews: Number(item.totalReviews || 0),
    createdAt: String(item.createdAt || ''),
    updatedAt: String(item.updatedAt || ''),
  };
}

async function enrichProduct(item: RawProduct, authHeader: string) {
  const id = String(item._id || item.id || '');
  if (!id) return mapProduct(item);

  // List endpoint is sparse — hydrate from public detail when fields are missing.
  const needsDetail =
    !item.description ||
    !item.sellerId ||
    !item.status ||
    !Array.isArray(item.images) ||
    item.images.length === 0;

  if (!needsDetail) return mapProduct(item);

  try {
    const response = await fetch(`${API_URL}/api/products/${id}/public`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) return mapProduct(item);
    const detail = (await response.json().catch(() => null)) as RawProduct | null;
    if (!detail) return mapProduct(item);
    return mapProduct({ ...item, ...detail, _id: id });
  } catch {
    return mapProduct(item);
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const status = (request.nextUrl.searchParams.get('status') || 'all').trim().toLowerCase();
  const category = (request.nextUrl.searchParams.get('category') || 'all').trim().toLowerCase();
  const id = request.nextUrl.searchParams.get('id');

  try {
    if (id) {
      const response = await fetch(`${API_URL}/api/products/${id}/public`, {
        headers: authHeader ? { Authorization: authHeader } : {},
        signal: AbortSignal.timeout(12000),
        cache: 'no-store',
      });
      if (!response.ok) {
        return NextResponse.json({ message: 'Product not found' }, { status: response.status });
      }
      const detail = (await response.json()) as RawProduct;
      return secureAdminJson({ product: mapProduct({ ...detail, _id: id }) });
    }

    const response = await fetch(`${API_URL}/api/products`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => []);
    const list = Array.isArray(data) ? data : data.products || [];

    const enriched = await Promise.all(
      (list as RawProduct[]).map((item) => enrichProduct(item, authHeader))
    );

    const products = enriched
      .filter((item) => item.id)
      .filter((item) => {
        if (status !== 'all' && item.status !== status) return false;
        if (category !== 'all' && item.category.toLowerCase() !== category) return false;
        if (!q) return true;
        return [item.name, item.seller, item.category, item.id, item.description, item.material]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const categories = [...new Set(enriched.map((item) => item.category).filter(Boolean))].sort();
    const statuses = [...new Set(enriched.map((item) => item.status).filter(Boolean))].sort();

    return secureAdminJson({
      products,
      meta: {
        count: products.length,
        total: enriched.length,
        categories,
        statuses,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return secureAdminJson({ products: [], meta: { count: 0, total: 0, categories: [], statuses: [] } });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || body._id || '').trim();
  if (!id) return NextResponse.json({ message: 'Product id required' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.category !== undefined) patch.category = String(body.category);
  if (body.status !== undefined) patch.status = String(body.status).toLowerCase();
  if (body.material !== undefined) patch.material = String(body.material);
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: 'Valid price required' }, { status: 400 });
    }
    patch.price = price;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ message: 'No updates provided' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    await recordAdminAudit(request, session, {
      action: 'products.update',
      resource: `product:${id}`,
      ok: false,
      detail: data.message || 'update failed',
    });
    return NextResponse.json(
      { message: data.message || 'Could not update product' },
      { status: response.status }
    );
  }

  await recordAdminAudit(request, session, {
    action: 'products.update',
    resource: `product:${id}`,
    detail: Object.keys(patch).join(','),
  });

  const product = data.product || data;
  return secureAdminJson({
    ok: true,
    product: mapProduct({ ...(product as RawProduct), ...patch, _id: id }),
  });
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const id =
    request.nextUrl.searchParams.get('id') ||
    String((await request.json().catch(() => ({}))).id || '').trim();
  if (!id) return NextResponse.json({ message: 'Product id required' }, { status: 400 });

  const authHeader = request.headers.get('authorization') || '';
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    await recordAdminAudit(request, session, {
      action: 'products.delete',
      resource: `product:${id}`,
      ok: false,
      detail: data.message || 'delete failed',
    });
    return NextResponse.json(
      { message: data.message || 'Could not remove product' },
      { status: response.status }
    );
  }

  await recordAdminAudit(request, session, {
    action: 'products.delete',
    resource: `product:${id}`,
  });
  return secureAdminJson({ ok: true });
}
