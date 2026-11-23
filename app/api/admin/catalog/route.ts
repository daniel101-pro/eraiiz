import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { recordAdminAudit, secureAdminJson } from '@/lib/adminSecurity';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const authHeader = request.headers.get('authorization') || '';
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

  try {
    const response = await fetch(`${API_URL}/api/products`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(12000),
    });
    const data = await response.json().catch(() => []);
    const list = Array.isArray(data) ? data : data.products || [];
    const products = list
      .map((item: Record<string, unknown>) => ({
        id: String(item._id || item.id || ''),
        name: String(item.name || 'Untitled'),
        price: Number(item.price || 0),
        currency: String(item.currency || 'NGN'),
        seller: String((item.seller as { name?: string })?.name || item.sellerName || item.sellerId || ''),
        category: String(item.category || ''),
        createdAt: String(item.createdAt || ''),
      }))
      .filter((item: { id: string; name: string; seller: string; category: string }) =>
        q
          ? [item.name, item.seller, item.category, item.id].join(' ').toLowerCase().includes(q)
          : true
      );

    return secureAdminJson({ products });
  } catch {
    return secureAdminJson({ products: [] });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'Product id required' }, { status: 400 });

  const authHeader = request.headers.get('authorization') || '';
  const paths = [
    `${API_URL}/api/admin/products/${id}`,
    `${API_URL}/api/admin/product/${id}`,
    `${API_URL}/api/products/${id}`,
  ];

  let lastStatus = 500;
  let lastMessage = 'Could not remove listing';
  let deleted = false;

  for (const url of paths) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({}));
    lastStatus = response.status;
    lastMessage = data.message || lastMessage;
    if (response.ok) {
      deleted = true;
      break;
    }
    if (![401, 403, 404, 405].includes(response.status)) break;
  }

  if (!deleted) {
    await recordAdminAudit(request, session, {
      action: 'catalog.delete',
      resource: `product:${id}`,
      ok: false,
      detail: lastMessage,
    });
    return NextResponse.json({ message: lastMessage }, { status: lastStatus });
  }

  await recordAdminAudit(request, session, {
    action: 'catalog.delete',
    resource: `product:${id}`,
  });
  return secureAdminJson({ ok: true });
}
