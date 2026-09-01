import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {
  createSubaccount,
  resolveAccountNumber,
} from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

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

    try {
      await axios.patch(
        `${API_URL}/api/users/me`,
        {
          paystackSubaccountCode: subaccount.subaccount_code,
          payoutBankCode: bankCode,
          payoutAccountNumber: accountNumber,
          payoutAccountName: resolved.account_name,
          payoutBusinessName: businessName,
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
      console.error('Failed to persist subaccount on user profile', error);
    }

    return NextResponse.json({
      subaccountCode: subaccount.subaccount_code,
      accountName: resolved.account_name,
      businessName: subaccount.business_name,
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

    const response = await axios.get(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return NextResponse.json({
      subaccountCode: response.data?.paystackSubaccountCode || null,
      accountName: response.data?.payoutAccountName || null,
      businessName: response.data?.payoutBusinessName || null,
      bankCode: response.data?.payoutBankCode || null,
      accountNumber: response.data?.payoutAccountNumber || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch payout details';
    return NextResponse.json({ message }, { status: 500 });
  }
}
