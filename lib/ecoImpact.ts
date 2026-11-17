import { carKmFromKg, treesFromKg } from '@/lib/carbonFootprint';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';

export type EcoBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: string | null;
};

export type EcoRank = {
  id: string;
  title: string;
  short: string;
  minLevel: number;
  color: string;
  glow: string;
};

export type EcoImpactSummary = {
  totalCarbonSaved: number;
  totalCarbonFootprint: number;
  purchaseCount: number;
  ecoFriendlyPercentage: number;
  impactLevel: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  rank: EcoRank;
  nextRank: EcoRank | null;
  impactMetrics: {
    treesPlanted: number;
    carRidesSaved: number;
    plasticReduced: number;
    wasteAverted: number;
  };
  monthlyData: Array<{
    month: string;
    carbonSaved: number;
    purchases: number;
    sales: number;
  }>;
  categories: Record<string, { carbonSaved: number; count: number }>;
  materials: Record<string, { count: number; carbonSaved: number }>;
  badges: EcoBadge[];
  unlockedBadges: EcoBadge[];
  recentOrders: Array<{
    id: string;
    name: string;
    carbonSaved: number;
    createdAt: string;
  }>;
};

export const ECO_RANKS: EcoRank[] = [
  { id: 'recruit', title: 'Eco Recruit', short: 'Recruit', minLevel: 1, color: '#8B7355', glow: 'rgba(139,115,85,0.45)' },
  { id: 'operator', title: 'Green Operator', short: 'Operator', minLevel: 5, color: '#6B8E23', glow: 'rgba(107,142,35,0.45)' },
  { id: 'specialist', title: 'Impact Specialist', short: 'Specialist', minLevel: 10, color: '#2E8B57', glow: 'rgba(46,139,87,0.5)' },
  { id: 'vanguard', title: 'Climate Vanguard', short: 'Vanguard', minLevel: 15, color: '#1F6FEB', glow: 'rgba(31,111,235,0.55)' },
  { id: 'elite', title: 'Planet Elite', short: 'Elite', minLevel: 20, color: '#7C3AED', glow: 'rgba(124,58,237,0.55)' },
  { id: 'legend', title: 'Earth Legend', short: 'Legend', minLevel: 30, color: '#D97706', glow: 'rgba(217,119,6,0.6)' },
  { id: 'mythic', title: 'Mythic Steward', short: 'Mythic', minLevel: 40, color: '#EC4899', glow: 'rgba(236,72,153,0.65)' },
  { id: 'eternal', title: 'Eternal Guardian', short: 'Eternal', minLevel: 50, color: '#F8FAFC', glow: 'rgba(250,250,250,0.75)' },
];

const XP_PER_LEVEL = 250;

export type ImpactLineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  createdAt: string;
  category?: string;
  materialType?: string;
  carbonTotal?: number;
  carbonSaved?: number;
  productId?: string;
};

function parseSavingsKg(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const text = String(value || '');
  const match = text.match(/([\d.]+)/);
  return match ? Math.max(0, Number(match[1])) : 0;
}

export function estimateLineImpact(item: {
  quantity?: number;
  carbonFootprint?: {
    total?: string | number;
    savingsVsConventional?: string | number | null;
  } | null;
  sustainability?: {
    materials?: Array<{ type?: string; percentage?: number }>;
  } | null;
}) {
  const qty = Math.max(1, Number(item.quantity) || 1);
  const total = Number(item.carbonFootprint?.total);
  const savedDirect = parseSavingsKg(item.carbonFootprint?.savingsVsConventional);
  const materials = item.sustainability?.materials || [];
  const recycledShare =
    materials.reduce((sum, material) => {
      const type = String(material.type || '').toLowerCase();
      if (['recycled', 'organic', 'biodegradable', 'sustainable'].includes(type)) {
        return sum + Math.max(0, Number(material.percentage) || 0);
      }
      return sum;
    }, 0) / 100;

  let carbonSaved = savedDirect;
  if (!carbonSaved && Number.isFinite(total) && total > 0) {
    carbonSaved = total * (0.15 + recycledShare * 0.35);
  }
  if (!carbonSaved) {
    carbonSaved = 0.4 + recycledShare * 1.2;
  }

  const carbonTotal = Number.isFinite(total) && total > 0 ? total : carbonSaved * 1.8;
  const topMaterial =
    materials.sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))[0]?.type ||
    'unknown';

  return {
    carbonSaved: carbonSaved * qty,
    carbonTotal: carbonTotal * qty,
    materialType: String(topMaterial).toLowerCase(),
  };
}

export function xpFromImpact(input: {
  carbonSaved: number;
  purchaseCount: number;
  uniqueCategories: number;
  recycledPurchases: number;
}) {
  return Math.round(
    input.carbonSaved * 120 +
      input.purchaseCount * 40 +
      input.uniqueCategories * 25 +
      input.recycledPurchases * 35
  );
}

export function levelFromXp(xp: number) {
  const safeXp = Math.max(0, xp);
  const level = Math.max(1, Math.floor(safeXp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    xpProgress: Math.min(100, (xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

export function rankForLevel(level: number) {
  let current = ECO_RANKS[0];
  for (const rank of ECO_RANKS) {
    if (level >= rank.minLevel) current = rank;
  }
  const index = ECO_RANKS.findIndex((rank) => rank.id === current.id);
  const nextRank = index >= 0 && index < ECO_RANKS.length - 1 ? ECO_RANKS[index + 1] : null;
  return { rank: current, nextRank };
}

function monthKey(date: Date) {
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export function buildBadges(stats: {
  purchaseCount: number;
  carbonSaved: number;
  recycledPurchases: number;
  uniqueCategories: number;
  lowImpactPurchases: number;
  level: number;
}): EcoBadge[] {
  const defs: Array<Omit<EcoBadge, 'unlocked' | 'progress'> & { target: number; current: number }> = [
    {
      id: 'first_drop',
      name: 'First Drop',
      description: 'Complete your first eco purchase',
      icon: '🎯',
      tier: 'bronze',
      target: 1,
      current: stats.purchaseCount,
    },
    {
      id: 'carbon_scout',
      name: 'Carbon Scout',
      description: 'Save 1 kg CO₂e',
      icon: '🌱',
      tier: 'bronze',
      target: 1,
      current: stats.carbonSaved,
    },
    {
      id: 'trailblazer',
      name: 'Trailblazer',
      description: 'Save 5 kg CO₂e',
      icon: '🧭',
      tier: 'silver',
      target: 5,
      current: stats.carbonSaved,
    },
    {
      id: 'recycle_ranger',
      name: 'Recycle Ranger',
      description: 'Buy 3 recycled-material products',
      icon: '♻️',
      tier: 'silver',
      target: 3,
      current: stats.recycledPurchases,
    },
    {
      id: 'cart_commander',
      name: 'Cart Commander',
      description: 'Complete 5 purchases',
      icon: '🛒',
      tier: 'gold',
      target: 5,
      current: stats.purchaseCount,
    },
    {
      id: 'forest_force',
      name: 'Forest Force',
      description: 'Save 25 kg CO₂e',
      icon: '🌳',
      tier: 'gold',
      target: 25,
      current: stats.carbonSaved,
    },
    {
      id: 'category_hunter',
      name: 'Category Hunter',
      description: 'Shop across 3 categories',
      icon: '🗺️',
      tier: 'platinum',
      target: 3,
      current: stats.uniqueCategories,
    },
    {
      id: 'low_impact_ace',
      name: 'Low-Impact Ace',
      description: 'Buy 5 very low / low impact items',
      icon: '🧊',
      tier: 'platinum',
      target: 5,
      current: stats.lowImpactPurchases,
    },
    {
      id: 'climate_warlord',
      name: 'Climate Warlord',
      description: 'Save 100 kg CO₂e',
      icon: '⚔️',
      tier: 'diamond',
      target: 100,
      current: stats.carbonSaved,
    },
    {
      id: 'level_legend',
      name: 'Ranked Legend',
      description: 'Reach level 30',
      icon: '👑',
      tier: 'legendary',
      target: 30,
      current: stats.level,
    },
    {
      id: 'mythic_saver',
      name: 'Mythic Saver',
      description: 'Save 250 kg CO₂e',
      icon: '💎',
      tier: 'legendary',
      target: 250,
      current: stats.carbonSaved,
    },
    {
      id: 'eternal_operator',
      name: 'Eternal Operator',
      description: 'Reach level 50',
      icon: '🌌',
      tier: 'legendary',
      target: 50,
      current: stats.level,
    },
  ];

  return defs.map((def) => {
    const progress = Math.min(def.current, def.target);
    const unlocked = def.current >= def.target;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      tier: def.tier,
      unlocked,
      progress,
      target: def.target,
      unlockedAt: unlocked ? new Date().toISOString() : null,
    };
  });
}

export function buildEcoImpactSummary(lines: ImpactLineItem[]): EcoImpactSummary {
  const active = lines.filter((line) => line.name);
  const totalCarbonSaved = active.reduce((sum, line) => sum + Number(line.carbonSaved || 0), 0);
  const totalCarbonFootprint = active.reduce((sum, line) => sum + Number(line.carbonTotal || 0), 0);
  const purchaseCount = active.length;

  const categories: Record<string, { carbonSaved: number; count: number }> = {};
  const materials: Record<string, { count: number; carbonSaved: number }> = {};
  const monthMap = new Map<string, { carbonSaved: number; purchases: number; sales: number; order: number }>();

  let recycledPurchases = 0;
  let lowImpactPurchases = 0;

  for (const line of active) {
    const category = line.category || 'General';
    const material = line.materialType || 'unknown';
    categories[category] = categories[category] || { carbonSaved: 0, count: 0 };
    categories[category].carbonSaved += Number(line.carbonSaved || 0);
    categories[category].count += 1;

    materials[material] = materials[material] || { count: 0, carbonSaved: 0 };
    materials[material].count += 1;
    materials[material].carbonSaved += Number(line.carbonSaved || 0);

    if (['recycled', 'organic', 'biodegradable', 'sustainable'].includes(material)) {
      recycledPurchases += 1;
    }
    if (Number(line.carbonTotal || 0) <= 3) lowImpactPurchases += 1;

    const created = new Date(line.createdAt || Date.now());
    const key = monthKey(created);
    const bucket = monthMap.get(key) || {
      carbonSaved: 0,
      purchases: 0,
      sales: 0,
      order: created.getFullYear() * 100 + created.getMonth(),
    };
    bucket.carbonSaved += Number(line.carbonSaved || 0);
    bucket.purchases += 1;
    bucket.sales += Number(line.price || 0);
    monthMap.set(key, bucket);
  }

  const uniqueCategories = Object.keys(categories).length;
  const xp = xpFromImpact({
    carbonSaved: totalCarbonSaved,
    purchaseCount,
    uniqueCategories,
    recycledPurchases,
  });
  const levelInfo = levelFromXp(xp);
  const { rank, nextRank } = rankForLevel(levelInfo.level);
  const badges = buildBadges({
    purchaseCount,
    carbonSaved: totalCarbonSaved,
    recycledPurchases,
    uniqueCategories,
    lowImpactPurchases,
    level: levelInfo.level,
  });

  const monthlyData = [...monthMap.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .slice(-6)
    .map(([month, value]) => ({
      month,
      carbonSaved: Number(value.carbonSaved.toFixed(2)),
      purchases: value.purchases,
      sales: value.sales,
    }));

  const ecoFriendlyPercentage =
    purchaseCount > 0 ? Math.round((recycledPurchases / purchaseCount) * 100) : 0;

  return {
    totalCarbonSaved: Number(totalCarbonSaved.toFixed(2)),
    totalCarbonFootprint: Number(totalCarbonFootprint.toFixed(2)),
    purchaseCount,
    ecoFriendlyPercentage,
    impactLevel: rank.short,
    level: levelInfo.level,
    xp,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    xpProgress: levelInfo.xpProgress,
    rank,
    nextRank,
    impactMetrics: {
      treesPlanted: treesFromKg(totalCarbonSaved),
      carRidesSaved: carKmFromKg(totalCarbonSaved),
      plasticReduced: Number((totalCarbonSaved * 0.35).toFixed(2)),
      wasteAverted: Number((totalCarbonSaved * 0.55).toFixed(2)),
    },
    monthlyData,
    categories,
    materials,
    badges,
    unlockedBadges: badges.filter((badge) => badge.unlocked),
    recentOrders: active.slice(0, 8).map((line) => ({
      id: line.id,
      name: line.name,
      carbonSaved: Number(Number(line.carbonSaved || 0).toFixed(2)),
      createdAt: line.createdAt,
    })),
  };
}
