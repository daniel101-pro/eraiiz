export const SUPPORTED_CURRENCIES = [
  'NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR',
];

export function normalizeCurrencyCode(code) {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper) ? upper : null;
}

/** Seller-entered amount in the listing currency, if available. */
export function getListingPrice(product) {
  const listed = Number(product?.sustainability?.listingPrice ?? product?.listingPrice);
  const listingCurrency = normalizeCurrencyCode(
    product?.sustainability?.listingCurrency ?? product?.listingCurrency
  );
  if (listingCurrency && Number.isFinite(listed) && listed > 0) return listed;

  return Number(product?.price) || 0;
}

export function getPricedListing(product) {
  return {
    amount: getListingPrice(product),
    currency: getProductCurrency(product),
  };
}

export function getProductCurrency(product) {
  if (!product) return 'NGN';

  const fromSustainability = normalizeCurrencyCode(
    product.sustainability?.listingCurrency ?? product.sustainability?.currency
  );
  const listed = Number(product?.sustainability?.listingPrice ?? product?.listingPrice);
  if (fromSustainability && Number.isFinite(listed) && listed > 0) {
    return fromSustainability;
  }

  const direct = normalizeCurrencyCode(product.currency);
  if (direct && direct !== 'NGN') return direct;
  if (fromSustainability) return fromSustainability;
  if (direct) return direct;

  return 'NGN';
}

const currencyCache = new Map();

export function getCachedProductCurrency(productId) {
  return currencyCache.get(productId)?.currency ?? null;
}

export function setCachedProductCurrency(productId, currency, listingPrice) {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized && productId) {
    const amount = Number(listingPrice);
    currencyCache.set(productId, {
      currency: normalized,
      listingPrice: Number.isFinite(amount) && amount > 0 ? amount : undefined,
    });
  }
}

function mergeProductCurrency(product, currency, listingPrice) {
  const normalized = normalizeCurrencyCode(currency) || 'NGN';
  const amount = Number(listingPrice);
  const hasListingPrice = Number.isFinite(amount) && amount > 0;

  return {
    ...product,
    currency: normalized,
    ...(hasListingPrice ? { listingPrice: amount } : {}),
    sustainability: {
      ...(product.sustainability || {}),
      listingCurrency: normalized,
      ...(hasListingPrice ? { listingPrice: amount } : {}),
    },
  };
}

function hasCompleteListing(product) {
  const knownCurrency =
    normalizeCurrencyCode(product?.currency) ||
    normalizeCurrencyCode(product?.sustainability?.listingCurrency);
  const listed = Number(product?.sustainability?.listingPrice ?? product?.listingPrice);
  const hasListingPrice = Number.isFinite(listed) && listed > 0;

  if (knownCurrency && hasListingPrice) return true;
  if (knownCurrency === 'NGN') return true;
  return false;
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

/**
 * List endpoints omit `currency`. Fetch it from the public detail endpoint when missing.
 * Bounded concurrency + hard timeout so shop pages never hang for visitors.
 */
export async function enrichProductsWithCurrency(products, options = {}) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return products;

  const concurrency = Number(options.concurrency) > 0 ? Number(options.concurrency) : 6;
  const budgetMs = Number(options.budgetMs) > 0 ? Number(options.budgetMs) : 8000;
  const deadline = Date.now() + budgetMs;

  return mapPool(products, concurrency, async (product) => {
    if (!product?._id) return product;

    if (hasCompleteListing(product)) {
      const currency = getProductCurrency(product);
      setCachedProductCurrency(product._id, currency, getListingPrice(product));
      return mergeProductCurrency(product, currency, getListingPrice(product));
    }

    const cached = currencyCache.get(product._id);
    if (cached?.currency) {
      return mergeProductCurrency(product, cached.currency, cached.listingPrice);
    }

    // Out of time budget: show product with safe defaults instead of blocking the page
    if (Date.now() > deadline) {
      return mergeProductCurrency(product, 'NGN');
    }

    try {
      const res = await fetch(`${apiUrl}/api/products/${product._id}/public`, {
        signal: AbortSignal.timeout(Math.max(1500, Math.min(5000, deadline - Date.now()))),
      });
      if (res.ok) {
        const data = await res.json();
        const detailed = {
          ...product,
          sustainability: {
            ...(product.sustainability || {}),
            ...(data.sustainability || {}),
          },
          listingPrice: data.listingPrice ?? product.listingPrice,
          currency: data.currency ?? product.currency,
          sellerId: product.sellerId || data.sellerId,
        };
        const currency = getProductCurrency(detailed);
        const listingPrice = getListingPrice(detailed);
        setCachedProductCurrency(product._id, currency, listingPrice);
        return mergeProductCurrency(detailed, currency, listingPrice);
      }
    } catch (error) {
      console.error(`Failed to fetch currency for product ${product._id}:`, error);
    }

    return mergeProductCurrency(product, 'NGN');
  });
}
