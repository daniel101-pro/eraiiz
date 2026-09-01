import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {
  createSubaccount,
  resolveAccountNumber,
} from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';
import {
  getSellerPayout,
  getUserIdFromAuthHeader,
  saveSellerPayout,
} from '@/lib/sellerPayoutStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

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
      null,
    businessName:
      (user.payoutBusinessName as string | undefined) ||
      (nested?.payoutBusinessName as string | undefined) ||
      null,
    bankCode:
      (user.payoutBankCode as string | undefined) ||
      (nested?.payoutBankCode as string | undefined) ||
      null,
    accountNumber:
      (user.payoutAccountNumber as string | undefined) ||
      (nested?.payoutAccountNumber as string | undefined) ||
      null,
  };
}

async function persistPayoutOnBackend(
  authHeader: string,
  payout: {
    subaccountCode: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    businessName: string;
  }
) {
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

    const userId = getUserIdFromAuthHeader(authHeader);
    if (!userId) {
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

    const resolved = await resolveAccountNumber(String(accountNumber), String(bankCode));
    const subaccount = await createSubaccount({
      businessName: String(businessName),
      bankCode: String(bankCode),
      accountNumber: String(accountNumber),
    });

    const payoutRecord = {
      userId,
      subaccountCode: subaccount.subaccount_code,
      accountName: resolved.account_name,
      businessName: String(businessName),
      bankCode: String(bankCode),
      accountNumber: String(accountNumber),
      updatedAt: new Date().toISOString(),
    };

    await saveSellerPayout(payoutRecord);

    try {
      await persistPayoutOnBackend(authHeader, {
        subaccountCode: payoutRecord.subaccountCode,
        bankCode: payoutRecord.bankCode,
        accountNumber: payoutRecord.accountNumber,
        accountName: payoutRecord.accountName,
        businessName: payoutRecord.businessName,
      });
    } catch (error) {
      console.error('Backend payout persistence failed; using local payout store', error);
    }

    return NextResponse.json({
      subaccountCode: subaccount.subaccount_code,
      accountName: resolved.account_name,
      businessName: subaccount.business_name,
      bankCode,
      accountNumber,
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

    const userId = getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid auth token' }, { status: 401 });
    }

    let payout = await getSellerPayout(userId);

    try {
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const backendPayout = extractPayoutFromUser(response.data);
      if (backendPayout?.subaccountCode) {
        payout = {
          userId,
          subaccountCode: backendPayout.subaccountCode,
          accountName: backendPayout.accountName || '',
          businessName: backendPayout.businessName || '',
          bankCode: backendPayout.bankCode || '',
          accountNumber: backendPayout.accountNumber || '',
          updatedAt: new Date().toISOString(),
        };
        await saveSellerPayout(payout);
      }
    } catch (error) {
      console.error('Failed to fetch payout from backend profile', error);
    }

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
