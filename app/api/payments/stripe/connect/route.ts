import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { isStripeConfigured } from '@/lib/paymentConfig';
import {
  createStripeAccountLink,
  createStripeConnectAccount,
  retrieveStripeAccount,
} from '@/lib/stripeConnect';
import {
  getIdentityFromAuthHeader,
  getSellerPayoutByIds,
  saveSellerPayout,
  type SellerPayoutRecord,
} from '@/lib/sellerPayoutStore';
import { payoutProviderForCountry } from '@/lib/geoLocation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

async function persistStripePayout(authHeader: string, payout: SellerPayoutRecord) {
  try {
    await axios.patch(
      `${API_URL}/api/users/me`,
      {
        stripeAccountId: payout.stripeAccountId,
        payoutCountry: payout.country,
        payoutProvider: 'stripe',
        stripeDetailsSubmitted: payout.stripeDetailsSubmitted,
        stripePayoutsEnabled: payout.stripePayoutsEnabled,
        sellerPayout: {
          stripeAccountId: payout.stripeAccountId,
          payoutCountry: payout.country,
          payoutProvider: 'stripe',
          stripeDetailsSubmitted: payout.stripeDetailsSubmitted,
          stripePayoutsEnabled: payout.stripePayoutsEnabled,
        },
      },
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    console.error('Failed to persist Stripe payout on backend', error);
  }
}

function originFrom(request: NextRequest) {
  return request.nextUrl.origin;
}

function payoutPayload(payout: SellerPayoutRecord | null) {
  if (!payout) {
    return {
      provider: null,
      country: null,
      stripeAccountId: null,
      stripeDetailsSubmitted: false,
      stripePayoutsEnabled: false,
      connected: false,
    };
  }
  return {
    provider: payout.provider || (payout.stripeAccountId ? 'stripe' : 'paystack'),
    country: payout.country || null,
    stripeAccountId: payout.stripeAccountId || null,
    stripeDetailsSubmitted: Boolean(payout.stripeDetailsSubmitted),
    stripePayoutsEnabled: Boolean(payout.stripePayoutsEnabled),
    connected: Boolean(payout.stripeAccountId && payout.stripeDetailsSubmitted),
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const identity = getIdentityFromAuthHeader(authHeader);
  if (identity.ids.length === 0) {
    return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
  }

  const payout = await getSellerPayoutByIds(identity.ids);
  if (!payout?.stripeAccountId || !isStripeConfigured) {
    return NextResponse.json(payoutPayload(payout));
  }

  try {
    const account = await retrieveStripeAccount(payout.stripeAccountId);
    const updated: SellerPayoutRecord = {
      ...payout,
      provider: 'stripe',
      country: account.country || payout.country,
      stripeAccountId: account.id,
      stripeDetailsSubmitted: Boolean(account.details_submitted),
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      updatedAt: new Date().toISOString(),
    };
    await saveSellerPayout(updated, identity.ids);
    await persistStripePayout(authHeader, updated);
    return NextResponse.json(payoutPayload(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Stripe payout';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured) {
      return NextResponse.json(
        { message: 'Stripe payouts are not configured yet. Add STRIPE_SECRET_KEY to enable them.' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const identity = getIdentityFromAuthHeader(authHeader);
    if (identity.ids.length === 0) {
      return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const country = String(body.country || '').trim().toUpperCase();
    if (!country || country.length !== 2) {
      return NextResponse.json({ message: 'Choose your country first' }, { status: 400 });
    }
    if (payoutProviderForCountry(country) !== 'stripe') {
      return NextResponse.json(
        { message: 'African countries use Paystack for payouts' },
        { status: 400 }
      );
    }

    const existing = await getSellerPayoutByIds(identity.ids);
    let accountId = existing?.stripeAccountId;
    if (!accountId) {
      const account = await createStripeConnectAccount({
        country,
        email: identity.email,
        sellerId: identity.ids[0],
      });
      accountId = account.id;
      const created: SellerPayoutRecord = {
        userId: identity.ids[0],
        provider: 'stripe',
        country,
        accountName: identity.name || identity.email || 'Seller',
        businessName: identity.name || 'Eraiiz seller',
        stripeAccountId: accountId,
        stripeDetailsSubmitted: Boolean(account.details_submitted),
        stripePayoutsEnabled: Boolean(account.payouts_enabled),
        updatedAt: new Date().toISOString(),
      };
      await saveSellerPayout(created, identity.ids);
      await persistStripePayout(authHeader, created);
    }

    const origin = originFrom(request);
    const link = await createStripeAccountLink({
      accountId,
      refreshUrl: `${origin}/account?section=Billing&stripe=refresh`,
      returnUrl: `${origin}/account?section=Billing&stripe=return`,
    });

    return NextResponse.json({ url: link.url, stripeAccountId: accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start Stripe payout setup';
    return NextResponse.json({ message }, { status: 500 });
  }
}
