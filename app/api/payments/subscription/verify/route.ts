import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { isPaystackConfigured, toKobo } from '@/lib/paymentConfig';
import { getSellerPlan, type SellerPlanId } from '@/lib/sellerPlans';
import { getIdentityFromAuthHeader } from '@/lib/sellerPayoutStore';
import {
  findActivePaystackSubscription,
  persistSubscriptionOnBackend,
  saveSellerSubscription,
} from '@/lib/sellerSubscriptionStore';

function parseMetadata(metadata?: Record<string, unknown> | string | null): Record<string, unknown> {
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return metadata || {};
}

function planFromMetadata(data: Record<string, unknown>): SellerPlanId | null {
  if (data.type !== 'seller_plan') return null;
  const planId = data.planId;
  if (planId === 'growth' || planId === 'pro') return planId;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json({ message: 'Paystack is not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const identity = await getIdentityFromAuthHeader(authHeader);
    if (identity.ids.length === 0) {
      return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
    }

    const { reference } = await request.json();
    if (!reference) {
      return NextResponse.json({ message: 'Payment reference is required' }, { status: 400 });
    }

    const transaction = await verifyTransaction(reference);
    if (transaction.status !== 'success') {
      return NextResponse.json({ message: 'Plan payment was not successful' }, { status: 400 });
    }

    const metadata = parseMetadata(transaction.metadata);
    const planId = planFromMetadata(metadata);
    if (!planId) {
      return NextResponse.json({ message: 'Could not determine paid plan' }, { status: 400 });
    }

    if (transaction.amount < toKobo(getSellerPlan(planId).amountNgn)) {
      return NextResponse.json({ message: 'Paid amount does not match plan price' }, { status: 400 });
    }

    const paidFor = Array.isArray(metadata.sellerIds) ? metadata.sellerIds.map(String) : [];
    if (!paidFor.some((id) => identity.ids.includes(id))) {
      return NextResponse.json({ message: 'This payment belongs to another account' }, { status: 403 });
    }

    const paystackSub = await findActivePaystackSubscription(
      transaction.customer?.email || identity.email
    );

    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    const record = {
      userId: identity.ids[0],
      planId,
      email: transaction.customer?.email || identity.email,
      subscriptionCode: paystackSub?.subscription_code,
      emailToken: paystackSub?.email_token,
      customerCode: paystackSub?.customer?.customer_code || transaction.customer?.customer_code,
      nextPaymentDate: paystackSub?.next_payment_date || nextPayment.toISOString(),
      reference,
      updatedAt: new Date().toISOString(),
    };

    await saveSellerSubscription(record, identity.ids);

    try {
      await persistSubscriptionOnBackend(authHeader, record);
    } catch (error) {
      console.error('Failed to persist paid plan on backend', error);
    }

    return NextResponse.json({
      success: true,
      planId,
      plan: getSellerPlan(planId),
      nextPaymentDate: record.nextPaymentDate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify plan payment';
    return NextResponse.json({ message }, { status: 400 });
  }
}
