import { normalizeCurrencyCode } from '@/lib/productCurrency';
import {
  countryFromHeaders,
  currencyFromCountry,
  PAYOUT_COUNTRIES,
} from '@/lib/geoLocation';

function countryCodeFromName(value?: string | null) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  if (/^[a-z]{2}$/i.test(text)) return text.toUpperCase();
  const match = PAYOUT_COUNTRIES.find((country) => country.name.toLowerCase() === text);
  if (match) return match.code;
  if (text.includes('united kingdom') || text === 'uk' || text === 'england' || text === 'scotland' || text === 'wales') {
    return 'GB';
  }
  if (text.includes('united states') || text === 'usa' || text === 'america') return 'US';
  return '';
}

/**
 * Stripe checkout should never charge in NGN (Paystack covers Nigeria).
 * Prefer the shopper's selected currency, then billing/geo country.
 */
export function resolveStripeChargeCurrency(input: {
  preferredCurrency?: string | null;
  billingCountry?: string | null;
  request?: Request | null;
}) {
  const preferred = normalizeCurrencyCode(input.preferredCurrency);
  if (preferred && preferred !== 'NGN') return preferred;

  const billingCode = countryCodeFromName(input.billingCountry);
  const fromBilling = currencyFromCountry(billingCode);
  if (fromBilling && fromBilling !== 'NGN') return fromBilling;

  const geoCode = input.request ? countryFromHeaders(input.request.headers) : '';
  const fromGeo = currencyFromCountry(geoCode);
  if (fromGeo && fromGeo !== 'NGN') return fromGeo;

  return 'USD';
}
