import { normalizeCurrencyCode } from '@/lib/productCurrency';

export type PayoutProvider = 'paystack' | 'stripe';

export type GeoCountry = {
  code: string;
  name: string;
};

const AFRICAN_COUNTRY_CODES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD',
  'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE',
  'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG',
  'ZM', 'ZW', 'EH',
]);

const EURO_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'HR', 'AD', 'MC', 'ME', 'XK',
]);

const COUNTRY_CURRENCY: Record<string, string> = {
  NG: 'NGN',
  GB: 'GBP',
  UK: 'GBP',
  US: 'USD',
  PR: 'USD',
  GU: 'USD',
  VI: 'USD',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'AUD',
  JP: 'JPY',
  CH: 'CHF',
  LI: 'CHF',
  CN: 'CNY',
  HK: 'CNY',
  TW: 'CNY',
  IN: 'INR',
  IE: 'EUR',
};

export const PAYOUT_COUNTRIES: GeoCountry[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'AO', name: 'Angola' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const EXTRA_AFRICAN: GeoCountry[] = [
  { code: 'BJ', name: 'Benin' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'DR Congo' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'SD', name: 'Sudan' },
  { code: 'TG', name: 'Togo' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

export const ALL_PAYOUT_COUNTRIES: GeoCountry[] = [...PAYOUT_COUNTRIES, ...EXTRA_AFRICAN]
  .filter((country, index, list) => list.findIndex((item) => item.code === country.code) === index)
  .sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_NAME_BY_CODE = Object.fromEntries(
  ALL_PAYOUT_COUNTRIES.map((country) => [country.code, country.name])
);

export function isAfricanCountry(countryCode?: string | null) {
  return AFRICAN_COUNTRY_CODES.has(String(countryCode || '').trim().toUpperCase());
}

export function payoutProviderForCountry(countryCode?: string | null): PayoutProvider {
  return isAfricanCountry(countryCode) ? 'paystack' : 'stripe';
}

export function countryName(countryCode?: string | null) {
  const code = String(countryCode || '').trim().toUpperCase();
  if (code === 'UK') return 'United Kingdom';
  return COUNTRY_NAME_BY_CODE[code] || code || '';
}

export function currencyFromCountry(countryCode?: string | null) {
  const code = String(countryCode || '').trim().toUpperCase();
  if (!code) return 'USD';
  if (COUNTRY_CURRENCY[code]) return COUNTRY_CURRENCY[code];
  if (EURO_COUNTRIES.has(code)) return 'EUR';
  if (code === 'NG') return 'NGN';
  return 'USD';
}

export function currencyFromLocale(locale?: string | null) {
  const value = String(locale || '').toLowerCase();
  if (value.includes('-gb') || value.endsWith('_gb') || value === 'en-uk') return 'GBP';
  if (value.includes('-ng')) return 'NGN';
  if (value.includes('-us')) return 'USD';
  if (value.includes('-ca')) return 'CAD';
  if (value.includes('-au')) return 'AUD';
  if (value.includes('-in')) return 'INR';
  if (value.includes('-jp')) return 'JPY';
  if (value.includes('-ch')) return 'CHF';
  if (value.includes('-cn')) return 'CNY';
  if (value.startsWith('fr') || value.startsWith('de') || value.startsWith('es') || value.startsWith('it') || value.startsWith('nl') || value.startsWith('pt')) {
    return 'EUR';
  }
  const region = value.split('-')[1] || value.split('_')[1];
  if (region) return currencyFromCountry(region);
  return null;
}

export function countryFromHeaders(headers: Headers) {
  const raw =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code') ||
    headers.get('cloudfront-viewer-country') ||
    '';
  const code = raw.trim().toUpperCase();
  if (!code || code === 'XX' || code === 'T1') return '';
  return code === 'UK' ? 'GB' : code;
}

export function paystackBankQuery(countryCode?: string | null) {
  const code = String(countryCode || 'NG').trim().toUpperCase();
  const map: Record<string, { country: string; currency: string }> = {
    NG: { country: 'nigeria', currency: 'NGN' },
    GH: { country: 'ghana', currency: 'GHS' },
    KE: { country: 'kenya', currency: 'KES' },
    ZA: { country: 'south africa', currency: 'ZAR' },
    CI: { country: "cote d'ivoire", currency: 'XOF' },
  };
  return map[code] || map.NG;
}

export function parseGeoCookie(raw?: string | null) {
  const value = String(raw || '');
  const [country, currency] = value.split(':');
  const countryCode = String(country || '').trim().toUpperCase();
  const currencyCode = normalizeCurrencyCode(currency) || currencyFromCountry(countryCode);
  if (!countryCode && !currencyCode) return null;
  return {
    country: countryCode === 'UK' ? 'GB' : countryCode,
    currency: currencyCode,
  };
}
