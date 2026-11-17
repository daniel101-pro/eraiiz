export const PLATFORM_COMMISSION_PERCENT = 10;

export const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';
export const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? '';

export const isPaystackConfigured = Boolean(
  paystackPublicKey && paystackSecretKey
);

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? '';
export const isStripeConfigured = Boolean(stripeSecretKey);

export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/** Stripe zero-decimal currencies (amount is already in the major unit). */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export function toMinorUnits(amount: number, currency: string): number {
  const code = String(currency || 'USD').toUpperCase();
  if (ZERO_DECIMAL.has(code)) return Math.round(Number(amount) || 0);
  return Math.round((Number(amount) || 0) * 100);
}

export function fromMinorUnits(minor: number, currency: string): number {
  const code = String(currency || 'USD').toUpperCase();
  if (ZERO_DECIMAL.has(code)) return Number(minor) || 0;
  return (Number(minor) || 0) / 100;
}

export function generateReference(prefix = 'ERZ'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sellerShareAmount(subtotal: number): number {
  const commission = (subtotal * PLATFORM_COMMISSION_PERCENT) / 100;
  return Math.round(subtotal - commission);
}

export function platformCommissionAmount(subtotal: number): number {
  return Math.round((subtotal * PLATFORM_COMMISSION_PERCENT) / 100);
}
