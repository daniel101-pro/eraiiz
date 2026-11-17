import {
  CARBON_MODEL_VERSION,
  calculateCarbonFootprint,
  canRecalculateFromSustainability,
  isCarbonModelCurrent,
  resolveCarbonFootprint,
  type CarbonFootprintResult,
  type SustainabilityInput,
} from '@/lib/carbonFootprint';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export type ProductCarbonSource = {
  _id?: string;
  id?: string;
  carbonFootprint?: CarbonFootprintResult | null;
  sustainability?: SustainabilityInput | null;
};

export function productNeedsCarbonSync(product: ProductCarbonSource | null | undefined) {
  if (!product) return false;
  if (!canRecalculateFromSustainability(product.sustainability)) return false;
  return !isCarbonModelCurrent(product.carbonFootprint);
}

export function applyResolvedCarbon<T extends ProductCarbonSource>(product: T): T & {
  carbonFootprint: CarbonFootprintResult | null;
} {
  const { footprint } = resolveCarbonFootprint(product);
  return {
    ...product,
    carbonFootprint: footprint,
  };
}

export async function persistProductCarbonFootprint(options: {
  productId: string;
  carbonFootprint: CarbonFootprintResult;
  authHeader?: string | null;
  sustainability?: SustainabilityInput | null;
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.authHeader) {
    headers.Authorization = options.authHeader;
  }

  const body: Record<string, unknown> = {
    carbonFootprint: options.carbonFootprint,
    carbonModelVersion: CARBON_MODEL_VERSION,
  };
  if (options.sustainability) {
    body.sustainability = options.sustainability;
  }

  const response = await fetch(`${API_URL}/api/products/${options.productId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to persist carbon footprint (${response.status})`);
  }

  return response.json().catch(() => ({ ok: true }));
}

export function refreshStaleProducts<T extends ProductCarbonSource>(products: T[]) {
  const updated: T[] = [];
  const toPersist: Array<{ product: T; footprint: CarbonFootprintResult }> = [];

  for (const product of products) {
    const { footprint, refreshed } = resolveCarbonFootprint(product);
    const next = {
      ...product,
      carbonFootprint: footprint,
    } as T;
    updated.push(next);
    if (refreshed && footprint) {
      toPersist.push({ product: next, footprint });
    }
  }

  return { products: updated, toPersist };
}
