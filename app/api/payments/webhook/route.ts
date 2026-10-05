import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/paystack';
import { getSellerPlan, type SellerPlanId } from '@/lib/sellerPlans';
import { saveSellerSubscription } from '@/lib/sellerSubscriptionStore';
import {
  parsePaystackMetadata,
  sellerOrdersFromPayment,
} from '@/lib/marketplaceOrders';
import { addSellerOrder, type SellerOrder } from '@/lib/sellerOrderStore';
import { notifyBuyerOfOrder, notifySellersOfOrder, type CheckoutCartItem, type CheckoutBilling } from '@/lib/checkout';

function toCartItems(orders: SellerOrder[]): CheckoutCartItem[] {
  return orders.flatMap((order) =>
    (order.items || []).map((item) => ({
      _id: item.productId || '',
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      selectedSize: item.selectedSize || '',
      sellerId: order.sellerId,
      currency: item.currency,
    }))
  );
}

function toBilling(order: SellerOrder, customerEmail?: string): CheckoutBilling {
  return {
    fullName: order.shippingAddress?.fullName || order.buyer?.name || 'Customer',
    email: order.buyer?.email || customerEmail || '',
    phone: order.buyer?.phone || order.shippingAddress?.phone || '',
    address: order.shippingAddress?.address || '',
    city: order.shippingAddress?.city || '',
    state: order.shippingAddress?.state || '',
    postalCode: order.shippingAddress?.postalCode || '',
  };
}

function planFromMetadata(metadata?: Record<string, unknown>): SellerPlanId | null {
  const planId = metadata?.planId;
  if (planId === 'growth' || planId === 'pro' || planId === 'commission') return planId;
  if (metadata?.type === 'seller_plan' && typeof metadata.planId === 'string') {
    return getSellerPlan(metadata.planId).id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;
    const data = event?.data;

    if (eventType === 'charge.success' && data?.reference) {
      const transaction = await verifyTransaction(data.reference);
      const metadata = parsePaystackMetadata(transaction.metadata);
      const planId = planFromMetadata(metadata);
      const sellerIds = Array.isArray(metadata.sellerIds)
        ? metadata.sellerIds.map((id) => String(id))
        : [];
      const sellerEmails = Array.isArray(metadata.sellerEmails)
        ? metadata.sellerEmails.map((email) => String(email))
        : [];

      if (planId && planId !== 'commission' && sellerIds.length > 0) {
        const nextPayment = new Date();
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        await saveSellerSubscription(
          {
            userId: sellerIds[0],
            planId,
            email: transaction.customer?.email,
            customerCode: transaction.customer?.customer_code,
            nextPaymentDate: nextPayment.toISOString(),
            reference: transaction.reference,
            updatedAt: new Date().toISOString(),
          },
          sellerIds
        );
      } else {
        const orders = sellerOrdersFromPayment({
          reference: transaction.reference,
          amountKobo: transaction.amount,
          paidAt: transaction.paid_at,
          metadata,
          customerEmail: transaction.customer?.email,
        });
        for (const order of orders) {
          await addSellerOrder([order.sellerId, ...sellerEmails], order);
        }
        try {
          if (orders.length) {
            const billing = toBilling(orders[0], transaction.customer?.email);
            const items = toCartItems(orders);
            await notifyBuyerOfOrder({
              items,
              billing,
              reference: transaction.reference,
              buyerEmail: billing.email || transaction.customer?.email,
              origin: request.nextUrl.origin,
            });
            await notifySellersOfOrder({
              items,
              billing,
              reference: transaction.reference,
              sellerEmails,
            });
          }
        } catch (error) {
          console.error('Failed to send paid-order emails from webhook', error);
        }
      }
    }

    if (eventType === 'subscription.disable' && data?.customer?.email) {
      // Keep store in sync if Paystack cancels a subscription.
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
