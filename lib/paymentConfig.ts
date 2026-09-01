export const PLATFORM_COMMISSION_PERCENT = 10;

export const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';
export const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? '';

export const isPaystackConfigured = Boolean(
  paystackPublicKey && paystackSecretKey
);

export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

export function fromKobo(kobo: number): number {
  return kobo / 100;
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
