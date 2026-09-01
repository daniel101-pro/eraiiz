import axios from 'axios';
import { getProductCurrency } from '@/lib/productCurrency';
import { getSellerPayout, findPaystackSubaccountForSeller } from '@/lib/sellerPayoutStore';
import { getSellerSubscription } from '@/lib/sellerSubscriptionStore';
import { platformShareForPlan, sellerShareForPlan } from '@/lib/sellerPlans';
import {
  fromKobo,
  generateReference,
  toKobo,
} from '@/lib/paymentConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

export interface CheckoutCartItem {
  _id: string;
  name: string;
  price: number;
  currency?: string;
  quantity: number;
  selectedSize: string;
  sellerId?: string;
}

export interface CheckoutBilling {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface SellerSplit {
  sellerId: string;
  subaccountCode: string;
  subtotal: number;
  sellerShare: number;
  platformShare: number;
}

export interface ValidatedCheckout {
  reference: string;
  email: string;
  amountKobo: number;
  amountNgn: number;
  items: CheckoutCartItem[];
  billing: CheckoutBilling;
  sellerSplits: SellerSplit[];
  splitSubaccounts: { subaccount: string; share: number }[];
  subaccount?: string;
}

async function fetchProduct(productId: string) {
  const response = await axios.get(`${API_URL}/api/products/${productId}/public`, {
    timeout: 15000,
  });
  return response.data;
}

async function fetchSellerSubaccount(sellerId: string, authHeader?: string) {
  const headers: Record<string, string> = {};
  if (authHeader) headers.Authorization = authHeader;

  let paystackSubaccountCode: string | undefined;
  let name: string | undefined;
  let email: string | undefined;

  try {
    const response = await axios.get(`${API_URL}/api/users/seller/${sellerId}`, {
      headers,
      timeout: 15000,
    });

    name = response.data?.name as string | undefined;
    email = response.data?.email as string | undefined;
    paystackSubaccountCode = response.data?.paystackSubaccountCode as string | undefined;

    const nested = response.data?.sellerPayout as { paystackSubaccountCode?: string } | undefined;
    paystackSubaccountCode =
      paystackSubaccountCode || nested?.paystackSubaccountCode;
  } catch (error) {
    console.error(`Failed to fetch seller profile for ${sellerId}`, error);
  }

  if (!paystackSubaccountCode) {
    const localPayout = await getSellerPayout(sellerId);
    paystackSubaccountCode = localPayout?.subaccountCode;
  }

  if (!paystackSubaccountCode) {
    const paystackSubaccount = await findPaystackSubaccountForSeller({
      ids: [sellerId],
      email,
    });
    paystackSubaccountCode = paystackSubaccount?.subaccount_code;
  }

  return {
    sellerId,
    name,
    email,
    paystackSubaccountCode,
  };
}

export async function validateCheckoutInput(input: {
  items: CheckoutCartItem[];
  billing: CheckoutBilling;
  authHeader?: string;
}): Promise<ValidatedCheckout> {
  const { items, billing, authHeader } = input;

  if (!items?.length) {
    throw new Error('Your cart is empty');
  }

  if (!billing?.email || !billing?.fullName) {
    throw new Error('Billing name and email are required');
  }

  const pricedItems: CheckoutCartItem[] = [];
  const sellerTotals = new Map<string, number>();

  for (const item of items) {
    const product = await fetchProduct(item._id);
    const sellerId =
      typeof product.sellerId === 'object'
        ? product.sellerId?._id || product.sellerId?.id
        : product.sellerId;

    if (!sellerId) {
      throw new Error(`Product "${product.name}" has no assigned seller`);
    }

    const currency = getProductCurrency(product) || item.currency || 'NGN';
    if (currency !== 'NGN') {
      throw new Error(
        `Paystack checkout currently supports NGN only. "${product.name}" is listed in ${currency}.`
      );
    }

    const lineTotal = Number(product.price) * (item.quantity || 1);
    pricedItems.push({
      _id: item._id,
      name: product.name,
      price: Number(product.price),
      currency: 'NGN',
      quantity: item.quantity || 1,
      selectedSize: item.selectedSize,
      sellerId: String(sellerId),
    });

    sellerTotals.set(String(sellerId), (sellerTotals.get(String(sellerId)) || 0) + lineTotal);
  }

  const uniqueSellerIds = [...sellerTotals.keys()];
  const sellerAccounts = await Promise.all(
    uniqueSellerIds.map((sellerId) => fetchSellerSubaccount(sellerId, authHeader))
  );

  const missingSubaccounts = sellerAccounts.filter((seller) => !seller.paystackSubaccountCode);
  if (missingSubaccounts.length > 0) {
    throw new Error(
      'One or more sellers have not completed payout setup. Please remove those items or try again later.'
    );
  }

  const sellerSplits: SellerSplit[] = await Promise.all(
    sellerAccounts.map(async (seller) => {
      const subtotal = sellerTotals.get(seller.sellerId) || 0;
      const storedPlan = await getSellerSubscription(seller.sellerId);
      const planId = storedPlan?.planId || 'commission';
      const sellerShare = sellerShareForPlan(subtotal, planId);
      const platformShare = platformShareForPlan(subtotal, planId);

      return {
        sellerId: seller.sellerId,
        subaccountCode: seller.paystackSubaccountCode!,
        subtotal,
        sellerShare,
        platformShare,
      };
    })
  );

  const amountNgn = sellerSplits.reduce((sum, split) => sum + split.subtotal, 0);
  const amountKobo = toKobo(amountNgn);

  if (amountKobo < 10000) {
    throw new Error('Minimum Paystack checkout amount is ₦100');
  }

  const splitSubaccounts = sellerSplits.map((split) => ({
    subaccount: split.subaccountCode,
    share: toKobo(split.sellerShare),
  }));

  const splitShareTotal = splitSubaccounts.reduce((sum, entry) => sum + entry.share, 0);
  if (splitShareTotal >= amountKobo) {
    throw new Error('Invalid split configuration for this checkout');
  }

  return {
    reference: generateReference(),
    email: billing.email,
    amountKobo,
    amountNgn,
    items: pricedItems,
    billing,
    sellerSplits,
    splitSubaccounts,
    subaccount: sellerSplits.length === 1 ? sellerSplits[0].subaccountCode : undefined,
  };
}

export async function createBackendOrders(input: {
  items: CheckoutCartItem[];
  billing: CheckoutBilling;
  reference: string;
  amountNgn: number;
  authHeader?: string;
}) {
  if (!input.authHeader) return;

  for (const item of input.items) {
    try {
      await axios.post(
        `${API_URL}/api/orders`,
        {
          productId: item._id,
          product: item.name,
          price: item.price * (item.quantity || 1),
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize,
          sellerId: item.sellerId,
          status: 'Pending',
          paymentReference: input.reference,
          paymentMethod: 'paystack',
          billingAddress: input.billing,
        },
        {
          headers: {
            Authorization: input.authHeader,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } catch (error) {
      console.error('Failed to create backend order for item', item._id, error);
    }
  }
}

export function summarizeVerifiedPayment(transaction: {
  amount: number;
  reference: string;
}) {
  return {
    reference: transaction.reference,
    amountNgn: fromKobo(transaction.amount),
  };
}
