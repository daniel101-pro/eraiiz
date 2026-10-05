const FX_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

const FALLBACK_RATES = {
  USD: 1,
  NGN: 1600,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 150,
  CHF: 0.88,
  CAD: 1.36,
  AUD: 1.52,
  CNY: 7.2,
  INR: 83,
};

export async function fetchUsdRates() {
  try {
    const response = await fetch(FX_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('FX request failed');
    const data = await response.json();
    return data.rates || FALLBACK_RATES;
  } catch (error) {
    console.error('Failed to fetch exchange rates', error);
    return FALLBACK_RATES;
  }
}

export function convertWithRates(amount, fromCurrency, toCurrency, rates) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return 0;

  const from = String(fromCurrency || 'NGN').toUpperCase();
  const to = String(toCurrency || 'NGN').toUpperCase();
  if (from === to) return Math.round(numeric * 100) / 100;

  if (!rates?.[from] || !rates?.[to]) return numeric;

  const usd = from === 'USD' ? numeric : numeric / rates[from];
  const converted = to === 'USD' ? usd : usd * rates[to];
  return Math.round(converted * 100) / 100;
}

export async function convertToNgn(amount, fromCurrency) {
  if (!fromCurrency || fromCurrency === 'NGN') {
    return Math.round(Number(amount) * 100) / 100;
  }
  const rates = await fetchUsdRates();
  return convertWithRates(amount, fromCurrency, 'NGN', rates);
}
