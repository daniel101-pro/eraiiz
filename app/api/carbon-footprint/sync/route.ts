import { NextRequest, NextResponse } from 'next/server';
import {
  CARBON_MODEL_VERSION,
  calculateCarbonFootprint,
  canRecalculateFromSustainability,
  isCarbonModelCurrent,
  type SustainabilityInput,
} from '@/lib/carbonFootprint';
import { persistProductCarbonFootprint } from '@/lib/carbonSync';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function loadProduct(productId: string, authHeader?: string | null) {
  if (authHeader) {
    try {
      const protectedRes = await fetch(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(15000),
      });
      if (protectedRes.ok) {
        return protectedRes.json();
      }
    } catch {
      // fall through to public
    }
  }

  const publicRes = await fetch(`${API_URL}/api/products/${productId}/public`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!publicRes.ok) {
    throw new Error('Product not found');
  }
  return publicRes.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = String(body.productId || body.id || '').trim();
    const persist = body.persist !== false;
    const authHeader = request.headers.get('authorization');

    let sustainability = (body.sustainabilityData || body.sustainability || null) as
      | SustainabilityInput
      | null;
    let product: Record<string, unknown> | null = null;

    if (productId) {
      product = await loadProduct(productId, authHeader);
      if (!sustainability) {
        sustainability = (product?.sustainability as SustainabilityInput) || null;
      }
    }

    if (!canRecalculateFromSustainability(sustainability)) {
      return NextResponse.json(
        { success: false, message: 'Product is missing weight or materials needed to recalculate' },
        { status: 400 }
      );
    }

    const existing = ((product && product.carbonFootprint) || body.carbonFootprint || null) as
      | { modelVersion?: string }
      | null;
    const alreadyCurrent = isCarbonModelCurrent(existing);
    const carbonFootprint = calculateCarbonFootprint(sustainability as SustainabilityInput);

    let persisted = false;
    let persistError: string | null = null;

    if (persist && productId && (!alreadyCurrent || body.force === true)) {
      try {
        await persistProductCarbonFootprint({
          productId,
          carbonFootprint,
          authHeader,
          sustainability,
        });
        persisted = true;
      } catch (error) {
        persistError = error instanceof Error ? error.message : 'Could not persist footprint';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        productId: productId || null,
        carbonFootprint,
        modelVersion: CARBON_MODEL_VERSION,
        wasStale: !alreadyCurrent,
        persisted,
        persistError,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync carbon footprint';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
