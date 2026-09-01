import { planRankScore } from '@/lib/planBenefits';

export function extractSellerId(product) {
  const seller = product?.sellerId ?? product?.seller ?? product?.userId;
  if (!seller) return '';
  if (typeof seller === 'object') {
    return String(seller._id || seller.id || '');
  }
  return String(seller);
}

export function applyPlanRanks(products, ranks = {}) {
  if (!Array.isArray(products)) return [];

  return [...products]
    .map((product) => {
      const sellerId = extractSellerId(product);
      const sellerPlan = ranks[sellerId] || 'commission';
      return {
        ...product,
        sellerPlan,
        featured: sellerPlan === 'growth' || sellerPlan === 'pro',
      };
    })
    .sort((a, b) => planRankScore(b.sellerPlan) - planRankScore(a.sellerPlan));
}

export async function boostProductsByPlan(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return products || [];
  }

  try {
    const response = await fetch('/api/payments/plans/ranks', { cache: 'no-store' });
    const data = await response.json();
    return applyPlanRanks(products, data.ranks || {});
  } catch (error) {
    console.error('Failed to apply plan ranking', error);
    return products;
  }
}
