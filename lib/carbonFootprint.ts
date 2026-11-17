/**
 * Eraiiz product carbon estimate (kg CO₂e).
 *
 * Scope: cradle-to-buyer estimate for marketplace listings — materials,
 * production energy, freight, and packaging. Not a full ISO 14067 LCA.
 *
 * Factors are simplified industry averages (DEFRA / EPA / GHG Protocol
 * freight order-of-magnitude), tuned so recycled / organic / renewable /
 * local shipping clearly score better than virgin + fossil + air freight.
 */

export type MaterialType = 'conventional' | 'recycled' | 'organic' | 'biodegradable' | 'unknown';
export type EnergySource = 'renewable' | 'fossil_fuel' | 'mixed' | 'grid' | 'unknown';
export type ShippingMethod = 'road' | 'rail' | 'sea' | 'air' | 'local';
export type PackagingType = 'none' | 'minimal' | 'recycled' | 'biodegradable' | 'cardboard' | 'plastic';

export type SustainabilityInput = {
  materials?: Array<{ name?: string; type?: string; percentage?: number }>;
  weight?: { value?: number; unit?: string };
  productionEnergySource?: string;
  manufacturingLocation?: { country?: string; city?: string };
  shipping?: {
    method?: string;
    distance?: number;
    packagingType?: string;
    origin?: { country?: string; city?: string };
  };
};

export type CarbonBreakdown = {
  materials: string;
  production: string;
  shipping: string;
  packaging: string;
};

export type CarbonFootprintResult = {
  total: string;
  breakdown: CarbonBreakdown;
  impactScore: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  equivalentCarRide: string;
  treesToOffset: string;
  savingsVsConventional: string | null;
};

/** kg CO₂e per kg of product attributed to material type */
const MATERIAL_KG_PER_KG: Record<string, number> = {
  conventional: 2.5,
  recycled: 1.0,
  organic: 0.5,
  biodegradable: 1.2,
  unknown: 2.5,
};

/** kg CO₂e per kg of product for production energy */
const PRODUCTION_KG_PER_KG: Record<string, number> = {
  renewable: 0.3,
  fossil_fuel: 1.5,
  mixed: 0.9,
  grid: 1.0,
  unknown: 0.8,
};

/** kg CO₂e per (kg product × km) — freight intensity */
const SHIPPING_KG_PER_KG_KM: Record<string, number> = {
  road: 0.0002,
  local: 0.0001,
  rail: 0.00005,
  sea: 0.00004,
  air: 0.0008,
};

/** kg CO₂e per kg of product for packaging */
const PACKAGING_KG_PER_KG: Record<string, number> = {
  none: 0,
  minimal: 0.05,
  recycled: 0.1,
  biodegradable: 0.2,
  cardboard: 0.3,
  plastic: 0.5,
};

/** Average passenger car ≈ 0.192 kg CO₂e / km (DEFRA / EPA mid-range) */
export const CAR_KG_CO2E_PER_KM = 0.192;

/** Mature tree ≈ 21 kg CO₂ sequestered per year (common public estimate) */
export const TREE_KG_CO2E_PER_YEAR = 21;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function format2(value: number) {
  return round2(value).toFixed(2);
}

export function weightToKg(value = 0, unit = 'kg') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  switch (String(unit || 'kg').toLowerCase()) {
    case 'g':
      return amount / 1000;
    case 'lb':
    case 'lbs':
      return amount * 0.45359237;
    case 'oz':
      return amount * 0.0283495231;
    default:
      return amount;
  }
}

export function normalizeMaterialPercentages(
  materials: Array<{ name?: string; type?: string; percentage?: number }> = []
) {
  const cleaned = materials
    .map((material) => ({
      name: String(material.name || '').trim(),
      type: String(material.type || 'unknown').toLowerCase(),
      percentage: Math.max(0, Number(material.percentage) || 0),
    }))
    .filter((material) => material.name || material.percentage > 0);

  const total = cleaned.reduce((sum, material) => sum + material.percentage, 0);
  if (total <= 0) return cleaned;
  if (Math.abs(total - 100) < 0.5) return cleaned;

  return cleaned.map((material) => ({
    ...material,
    percentage: (material.percentage / total) * 100,
  }));
}

export function impactScoreForTotal(totalKg: number): CarbonFootprintResult['impactScore'] {
  if (totalKg <= 1) return 'Very Low';
  if (totalKg <= 3) return 'Low';
  if (totalKg <= 6) return 'Medium';
  if (totalKg <= 10) return 'High';
  return 'Very High';
}

export function carKmFromKg(totalKg: number) {
  return round2(totalKg / CAR_KG_CO2E_PER_KM);
}

export function treesFromKg(totalKg: number) {
  return round2(totalKg / TREE_KG_CO2E_PER_YEAR);
}

function materialEmissionsKg(weightKg: number, materials: ReturnType<typeof normalizeMaterialPercentages>) {
  if (!materials.length) {
    return weightKg * MATERIAL_KG_PER_KG.unknown;
  }
  return materials.reduce((sum, material) => {
    const factor = MATERIAL_KG_PER_KG[material.type] ?? MATERIAL_KG_PER_KG.unknown;
    return sum + weightKg * factor * (material.percentage / 100);
  }, 0);
}

export function calculateCarbonFootprint(input: SustainabilityInput): CarbonFootprintResult {
  const weightKg = weightToKg(input.weight?.value, input.weight?.unit);
  if (weightKg <= 0) {
    throw new Error('Please enter a valid product weight');
  }

  const materials = normalizeMaterialPercentages(input.materials);
  if (!materials.length) {
    throw new Error('Please add at least one material');
  }

  const energy = String(input.productionEnergySource || 'unknown').toLowerCase();
  const shippingMethod = String(input.shipping?.method || 'road').toLowerCase();
  const packagingType = String(input.shipping?.packagingType || 'minimal').toLowerCase();
  const distanceKm = Math.max(0, Number(input.shipping?.distance) || 0);

  const materialsKg = materialEmissionsKg(weightKg, materials);
  const productionKg =
    weightKg * (PRODUCTION_KG_PER_KG[energy] ?? PRODUCTION_KG_PER_KG.unknown);
  const shippingKg =
    weightKg * distanceKm * (SHIPPING_KG_PER_KG_KM[shippingMethod] ?? SHIPPING_KG_PER_KG_KM.road);
  const packagingKg =
    weightKg * (PACKAGING_KG_PER_KG[packagingType] ?? PACKAGING_KG_PER_KG.minimal);

  const totalKg = materialsKg + productionKg + shippingKg + packagingKg;

  const conventionalMaterials = materials.map((material) => ({
    ...material,
    type: 'conventional',
  }));
  const conventionalTotal =
    materialEmissionsKg(weightKg, conventionalMaterials) +
    weightKg * PRODUCTION_KG_PER_KG.fossil_fuel +
    weightKg * distanceKm * SHIPPING_KG_PER_KG_KM.road +
    weightKg * PACKAGING_KG_PER_KG.plastic;
  const savingsKg = Math.max(0, conventionalTotal - totalKg);

  const carKm = carKmFromKg(totalKg);
  const trees = treesFromKg(totalKg);

  return {
    total: format2(totalKg),
    breakdown: {
      materials: format2(materialsKg),
      production: format2(productionKg),
      shipping: format2(shippingKg),
      packaging: format2(packagingKg),
    },
    impactScore: impactScoreForTotal(totalKg),
    equivalentCarRide: `${carKm.toFixed(1)} km car ride`,
    treesToOffset: `${trees.toFixed(1)} trees per year`,
    savingsVsConventional:
      savingsKg >= 0.05 ? `${format2(savingsKg)} kg CO₂e saved vs conventional` : null,
  };
}
