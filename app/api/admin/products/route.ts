import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { resolveBackendAdminAuth } from '@/lib/backendAdminAuth';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';
import {
  filterSuppressedProducts,
  suppressProduct,
  suppressedProductIdSet,
} from '@/lib/suppressedProductsStore';

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
  const suppressed = await suppressedProductIdSet();

  try {
    if (id) {
      if (suppressed.has(id)) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
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
    const visible = filterSuppressedProducts(list as RawProduct[], suppressed);

    const enriched = await Promise.all(
      visible.map((item) => enrichProduct(item, authHeader))
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

  const authHeader = await resolveBackendAdminAuth(request.headers.get('authorization'));
  const updatePaths = [
    `${API_URL}/api/admin/products/${id}`,
    `${API_URL}/api/admin/product/${id}`,
    `${API_URL}/api/products/${id}`,
  ];

  let data: Record<string, unknown> = {};
  let ok = false;
  let lastStatus = 500;
  let lastMessage = 'Could not update product';

  for (const url of updatePaths) {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(15000),
    });
    data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    lastStatus = response.status;
    lastMessage = String(data.message || lastMessage);
    if (response.ok) {
      ok = true;
      break;
    }
    if (![401, 403, 404, 405].includes(response.status)) break;
  }

  if (!ok) {
    await recordAdminAudit(request, session, {
      action: 'products.update',
      resource: `product:${id}`,
      ok: false,
      detail: lastMessage,
    });
    return NextResponse.json({ message: lastMessage }, { status: lastStatus });
  }

  await recordAdminAudit(request, session, {
    action: 'products.update',
    resource: `product:${id}`,
    detail: Object.keys(patch).join(','),
  });

  const product = (data.product || data) as RawProduct;
  return secureAdminJson({
    ok: true,
    product: mapProduct({ ...product, ...patch, _id: id }),
  });
}

async function backendDeleteProduct(id: string, authHeader: string) {
  const paths = [
    `${API_URL}/api/admin/products/${id}`,
    `${API_URL}/api/admin/product/${id}`,
    `${API_URL}/api/products/${id}`,
  ];

  let lastStatus = 500;
  let lastMessage = 'Could not remove product';

  for (const url of paths) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(15000),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    lastStatus = response.status;
    lastMessage = String(data.message || lastMessage);
    if (response.ok) return { ok: true as const, soft: false };
    if (![401, 403, 404, 405].includes(response.status)) {
      return { ok: false as const, status: lastStatus, message: lastMessage };
    }
  }

  for (const url of [`${API_URL}/api/admin/products/${id}`, `${API_URL}/api/products/${id}`]) {
    for (const status of ['archived', 'inactive', 'deleted']) {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) return { ok: true as const, soft: true, status };
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      lastStatus = response.status;
      lastMessage = String(data.message || lastMessage);
    }
  }

  return { ok: false as const, status: lastStatus, message: lastMessage };
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const id =
    request.nextUrl.searchParams.get('id') ||
    String((await request.json().catch(() => ({}))).id || '').trim();
  if (!id) return NextResponse.json({ message: 'Product id required' }, { status: 400 });

  const authHeader = await resolveBackendAdminAuth(request.headers.get('authorization'));
  const result = await backendDeleteProduct(id, authHeader);

  // Next allowlist admins can still take listings down even when Render role≠admin.
  if (!result.ok) {
    await suppressProduct({
      id,
      by: session.email,
      reason: `fallback:${result.status}:${result.message}`.slice(0, 180),
    });
    revalidatePath('/api/catalog/products');
    revalidatePath('/for-you');
    await recordAdminAudit(request, session, {
      action: 'products.delete',
      resource: `product:${id}`,
      detail: 'suppressed-storefront',
    });
    return secureAdminJson({
      ok: true,
      softDeleted: true,
      suppressed: true,
      message: 'Removed from the Eraiiz storefront. Backend role was missing, so it was hidden instead of hard-deleted on Render.',
    });
  }

  await suppressProduct({
    id,
    by: session.email,
    reason: result.soft ? `soft:${result.status}` : 'hard',
  });
  revalidatePath('/api/catalog/products');
  revalidatePath('/for-you');

  await recordAdminAudit(request, session, {
    action: 'products.delete',
    resource: `product:${id}`,
    detail: result.soft ? `soft:${result.status}` : 'hard',
  });
  return secureAdminJson({ ok: true, softDeleted: Boolean(result.soft) });
}
