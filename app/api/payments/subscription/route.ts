import { NextRequest, NextResponse } from 'next/server';
import { ensurePlan, initializeTransaction } from '@/lib/paystack';
import {
  generateReference,
  isPaystackConfigured,
  paystackPublicKey,
  toKobo,
} from '@/lib/paymentConfig';
import { getSellerPlan, SELLER_PLANS } from '@/lib/sellerPlans';
import { getIdentityFromAuthHeader } from '@/lib/sellerPayoutStore';
import {
  cancelSellerSubscription,
  persistSubscriptionOnBackend,
  resolveSellerSubscription,
  saveSellerSubscription,
} from '@/lib/sellerSubscriptionStore';

function requireIdentity(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const identity = getIdentityFromAuthHeader(authHeader);
  if (identity.ids.length === 0) return null;
  return { authHeader, identity };
}

export async function GET(request: NextRequest) {
  try {
    const session = requireIdentity(request);
    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const subscription = await resolveSellerSubscription(session);
    const plan = getSellerPlan(subscription.planId);

    return NextResponse.json({
      planId: plan.id,
      plan,
      plans: SELLER_PLANS,
      nextPaymentDate: subscription.nextPaymentDate || null,
      subscriptionCode: subscription.subscriptionCode || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load billing plan';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json({ message: 'Paystack is not configured' }, { status: 503 });
    }

    const session = requireIdentity(request);
    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const plan = getSellerPlan(body.planId);

    if (plan.id === 'commission' || plan.amountNgn <= 0) {
      return NextResponse.json(
        { message: 'This plan does not require payment' },
        { status: 400 }
      );
    }

    const current = await resolveSellerSubscription(session);
    const email = body.email || session.identity.email;
    if (!email) {
      return NextResponse.json({ message: 'A billing email is required' }, { status: 400 });
    }

    if (current.planId === plan.id) {
      return NextResponse.json({
        message: 'You are already on this plan',
        planId: current.planId,
      });
    }

    const paystackPlan = await ensurePlan(
      plan.paystackPlanName || plan.name,
      toKobo(plan.amountNgn)
    );

    const reference = generateReference('ERZPLAN');
    const initialized = await initializeTransaction({
      email,
      amountKobo: toKobo(plan.amountNgn),
      reference,
      callbackUrl: `${request.nextUrl.origin}/account?billing=success&plan=${plan.id}`,
      plan: paystackPlan.plan_code,
      metadata: {
        type: 'seller_plan',
        planId: plan.id,
        sellerIds: session.identity.ids,
        email,
      },
    });

    return NextResponse.json({
      publicKey: paystackPublicKey,
      reference: initialized.reference,
      accessCode: initialized.access_code,
      authorizationUrl: initialized.authorization_url,
      amount: plan.amountNgn,
      amountKobo: toKobo(plan.amountNgn),
      email,
      planId: plan.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start plan checkout';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireIdentity(request);
    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const current = await resolveSellerSubscription(session);
    const cancelled = await cancelSellerSubscription(current);
    await saveSellerSubscription(cancelled, session.identity.ids);

    try {
      await persistSubscriptionOnBackend(session.authHeader, cancelled);
    } catch (error) {
      console.error('Failed to persist cancelled plan on backend', error);
    }

    return NextResponse.json({
      planId: 'commission',
      plan: getSellerPlan('commission'),
      message: 'Switched to Pay-as-you-sell',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel plan';
    return NextResponse.json({ message }, { status: 400 });
  }
}
