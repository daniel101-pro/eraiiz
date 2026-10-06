import { NextRequest, NextResponse } from 'next/server';
import { listBanks } from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';
import { paystackBankQuery } from '@/lib/geoLocation';

export async function GET(request: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    const countryCode = request.nextUrl.searchParams.get('country') || 'NG';
    const query = paystackBankQuery(countryCode);
    const banks = await listBanks(query.country, query.currency);
    const activeBanks = banks
      .filter((bank) => bank.active)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks: activeBanks, country: countryCode.toUpperCase() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch banks';
    return NextResponse.json({ message }, { status: 500 });
  }
}
