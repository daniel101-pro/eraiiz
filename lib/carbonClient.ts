'use client';

import {
  CARBON_MODEL_VERSION,
  resolveCarbonFootprint,
  type CarbonFootprintResult,
  type SustainabilityInput,
} from '@/lib/carbonFootprint';

export function withCurrentCarbonModel<T extends {
  _id?: string;
  id?: string;
  carbonFootprint?: CarbonFootprintResult | null;
  sustainability?: SustainabilityInput | null;
}>(product: T): T & { carbonFootprint: CarbonFootprintResult | null } {
  const { footprint } = resolveCarbonFootprint(product);
  return {
    ...product,
    carbonFootprint: footprint,
  };
}

/**
 * Recalculate against the current model and, when possible, write the new
 * snapshot back to the product record so catalogs stay in sync after upgrades.
 */
export async function syncProductCarbonModel(options: {
  productId: string;
  sustainability?: SustainabilityInput | null;
  authToken?: string | null;
  force?: boolean;
}): Promise<CarbonFootprintResult | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.authToken) {
      headers.Authorization = `Bearer ${options.authToken}`;
    }

    const response = await fetch('/api/carbon-footprint/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: options.productId,
        sustainability: options.sustainability || undefined,
        persist: true,
        force: options.force === true,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) return null;
    return (data.data?.carbonFootprint as CarbonFootprintResult) || null;
  } catch {
    return null;
  }
}

export { CARBON_MODEL_VERSION };