import { NextResponse } from 'next/server';
import { listBanks } from '@/lib/paystack';
import { isPaystackConfigured } from '@/lib/paymentConfig';

export async function GET() {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json(
        { message: 'Paystack is not configured' },
        { status: 503 }
      );
    }

    const banks = await listBanks();
    const activeBanks = banks
      .filter((bank) => bank.active)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks: activeBanks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch banks';
    return NextResponse.json({ message }, { status: 500 });
  }
}
