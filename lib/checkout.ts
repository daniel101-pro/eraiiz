import axios from 'axios';
import { getProductCurrency, getListingPrice } from '@/lib/productCurrency';
import { convertToNgn } from '@/lib/fxRates';
import { findPaystackSubaccountForSeller, getIdentityFromAuthHeader, getSellerPayout } from '@/lib/sellerPayoutStore';
import { parseSellerMarker, listSubaccounts } from '@/lib/paystack';
import { getSellerSubscription } from '@/lib/sellerSubscriptionStore';
import { platformShareForPlan, sellerShareForPlan } from '@/lib/sellerPlans';
import {
  fromKobo,
  generateReference,
  toKobo,
} from '@/lib/paymentConfig';
import {
  appOrigin,
  createSellerInAppNotification,
} from '@/lib/sellerSaleNotify';
import { addInboxNotification } from '@/lib/orderInboxStore';
import { addSellerOrder } from '@/lib/sellerOrderStore';
import { initialTimeline } from '@/lib/tracking';
import { sendBuyerOrderConfirmedEmail, sendSellerNewOrderEmail } from '@/lib/orderEmails';

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
  email?: string;
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

export async function fetchSellerSubaccount(sellerId: string, authHeader?: string) {
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

    name = (response.data?.name || response.data?.fullName) as string | undefined;
    email = (
      response.data?.email ||
      response.data?.user?.email ||
      response.data?.seller?.email ||
      response.data?.contactEmail ||
      response.data?.primaryContactEmail
    ) as string | undefined;
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
    if (!email && paystackSubaccount) {
      const marker = parseSellerMarker(paystackSubaccount);
      email = marker.email || paystackSubaccount.primary_contact_email;
      name = name || paystackSubaccount.business_name;
    }
  }

  if (!email && paystackSubaccountCode) {
    try {
      const subaccounts = await listSubaccounts();
      const match = subaccounts.find((item) => item.subaccount_code === paystackSubaccountCode);
      if (match) {
        const marker = parseSellerMarker(match);
        email = marker.email || match.primary_contact_email;
        name = name || match.business_name;
      }
    } catch (error) {
      console.error(`Failed to resolve seller email from Paystack for ${sellerId}`, error);
    }
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

    const listingCurrency = getProductCurrency(product) || item.currency || 'NGN';
    const listingPrice = getListingPrice(product);
    const priceNgn = await convertToNgn(listingPrice, listingCurrency);

    if (!Number.isFinite(priceNgn) || priceNgn <= 0) {
      throw new Error(`"${product.name}" does not have a valid price`);
    }

    const lineTotal = priceNgn * (item.quantity || 1);
    pricedItems.push({
      _id: item._id,
      name: product.name,
      price: priceNgn,
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
        email: seller.email,
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
  origin?: string;
}) {
  if (input.authHeader) {
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

  await notifyBuyerOfOrder(input);
  await notifySellersOfOrder(input);
}

export async function notifyBuyerOfOrder(input: {
  items: CheckoutCartItem[];
  billing: CheckoutBilling;
  reference: string;
  authHeader?: string;
}) {
  const names = input.items.map((item) => item.name).filter(Boolean);
  const summary =
    names.length === 1 ? names[0] : names.length > 1 ? `${names.length} items` : 'your order';
  const message = `Your order for ${summary} is confirmed. You can track it from Orders.`;
  const identity = getIdentityFromAuthHeader(input.authHeader);

  try {
    await addInboxNotification(
      [...identity.ids, identity.email, input.billing?.email],
      {
        _id: `inbox_buyer_${input.reference}`,
        type: 'order',
        title: 'Order confirmed',
        message,
        read: false,
        createdAt: new Date().toISOString(),
        link: '/account?section=Orders',
        data: {
          paymentReference: input.reference,
          itemCount: input.items.length,
        },
      }
    );
  } catch (error) {
    console.error('Failed to store buyer inbox notification', error);
  }

  try {
    await sendBuyerOrderConfirmedEmail({
      to: input.billing?.email,
      name: input.billing?.fullName,
      items: input.items,
      reference: input.reference,
    });
  } catch (error) {
    console.error('Failed to email buyer order confirmation', error);
  }

  if (!input.authHeader) return;

  try {
    await axios.post(
      `${API_URL}/api/notifications`,
      {
        type: 'order',
        title: 'Order confirmed',
        message,
        content: message,
        read: false,
        data: {
          paymentReference: input.reference,
          itemCount: input.items.length,
        },
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
    console.error('Failed to create order notification', error);
  }
}

export async function notifySellersOfOrder(input: {
  items: CheckoutCartItem[];
  billing: CheckoutBilling;
  reference: string;
  authHeader?: string;
  origin?: string;
  sellerEmails?: string[];
}) {
  const bySeller = new Map<string, CheckoutCartItem[]>();
  for (const item of input.items) {
    if (!item.sellerId) continue;
    const list = bySeller.get(item.sellerId) || [];
    list.push(item);
    bySeller.set(item.sellerId, list);
  }

  const shippingUrl = `${appOrigin(input.origin)}/account?section=Shipping`;

  for (const [sellerId, items] of bySeller.entries()) {
    const names = items.map((item) => item.name).filter(Boolean);
    const quantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const summary = names.length === 1 ? names[0] : names.join(', ');
    const message = `You sold ${summary}. Open Shipping to fulfill this order.`;

    const seller = await fetchSellerSubaccount(sellerId, input.authHeader);
    const amountNgn = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    );

    try {
      await addSellerOrder([sellerId, seller.email], {
        _id: `sale_${input.reference}_${sellerId}`,
        sellerId,
        reference: input.reference,
        status: 'pending',
        createdAt: new Date().toISOString(),
        buyer: {
          name: input.billing.fullName,
          email: input.billing.email,
          phone: input.billing.phone,
        },
        shippingAddress: {
          fullName: input.billing.fullName,
          address: input.billing.address,
          city: input.billing.city,
          state: input.billing.state,
          postalCode: input.billing.postalCode,
          phone: input.billing.phone,
        },
        items: items.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize,
          price: item.price,
          currency: item.currency,
        })),
        quantity,
        amountNgn,
        timeline: initialTimeline(),
      });
    } catch (error) {
      console.error(`Failed to store seller order for ${sellerId}`, error);
    }

    if (input.authHeader) {
      try {
        await axios.post(
          `${API_URL}/api/shipping/shipments`,
          {
            sellerId,
            paymentReference: input.reference,
            status: 'pending',
            items: items.map((item) => ({
              productId: item._id,
              name: item.name,
              quantity: item.quantity || 1,
            })),
            destination: input.billing,
          },
          {
            headers: {
              Authorization: input.authHeader,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
      } catch (error) {
        console.error(`Failed to create backend shipment for ${sellerId}`, error);
      }
    }

    try {
      await addInboxNotification([sellerId, seller.email], {
        _id: `inbox_seller_${input.reference}_${sellerId}`,
        type: 'order',
        title: 'New order',
        message,
        read: false,
        createdAt: new Date().toISOString(),
        link: '/account?section=Shipping',
        data: {
          paymentReference: input.reference,
        },
      });
    } catch (error) {
      console.error(`Failed to store seller inbox notification for ${sellerId}`, error);
    }

    await createSellerInAppNotification({
      sellerId,
      message,
      reference: input.reference,
      shippingUrl,
      authHeader: input.authHeader,
    });

    const sellerEmail =
      seller.email ||
      (bySeller.size === 1 ? input.sellerEmails?.find((value) => value.includes('@')) : undefined);

    if (!sellerEmail) {
      console.error(`No email found for seller ${sellerId}; new-order mail was not sent`);
      continue;
    }

    try {
      await sendSellerNewOrderEmail({
        to: sellerEmail,
        sellerName: seller.name,
        items,
        billing: input.billing,
        reference: input.reference,
        origin: input.origin,
      });
    } catch (error) {
      console.error(`Failed to email seller ${sellerId}`, error);
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
