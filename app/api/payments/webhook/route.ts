import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/paystack';
import { getSellerPlan, type SellerPlanId } from '@/lib/sellerPlans';
import { saveSellerSubscription } from '@/lib/sellerSubscriptionStore';

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
      const planId = planFromMetadata(transaction.metadata);
      const sellerIds = Array.isArray(transaction.metadata?.sellerIds)
        ? transaction.metadata.sellerIds.map((id) => String(id))
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
