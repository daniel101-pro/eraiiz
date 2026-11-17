import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { expandIdentityKeys } from '@/lib/accountIdentity';
import { getBuyerOrders } from '@/lib/sellerOrderStore';
import {
  buildEcoImpactSummary,
  estimateLineImpact,
  type ImpactLineItem,
} from '@/lib/ecoImpact';
import { resolveCarbonFootprint } from '@/lib/carbonFootprint';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function fetchProduct(productId: string) {
  try {
    const response = await axios.get(`${API_URL}/api/products/${productId}/public`, {
      timeout: 8000,
    });
    return response.data || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const keys = await expandIdentityKeys(authHeader);
  if (!keys.length) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const storedOrders = await getBuyerOrders(keys);
  const lines: ImpactLineItem[] = [];
  const productCache = new Map<string, any>();

  for (const order of storedOrders) {
    if (String(order.status).toLowerCase() === 'cancelled') continue;
    const items = order.items?.length
      ? order.items
      : [{ name: 'Order', quantity: order.quantity || 1, price: order.amountNgn, productId: undefined }];

    for (const item of items) {
      const productId = String(item.productId || '').trim();
      let product = productId ? productCache.get(productId) : null;
      if (productId && product === undefined) {
        product = await fetchProduct(productId);
        productCache.set(productId, product);
      }

      const resolved = product
        ? resolveCarbonFootprint({
            carbonFootprint: product.carbonFootprint,
            sustainability: product.sustainability,
          })
        : { footprint: null };

      const estimated = estimateLineImpact({
        quantity: item.quantity,
        carbonFootprint: resolved.footprint || product?.carbonFootprint,
        sustainability: product?.sustainability,
      });

      lines.push({
        id: `${order._id}:${productId || item.name}`,
        name: String(item.name || product?.name || 'Eco purchase'),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || order.amountNgn || 0),
        createdAt: order.createdAt,
        category: String(product?.category || 'Marketplace'),
        materialType: estimated.materialType,
        carbonTotal: estimated.carbonTotal,
        carbonSaved: estimated.carbonSaved,
        productId: productId || undefined,
      });
    }
  }

  // Also fold in backend /api/orders rows that may not be in local store.
  try {
    const response = await axios.get(`${API_URL}/api/orders`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });
    const list = Array.isArray(response.data) ? response.data : [];
    for (const raw of list) {
      if (String(raw.status || '').toLowerCase() === 'cancelled') continue;
      const productId = String(raw.productId || raw.product?._id || '').trim();
      const already = lines.some(
        (line) =>
          line.id.includes(String(raw._id || '')) ||
          (productId && line.productId === productId && line.createdAt === String(raw.createdAt || ''))
      );
      if (already) continue;

      let product = productId ? productCache.get(productId) : null;
      if (productId && product === undefined) {
        product = await fetchProduct(productId);
        productCache.set(productId, product);
      }

      const resolved = product
        ? resolveCarbonFootprint({
            carbonFootprint: product.carbonFootprint,
            sustainability: product.sustainability,
          })
        : { footprint: null };
      const estimated = estimateLineImpact({
        quantity: raw.quantity || 1,
        carbonFootprint: resolved.footprint || product?.carbonFootprint || raw.carbonFootprint,
        sustainability: product?.sustainability,
      });

      lines.push({
        id: String(raw._id || `${raw.product}-${raw.createdAt}`),
        name: String(raw.product || product?.name || 'Eco purchase'),
        quantity: Number(raw.quantity || 1),
        price: Number(raw.price || 0),
        createdAt: String(raw.createdAt || new Date().toISOString()),
        category: String(product?.category || raw.category || 'Marketplace'),
        materialType: estimated.materialType,
        carbonTotal: estimated.carbonTotal,
        carbonSaved: estimated.carbonSaved,
        productId: productId || undefined,
      });
    }
  } catch {
    // local/store lines are enough
  }

  const summary = buildEcoImpactSummary(lines);
  return NextResponse.json(summary);
}
