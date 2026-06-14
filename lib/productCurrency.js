export const SUPPORTED_CURRENCIES = [
  'NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR',
];

export function normalizeCurrencyCode(code) {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper) ? upper : null;
}

/** Resolve the seller's listing currency from product API data. */
export function getProductCurrency(product) {
  if (!product) return 'NGN';

  const direct = normalizeCurrencyCode(product.currency);
  if (direct) return direct;

  const fromSustainability = normalizeCurrencyCode(
    product.sustainability?.listingCurrency ?? product.sustainability?.currency
  );
  if (fromSustainability) return fromSustainability;

  return 'NGN';
}

const currencyCache = new Map();

export function getCachedProductCurrency(productId) {
  return currencyCache.get(productId) ?? null;
}

export function setCachedProductCurrency(productId, currency) {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized && productId) {
    currencyCache.set(productId, normalized);
  }
}

function mergeProductCurrency(product, currency) {
  return { ...product, currency: normalizeCurrencyCode(currency) || 'NGN' };
}

function hasKnownListingCurrency(product) {
  return Boolean(
    normalizeCurrencyCode(product?.currency) ||
    normalizeCurrencyCode(product?.sustainability?.listingCurrency)
  );
}

/**
 * List endpoints omit `currency`. Fetch it from the public detail endpoint when missing.
 * New uploads store `sustainability.listingCurrency` which the public endpoint returns.
 */
export async function enrichProductsWithCurrency(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return products;

  return Promise.all(
    products.map(async (product) => {
      if (!product?._id) return product;

      if (hasKnownListingCurrency(product)) {
        const currency = getProductCurrency(product);
        setCachedProductCurrency(product._id, currency);
        return mergeProductCurrency(product, currency);
      }

      const cached = getCachedProductCurrency(product._id);
      if (cached) {
        return mergeProductCurrency(product, cached);
      }

      try {
        const res = await fetch(`${apiUrl}/api/products/${product._id}/public`, {
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const data = await res.json();
          const currency = getProductCurrency(data);
          setCachedProductCurrency(product._id, currency);
          return mergeProductCurrency(product, currency);
        }
      } catch (error) {
        console.error(`Failed to fetch currency for product ${product._id}:`, error);
      }

      return mergeProductCurrency(product, 'NGN');
    })
  );
}
