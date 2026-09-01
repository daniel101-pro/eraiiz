import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {
  createSubaccount,
  resolveAccountNumber,
} from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';
import {
  attachSellerIdentityToSubaccount,
  findPaystackSubaccountForSeller,
  getIdentityFromAuthHeader,
  recordFromSubaccount,
  saveSellerPayout,
  type SellerIdentity,
  type SellerPayoutRecord,
} from '@/lib/sellerPayoutStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

function uniqueIds(ids: Array<string | null | undefined>) {
  return [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))];
}

function extractPayoutFromUser(user: Record<string, unknown> | null | undefined) {
  if (!user) return null;

  const nested = user.sellerPayout as Record<string, unknown> | undefined;
  const subaccountCode =
    (user.paystackSubaccountCode as string | undefined) ||
    (nested?.paystackSubaccountCode as string | undefined);

  if (!subaccountCode) return null;

  return {
    subaccountCode,
    accountName:
      (user.payoutAccountName as string | undefined) ||
      (nested?.payoutAccountName as string | undefined) ||
      '',
    businessName:
      (user.payoutBusinessName as string | undefined) ||
      (nested?.payoutBusinessName as string | undefined) ||
      '',
    bankCode:
      (user.payoutBankCode as string | undefined) ||
      (nested?.payoutBankCode as string | undefined) ||
      '',
    accountNumber:
      (user.payoutAccountNumber as string | undefined) ||
      (nested?.payoutAccountNumber as string | undefined) ||
      '',
  };
}

function identityFromUser(
  user: Record<string, unknown> | null | undefined,
  fallback: SellerIdentity
): SellerIdentity {
  if (!user) return fallback;

  return {
    ids: uniqueIds([
      ...fallback.ids,
      user._id as string,
      user.id as string,
      user.userId as string,
    ]),
    email: (user.email as string | undefined) || fallback.email,
    name: (user.name as string | undefined) || fallback.name,
  };
}

async function fetchCurrentUser(authHeader: string) {
  const response = await axios.get(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return response.data as Record<string, unknown>;
}

async function persistPayoutOnBackend(authHeader: string, payout: SellerPayoutRecord) {
  const payload = {
    paystackSubaccountCode: payout.subaccountCode,
    payoutBankCode: payout.bankCode,
    payoutAccountNumber: payout.accountNumber,
    payoutAccountName: payout.accountName,
    payoutBusinessName: payout.businessName,
    sellerPayout: {
      paystackSubaccountCode: payout.subaccountCode,
      payoutBankCode: payout.bankCode,
      payoutAccountNumber: payout.accountNumber,
      payoutAccountName: payout.accountName,
      payoutBusinessName: payout.businessName,
    },
  };

  await axios.patch(`${API_URL}/api/users/me`, payload, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

async function resolvePayout(
  authHeader: string,
  identity: SellerIdentity
): Promise<{ payout: SellerPayoutRecord | null; identity: SellerIdentity }> {
  let resolvedIdentity = identity;
  let backendUser: Record<string, unknown> | null = null;

  try {
    backendUser = await fetchCurrentUser(authHeader);
    resolvedIdentity = identityFromUser(backendUser, identity);
  } catch (error) {
    console.error('Failed to fetch current seller profile', error);
  }

  const backendPayout = extractPayoutFromUser(backendUser);
  if (backendPayout?.subaccountCode) {
    const payout: SellerPayoutRecord = {
      userId: resolvedIdentity.ids[0] || 'unknown',
      ...backendPayout,
      updatedAt: new Date().toISOString(),
    };
    await saveSellerPayout(payout, resolvedIdentity.ids);
    return { payout, identity: resolvedIdentity };
  }

  const paystackSubaccount = await findPaystackSubaccountForSeller(resolvedIdentity);
  if (paystackSubaccount) {
    const tagged = await attachSellerIdentityToSubaccount(
      paystackSubaccount,
      resolvedIdentity
    );
    const payout = recordFromSubaccount(
      tagged,
      resolvedIdentity.ids[0] || paystackSubaccount.subaccount_code
    );
    await saveSellerPayout(payout, resolvedIdentity.ids);

    try {
      await persistPayoutOnBackend(authHeader, payout);
    } catch (error) {
      console.error('Failed to persist recovered payout on backend', error);
    }

    return { payout, identity: resolvedIdentity };
  }

  return { payout: null, identity: resolvedIdentity };
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const authIdentity = getIdentityFromAuthHeader(authHeader);
    if (authIdentity.ids.length === 0) {
      return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, bankCode, accountNumber } = body;

    if (!businessName || !bankCode || !accountNumber) {
      return NextResponse.json(
        { message: 'Business name, bank, and account number are required' },
        { status: 400 }
      );
    }

    const { payout: existing, identity } = await resolvePayout(authHeader, authIdentity);
    if (existing?.subaccountCode) {
      return NextResponse.json({
        subaccountCode: existing.subaccountCode,
        accountName: existing.accountName,
        businessName: existing.businessName,
        bankCode: existing.bankCode,
        accountNumber: existing.accountNumber,
        message: 'Existing payout account recovered',
      });
    }

    const resolved = await resolveAccountNumber(String(accountNumber), String(bankCode));

    let subaccount;
    try {
      subaccount = await createSubaccount({
        businessName: String(businessName),
        bankCode: String(bankCode),
        accountNumber: String(accountNumber),
        sellerIds: identity.ids,
        email: identity.email,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('already')) {
        const recovered = await findPaystackSubaccountForSeller(identity);
        if (recovered) {
          subaccount = await attachSellerIdentityToSubaccount(recovered, identity);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const payoutRecord: SellerPayoutRecord = {
      userId: identity.ids[0],
      subaccountCode: subaccount.subaccount_code,
      accountName: resolved.account_name,
      businessName: String(businessName),
      bankCode: String(bankCode),
      accountNumber: String(accountNumber),
      updatedAt: new Date().toISOString(),
    };

    await saveSellerPayout(payoutRecord, identity.ids);

    try {
      await persistPayoutOnBackend(authHeader, payoutRecord);
    } catch (error) {
      console.error('Backend payout persistence failed; Paystack remains source of truth', error);
    }

    return NextResponse.json({
      subaccountCode: payoutRecord.subaccountCode,
      accountName: payoutRecord.accountName,
      businessName: payoutRecord.businessName,
      bankCode: payoutRecord.bankCode,
      accountNumber: payoutRecord.accountNumber,
      message: 'Payout account connected successfully',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create subaccount';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const identity = getIdentityFromAuthHeader(authHeader);
    if (identity.ids.length === 0) {
      return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
    }

    const { payout } = await resolvePayout(authHeader, identity);

    if (!payout) {
      return NextResponse.json({
        subaccountCode: null,
        accountName: null,
        businessName: null,
        bankCode: null,
        accountNumber: null,
      });
    }

    return NextResponse.json({
      subaccountCode: payout.subaccountCode,
      accountName: payout.accountName,
      businessName: payout.businessName,
      bankCode: payout.bankCode,
      accountNumber: payout.accountNumber,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch payout details';
    return NextResponse.json({ message }, { status: 500 });
  }
}
