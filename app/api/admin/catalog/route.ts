import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

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

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'Product id required' }, { status: 400 });

  const authHeader = request.headers.get('authorization') || '';
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      { message: data.message || 'Could not remove listing' },
      { status: response.status }
    );
  }

  return NextResponse.json({ ok: true });
}
